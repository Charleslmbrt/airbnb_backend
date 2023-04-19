const express = require("express");
// const { success, err } = require("../status");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

// import models
const User = require("../models/User");
const Room = require("../models/Room");

// import middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");

// account Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME_CLOUDINARY,
  api_key: process.env.API_KEY_CLOUDINARY,
  api_secret: process.env.API_SECRET_CLOUDINARY,
});

// Convert buffer as base64 format
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Create room
router.post(
  "/room/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const {
        title,
        city,
        country,
        address,
        description,
        price,
        ratingValue,
        reviews,
        type,
        guests,
        bedrooms,
        beds,
        bathrooms,
        options,
        location_lat,
        location_lng,
      } = req.body;

      // const location_lat = req.body.location_lat;
      // const location_lng = req.body.location_lng;

      const locationTab = {
        lat: parseFloat(location_lat),
        lng: parseFloat(location_lng),
      };

      if (title) {
        // console.log("locationTab", locationTab);
        const newRoom = new Room({
          title: title,
          city: city,
          country: country,
          address: address,
          description: description,
          price: price,
          ratingValue: ratingValue,
          reviews: reviews,
          type: type,
          mainInfos: {
            guests: guests,
            bedrooms: bedrooms,
            beds: beds,
            bathrooms: bathrooms,
          },
          location: locationTab,
          options: options,
          owner: req.user._id,
        });

        if (!Array.isArray(req.files.pictures)) {
          if (req.files.pictures.mimetype.slice(0, 5) !== "image") {
            return res.status(400).json("You must send images");
          }
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.pictures),
            {
              folder: `airbnb/${newRoom._id}`,
            }
          );

          newRoom.picture = result;
          newRoom.picturesArray.push(result);
        } else {
          for (let i = 0; i < req.files.pictures.length; i++) {
            const picture = req.files.pictures[i];
            if (picture.mimetype.slice(0, 5) !== "image") {
              return res.status(400).json("You must send images");
            }
            if (i === 0) {
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `airbnb/${newRoom._id}`,
                }
              );

              newRoom.picture = result;
              newRoom.picturesArray.push(result);
            } else {
              const result = await cloudinary.uploader.upload(
                convertToBase64(picture),
                {
                  folder: `airbnb/${newRoom._id}`,
                }
              );
              newRoom.picturesArray.push(result);
            }
          }
        }

        await newRoom.save();

        const user = await User.findOne(req.user._id);
        let tabRooms = user.rooms;
        tabRooms.push(newRoom._id);
        await User.findByIdAndUpdate(req.user._id, {
          rooms: tabRooms,
        });
        res.status(200).json(newRoom);
      } else {
        res.status(400).json("Parameters missing");
      }
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
);

// Get rooms
router.get("/rooms", async (req, res) => {
  try {
    const filters = {};

    if (req.query.address) {
      filters.address = new RegExp(req.query.address, "i");
    }

    if (req.query.type) {
      filters.type = new RegExp(req.query.type, "i");
    }

    if (req.query.priceMin) {
      filters.price = {};
      filters.price.$gte = req.query.priceMin;
    }

    if (req.query.priceMax) {
      if (filters.price) {
        filters.price.$lte = req.query.priceMax;
      } else {
        filters.price = {};
        filters.price.$lte = req.query.priceMax;
      }
    }

    // Création d'un objet sort qui servira à gérer le tri
    let sort = {};
    // Si on reçoit un query sort === "price-desc"
    if (req.query.sort === "price-desc") {
      // On réassigne cette valeur à sort
      sort = { price: -1 };
    } else if (req.query.sort === "price-asc") {
      // Si la valeur du query est "price-asc" on réassigne cette autre valeur
      sort = { price: 1 };
    }
    // Création de la variable page qui vaut, pour l'instant, undefined
    let page;
    // Si le query page n'est pas un nombre >= à 1
    if (Number(req.query.page) < 1) {
      // page sera par défaut à 1
      page = 1;
    } else {
      // Sinon page sera égal au query reçu
      page = Number(req.query.page);
    }
    // La variable limit sera égale au query limit reçu
    let limit = Number(req.query.limit);
    // On va chercher les offres correspondant aux query de filtre reçus grâce à filters, sort et limit. On populate la clef owner en n'affichant que sa clef account
    const rooms = await Room.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) // ignorer les x résultats
      .limit(limit); // renvoyer y résultats

    // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Room.countDocuments(filters);

    res.json({
      count: count,
      rooms: rooms,
    });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Get one room
router.get("/rooms/:id", async (req, res) => {
  if (req.params.id) {
    try {
      const room = await Room.findById(req.params.id).populate({
        path: "owner",
        select: "account",
      });

      if (room) {
        res.json(room);
      } else {
        res.status(400).json("Room not found");
      }
    } catch (error) {
      res.status(400).json(error.message);
    }
  } else {
    res.status(400).json("Missing room id");
  }
});

// Update room
router.put("/room/update/:id", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      country,
      address,
      type,
      guests,
      bedrooms,
      beds,
      bathrooms,
      pictures,
      location,
      options,
    } = req.body;

    const room = await Room.findById(req.params.id);

    if (room) {
      const userId = req.user._id;
      const roomUserId = room.owner;

      if (String(userId) === String(roomUserId)) {
        if (
          title ||
          description ||
          price ||
          city ||
          country ||
          address ||
          type ||
          guests ||
          bedrooms ||
          beds ||
          bathrooms ||
          location ||
          options
        ) {
          const newObj = {};

          if (title) {
            newObj.title = title;
          }
          if (description) {
            newObj.description = description;
          }
          if (price) {
            newObj.price = price;
          }
          if (city) {
            newObj.city = city;
          }
          if (country) {
            newObj.country = country;
          }
          if (address) {
            newObj.address = address;
          }
          if (type) {
            newObj.type = type;
          }
          if (guests) {
            newObj.guests = guests;
          }
          if (bedrooms) {
            newObj.bedrooms = bedrooms;
          }
          if (beds) {
            newObj.beds = beds;
          }
          if (bathrooms) {
            newObj.bathrooms = bathrooms;
          }
          if (location) {
            newObj.location = [location.lat, location.lng];
          }
          if (options) {
            newObj.options = options;
          }

          await Room.findByIdAndUpdate(req.params.id, newObj);

          const roomUpdated = await Room.findById(req.params.id);

          res.json(success(roomUpdated));
        } else {
          res.status(400).json("Missing parameters");
        }
      } else {
        res.status(401).json("Unauthorized");
      }
    } else {
      res.status(400).json("Room not found");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Delete room
router.delete("/room/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (room) {
      const userId = req.user._id;
      const roomUserId = room.owner;

      if (String(userId) === String(roomUserId)) {
        await Room.findByIdAndRemove(req.params.id);

        const user = await User.findById(userId);

        let tab = user.rooms;
        let num = tab.indexOf(req.params.id);
        tab.splice(num, 1);
        // on supprime du tableau "rooms" l'id de l'annonce qui vient d'être supprimée en BDD
        await User.findByIdAndUpdate(userId, {
          rooms: tab,
        });
        // on modifie "rooms" en BDD : l'annonce supprimée n'apparaitra plus dans le tableau des annonces de l'utilisateur

        res.status(200).json("Room deleted");
      } else {
        res.status(400).json("Unauthorized");
      }
    } else {
      res.status(400).json("Room not found");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Create favorite room
router.post("/rooms/favorites/:id", isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (room) {
      const user = await User.findById(req.user._id);

      if (user) {
        let favoritesTab = user.favorites;

        if (favoritesTab.includes(room._id)) {
          res.status(400).json("Room already in favorites");
        } else {
          favoritesTab.push(room._id);

          await User.findByIdAndUpdate(req.user._id, {
            favorites: favoritesTab,
          });

          res.json("Room added to favorites");
        }
      } else {
        res.status(400).json("User not found");
      }
    } else {
      res.status(400).json("Room not found");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

// Delete favorite room
router.delete(
  "/rooms/favorites/delete/:id",
  isAuthenticated,
  async (req, res) => {
    try {
      const room = await Room.findById(req.params.id);

      if (room) {
        const user = await User.findById(req.user._id);

        if (user) {
          let favoritesTab = user.favorites;

          if (favoritesTab.includes(room._id)) {
            favoritesTab.splice(favoritesTab.indexOf(room._id), 1);

            await User.findByIdAndUpdate(req.user._id, {
              favorites: favoritesTab,
            });

            res.json("Room removed from favorites");
          } else {
            res.status(400).json("Room not in favorites");
          }
        } else {
          res.status(400).json("User not found");
        }
      } else {
        res.status(400).json("Room not found");
      }
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
);

module.exports = router;

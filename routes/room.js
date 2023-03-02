const express = require("express");
const { success, err } = require("../status");
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

// Upload file
router.post("/upload", fileUpload(), async (req, res) => {
  try {
    const imgConvert = convertToBase64(req.files.picture);
    const result = await cloudinary.uploader.upload(imgConvert);
    console.log(result);
    res.json(success("UPLOAD OK"));
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

// Create room
router.post("/room/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      country,
      ratingValue,
      reviews,
      type,
      travelers,
      rooms,
      beds,
      bathrooms,
      pictures,
      location,
      options,
    } = req.body;

    if (
      title &&
      description &&
      price &&
      city &&
      country &&
      type &&
      travelers &&
      rooms &&
      beds &&
      bathrooms
    ) {
      // Create array for location data
      const locationTab = [location.lat, location.lng];
      const newRoom = new Room({
        title: title,
        description: description,
        price: price,
        city: city,
        country: country,
        ratingValue: ratingValue,
        reviews: reviews,
        type: type,
        mainInfos: {
          travelers: travelers,
          rooms: rooms,
          beds: beds,
          bathrooms: bathrooms,
        },
        pictures: pictures,
        location: locationTab,
        options: options,
        owner: req.user._id,
      });

      await newRoom.save();

      const user = await User.findOne(req.user._id);
      let tabRooms = user.rooms;
      tabRooms.push(newRoom._id);
      await User.findByIdAndUpdate(req.user._id, {
        rooms: tabRooms,
      });
      res.status(200).json(success(newRoom));
    } else {
      res.status(400).json(err("Parameters missing"));
    }
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

// Get rooms
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).populate({
      path: "owner",
      select: "account",
    });
    res.json(success(rooms));
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

// Get one room
router.get("/room/:id", async (req, res) => {
  if (req.params.id) {
    try {
      const room = await Room.findById(req.params.id).populate({
        path: "owner",
        select: "account",
      });

      if (room) {
        res.json(success(room));
      } else {
        res.status(400).json(err("Room not found"));
      }
    } catch (error) {
      res.status(400).json(err(error.message));
    }
  } else {
    res.status(400).json(err("Missing room id"));
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
      type,
      travelers,
      rooms,
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
          type ||
          travelers ||
          rooms ||
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
          if (type) {
            newObj.type = type;
          }
          if (travelers) {
            newObj.travelers = travelers;
          }
          if (rooms) {
            newObj.rooms = rooms;
          }
          if (beds) {
            newObj.beds = beds;
          }
          if (bathrooms) {
            newObj.rooms = rooms;
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
          res.status(400).json(err("Missing parameters"));
        }
      } else {
        res.status(401).json(err("Unauthorized"));
      }
    } else {
      res.status(400).json(err("Room not found"));
    }
  } catch (error) {
    res.status(400).json(err(error.message));
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
        // on recherche l'utilisateur en BDD

        let tab = user.rooms;
        let num = tab.indexOf(req.params.id);
        tab.splice(num, 1);
        // on supprime du tableau "rooms" l'id de l'annonce qui vient d'être supprimée en BDD
        await User.findByIdAndUpdate(userId, {
          rooms: tab,
        });
        // on modifie "rooms" en BDD : l'annonce supprimée n'apparaitra plus dans le tableau des annonces de l'utilisateur

        res.status(200).json(success("Room deleted"));
      } else {
        res.status(400).json(err("Unauthorized"));
      }
    } else {
      res.status(400).json(err("Room not found"));
    }
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

module.exports = router;

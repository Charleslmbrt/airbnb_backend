const express = require("express");
const { success, err } = require("../status");
const router = express.Router();

// import models
const User = require("../models/User");
const Room = require("../models/Room");

// import middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/room/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
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

module.exports = router;

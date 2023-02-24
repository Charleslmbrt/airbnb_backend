const express = require("express");
const { success, err } = require("../status");
const router = express.Router();

// import models
const User = require("../models/User");
const Room = require("../models/Room");

// import middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("room/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      ratingValue,
      reviews,
      pictures,
      location,
      options,
    } = req.body;

    if (title && description && price && pictures && location && options) {
      // Create array for location data
      const locationTab = [location.lat, location.lng];
      const newRoom = new Room({
        title: title,
        description: description,
        price: price,
        pictures: pictures,
        location: locationTab,
        option: options,
        owner: req.user,
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

module.exports = router;

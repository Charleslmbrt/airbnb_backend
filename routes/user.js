const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const { success, err } = require("../status");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

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

// import models
const User = require("../models/User");

// import middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { email, lastname, firstname, password } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      res.status(409).json(err("This email has already an account"));
    } else {
      if (email && lastname && firstname && password) {
        const token = uid2(120);
        const salt = uid2(120);
        const hash = SHA256(password + salt).toString(encBase64);
        const access = 0;

        const newUser = new User({
          email: email,
          account: {
            lastname: lastname,
            firstname: firstname,
          },
          token: token,
          hash: hash,
          salt: salt,
          access: access,
        });

        if (req.files.picture.mimetype.slice(0, 5) !== "image") {
          return res.status(400).json(err("You must send image"));
        }
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          {
            folder: `airbnb/avatar/${newUser._id}`,
          }
        );

        newUser.account.picture = result;

        await newUser.save();

        res.json(
          success({
            _id: newUser._id,
            email: newUser.email,
            lastname: newUser.account.lastname,
            firstname: newUser.account.firstname,
            picture: newUser.account.picture,
            token: newUser.token,
          })
        );
      } else {
        res.status(400).json(err("All fields are required"));
      }
    }
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email && password) {
      const user = await User.findOne({ email: email });

      if (user) {
        const checkPassword = SHA256(password + user.salt).toString(encBase64);
        if (checkPassword === user.hash) {
          res.status(200).json(
            success({
              _id: user._id,
              email: user.email,
              lastname: user.account.lastname,
              firstname: user.account.firstname,
              picture: user.account.picture,
              token: user.token,
            })
          );
        } else {
          res.status(401).json(err("Unauthorized"));
        }
      } else {
        res.status(400).json(err("User not found"));
      }
    } else {
      res.status(400).json(err("All fields are required"));
    }
  } catch (error) {
    res.status(400).json(err(error.message));
  }
});

// Get one user
router.get("/user/:id", isAuthenticated, async (req, res) => {
  try {
    if (req.params.id) {
      const user = await User.findById(req.params.id);
      console.log("user", user);

      if (user) {
        res.status(200).json(
          success({
            _id: user._id,
            email: user.email,
            lastname: user.account.lastname,
            firstname: user.account.firstname,
            picture: user.account.picture,
            rooms: user.rooms,
            favorites: user.favorites,
          })
        );
      } else {
        res.status(400).json(err("User not found"));
      }
    } else {
      res.status(400).json(err("Missing id"));
    }
  } catch (error) {
    res.status(400).json(err({ blabla: error.message }));
  }
});

module.exports = router;

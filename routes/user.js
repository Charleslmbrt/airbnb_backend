const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const { success, err } = require("../status");
const router = express.Router();

// import models
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, lastname, firstname, password } = req.body;
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

        await newUser.save();

        res.json(
          success({
            _id: newUser._id,
            email: newUser.email,
            lastname: newUser.account.lastname,
            firstname: newUser.account.firstname,
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

module.exports = router;

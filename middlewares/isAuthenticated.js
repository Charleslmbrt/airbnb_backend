//import models
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");

    // Chercher dans la BD quel utilisateur a ce token
    const user = await User.findOne({ token: token });

    if (user) {
      req.user = user;
      req.access = user.access;
      return next();
    } else {
      return res.status(401).json("Unauthorized");
    }
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;

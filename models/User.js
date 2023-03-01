const mongoose = require("mongoose");

const User = mongoose.model("Users", {
  email: {
    required: true,
    unique: true,
    type: String,
  },
  account: {
    lastname: String,
    firstname: String,
    picture: Object,
  },
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
  token: String,
  salt: String,
  hash: String,
  access: Number,
});

module.exports = User;

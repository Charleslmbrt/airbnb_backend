const mongoose = require("mongoose");

const Room = mongoose.model("Rooms", {
  title: String,
  description: String,
  price: Number,
  ratingValue: Number,
  reviews: Number,
  pictures: { type: Array, default: [] },
  location: { type: Array, default: [] },
  options: { type: Array, default: [] },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Room;

const mongoose = require("mongoose");

const Room = mongoose.model("Room", {
  title: String,
  city: String,
  country: String,
  description: String,
  price: Number,
  ratingValue: Number,
  reviews: Number,
  type: String,
  mainInfos: {
    travelers: Number,
    rooms: Number,
    beds: Number,
    bathrooms: Number,
  },
  pictures: { type: Array, default: [] },
  location: { type: Array, default: [] },
  options: { type: Array, default: [] },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Room;

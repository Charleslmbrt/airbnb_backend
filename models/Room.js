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
    guests: Number,
    bedrooms: Number,
    beds: Number,
    bathrooms: Number,
  },
  picture: { type: mongoose.Schema.Types.Mixed, default: {} },
  picturesArray: { type: Array, default: [] },
  location: { type: [Number], default: [] },

  options: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Room;

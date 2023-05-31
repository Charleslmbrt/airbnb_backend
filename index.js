const express = require("express");
const app = express();
const morgan = require("morgan");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");

// middlewares
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());

mongoose
  .set("strictQuery", false)
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log("Connected to the DB!");
  });

//import routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const roomRoutes = require("./routes/room");
app.use(roomRoutes);

app.all("*", (req, res) => {
  res.status(404).json("This route doesn't exist");
});

const defaultPort = 8080;
const PORT = process.env.PORT;

app.listen(PORT || defaultPort, () => {
  console.log(`Server has started on port ${PORT || defaultPort}.`);
});

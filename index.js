const express = require("express");
const app = express();
const morgan = require("morgan");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");

// middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

mongoose
  .set("strictQuery", false)
  .connect("mongodb://localhost/airbnb")
  .then(() => {
    console.log("Connected to the DB!");
  });

const defaultPort = 3000;
const PORT = process.env.PORT;

app.listen(PORT || defaultPort, () => {
  console.log(`Server has started on port ${PORT || defaultPort}.`);
});

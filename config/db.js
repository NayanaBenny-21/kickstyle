const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// optional listeners (fine to keep)
mongoose.connection.on("connected", () =>
  console.log("Mongoose default connection open")
);
mongoose.connection.on("disconnected", () =>
  console.log("Mongoose default connection disconnected")
);

module.exports = connectDB;

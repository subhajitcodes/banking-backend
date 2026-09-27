import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");
  } catch (e) {
    console.log("Database connection failed");
    process.exit(1);
  }
}

export default connectDB;

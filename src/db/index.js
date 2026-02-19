import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10, // Reduced for serverless concurrency
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // Don't exit process in serverless
  }
};


export default connectDB; 
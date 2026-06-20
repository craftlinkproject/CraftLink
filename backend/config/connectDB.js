// Import mongoose for MongoDB connection
import mongoose from "mongoose";
/**
 * Connects to MongoDB using the URI from environment variables.
 * - Logs helpful messages for connection status
 * - Attaches event handlers for error and disconnect events
 */
const connectDb = async () => {
  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGODB_URL;
    if (!uri) {
      // URI not defined, log error and exit
      console.error("MONGODB_URL is not defined in the environment");
      return;
    }
    // Attempt to connect to MongoDB
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    // Handle connection errors
    mongoose.connection.on("error", (err) =>
      console.error("MongoDB connection error:", err),
    );
    // Handle disconnection events
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected"),
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};
// Export the connection function for use in app entry point
export default connectDb;
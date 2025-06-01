import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // ✅ Load environment variables

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

const dbConnect = async (): Promise<void> => {
  if (connection.isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is not defined in environment variables.");
  }

  try {
     console.log("connecting....");
    const db = await mongoose.connect(process.env.MONGODB_URI);
    console.log("connecting....")
    
    connection.isConnected = db.connections[0].readyState;
    console.log(`✅ Database Connected: ${db.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

export default dbConnect;

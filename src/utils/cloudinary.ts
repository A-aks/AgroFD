import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fix: Use a function for params instead of an object
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "avatars", // Cloudinary folder
      format: "png", // Convert all uploads to PNG format
      public_id: file.originalname.split(".")[0], // Use original filename (without extension)
      transformation: [{ width: 500, height: 500, crop: "limit" }], // Image optimization
    };
  },
});
const upload = multer({ storage });

export { upload, cloudinary };

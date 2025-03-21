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
// Dynamic folder storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "uploads"; // Default folder

    // Determine folder based on request path
    if (req.baseUrl.includes("/avatars")) {
      folder = "avatars";
    } else if (req.baseUrl.includes("/products")) {
      folder = "products";
    } else if (req.baseUrl.includes("/categories")) {
      folder = "categories";
    }

    return {
      folder, // ✅ Set folder dynamically
      format: "png", // Convert to PNG
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Unique filename
      transformation: [{ width: 500, height: 500, crop: "limit" }],
    };
  },
});

const upload = multer({ storage });

export { upload, cloudinary };

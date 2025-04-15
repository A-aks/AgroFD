// src/utils/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer, { Multer } from "multer";
import { Request } from "express";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req: Request, file: Express.Multer.File) => {
    return {
      folder: "uploads",
      format: "webp", // Still convert to webp for better performance
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      transformation: [{ width: 1200, height: 1200, crop: "limit" }]
    };
  }
});

// Initialize Multer with TypeScript typing
const upload: Multer = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max files
  },
  fileFilter: (req, file, cb) => {
    // Accepted image MIME types
    const allowedMimes = [
      'image/jpeg',  // JPG
      'image/jpg',   // JPG alternative
      'image/png',   // PNG
      'image/webp'   // WebP (optional)
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  }
});

// Typed upload middlewares
export const uploadMiddleware = {
  singleImage: upload.single('image'),
  multipleImages: upload.array('images', 5),
  mixedUpload: upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ])
};

export { upload, cloudinary };
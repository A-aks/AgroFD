import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer, { Multer } from "multer";
import express, { Request } from "express";

// Extended types for FormData with files
declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
    }
  }
}

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
      format: "webp", // Modern format
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
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Typed upload middlewares
export const uploadMiddleware = {
  singleImage: upload.single('image'), // For single image
  multipleImages: upload.array('images', 5), // For multiple images
  mixedUpload: upload.fields([ // For forms with different file types
    { name: 'avatar', maxCount: 1 },
    { name: 'documentPictureFile', maxCount: 1 }
  ])
};

export { upload, cloudinary };
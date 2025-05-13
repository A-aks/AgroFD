import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Ensure temp directory exists
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Disk storage config
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, tempDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter for allowed file types and sizes
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
  const isVideo = ['video/mp4', 'video/mkv'].includes(file.mimetype);

  if (!isImage && !isVideo) {
    return cb(new Error("Only images (JPEG, PNG, WebP) and videos (MP4, MKV) are allowed"));
  }

  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 30 * 1024 * 1024; // 30MB

  // Note: file.size is only available AFTER multer processes it.
  // So we use a workaround via `limits` instead.
  cb(null, true);
};

// Define multer with file size limit (whichever is highest: video)
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // allow max 30MB per file
  fileFilter
});

export const uploadMiddleware = {
  singleImage: (fieldName: string) => upload.single(fieldName),
  multipleMedia: upload.array('media', 10),
  mixedUpload: upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ])
};

import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { Request } from "express";

// ✅ Use OS temporary directory (safe for Vercel)
const tempDir = path.join(os.tmpdir(), "uploads");

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// ✅ Disk storage config using /tmp/uploads
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

// ✅ File type filtering
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

  cb(null, true); // Accept the file
};

// ✅ Multer setup with max file size limit (30MB)
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter
});

// ✅ Export middleware variants
export const uploadMiddleware = {
  singleImage: (fieldName: string) => upload.single(fieldName),
  multipleMedia: upload.array('media', 10),
  mixedUpload: upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ])
};

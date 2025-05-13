// src/utils/uploadToCloudinary.ts
import cloudinary from '../utils/cloudinary';  // ✅ CORRECT
import streamifier from 'streamifier';

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `uploads/${folder}`,
        resource_type: 'auto', // handles images & videos
        format: 'webp',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error || new Error('Upload failed'));
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

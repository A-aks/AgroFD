import { Request } from "express";

// Define UserInfo type based on actual user structure
interface UserInfo {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  phone: string;
  altPhone?: string;
  role: string;
  avatar: string;
}

// Extend Express Request with userInfo nested inside `user`
export interface CustomRequest<T = unknown> extends Request {
  user?: { userInfo: UserInfo }; // ✅ Ensures correct structure
  body: T;
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

// src/types/CustomRequest.ts
import { Request } from "express";

export interface UserInfo {
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

// Unified request interface
export interface CustomRequest<T = any> extends Request {
  user?: {
    id: string;
    role: string;
    city:string;
    userInfo?: UserInfo;
  };
  body: T;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

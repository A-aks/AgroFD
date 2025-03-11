import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import AuthUser from "../models/AuthUser";
import {AuthenticatedRequest} from '../middleware/Validatetoken';

// ✅ Register User
export const RegisterUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, city, address, role, phone, altPhone } = req.body;

  // Validate required fields
  if (!name || !email || !password || !city || !address || !role || !phone) {
    res.status(400);
    throw new Error("All fields except altPhone are mandatory");
  }

  // Check if user exists
  const checkUser = await AuthUser.findOne({ email });
  if (checkUser) {
    res.status(400);
    throw new Error("This email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password:", hashedPassword);

  // Ensure altPhone is stored as an empty string if not provided
  const newUser = await AuthUser.create({
    name,
    email,
    password: hashedPassword,
    city,
    role,
    address,
    phone,
    altPhone: altPhone ?? "", // If altPhone is undefined or null, store ""
  });

  if (newUser) {
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ✅ Login User
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory");
  }

  const userInfo = await AuthUser.findOne({ email });

  if (userInfo && (await bcrypt.compare(password, userInfo.password))) {
    const accessToken = jwt.sign(
      {
        userInfo: {
          name: userInfo.name,
          email: userInfo.email,
          address: userInfo.address,
          city: userInfo.city,
          phone: userInfo.phone,
          role: userInfo.role,
          avatar: userInfo.avatar,
          altPhone: userInfo.altPhone, // It can be an empty string
          id: userInfo.id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "30d",
      }
    );

    res.status(200).json({ access_token: accessToken });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// ✅ Get Current User Info
export const GetCurrentInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userData) {
    res.status(401);
    throw new Error("Unauthorized: User data not found");
  }

  const { name, email, address, city, phone, role, altPhone, avatar, id } = req.userData;

  res.status(200).json({
    status: "ok",
    message: {
      id,
      name,
      email,
      address,
      city,
      phone,
      role,
      altPhone: altPhone || "",
      avatar,
    },
  });
});


// ✅ Update User Info (email and role are NOT updateable)
export const UpdateUserInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customReq = req as AuthenticatedRequest;
  const userId= customReq.userData?.id

  if (!userId) {
    res.status(401);
    throw new Error("user Unauthorized");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const uploadedImage = req.file.path; // ✅ Extract Cloudinary URL from file object

  const { name, address, city, phone, altPhone, avatar } = req.body;

  const user = await AuthUser.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }


  // Prevent updates to email and role
  user.name = name ?? user.name;
  user.address = address ?? user.address;
  user.city = city ?? user.city;
  user.phone = phone ?? user.phone;
  user.altPhone = altPhone ?? user.altPhone;
  user.avatar = avatar ?? uploadedImage;

  const updatedUser = await user.save();

  res.status(200).json({
    status: "success",
    message: "User information updated successfully",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email, // Unchanged
      address: updatedUser.address,
      role: updatedUser.role,   // Unchanged
      city: updatedUser.city,
      phone: updatedUser.phone,
      altPhone: updatedUser.altPhone,
      avatar: updatedUser.avatar,
    },
  });
});

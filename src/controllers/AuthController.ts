import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AuthUser from "../models/AuthUser";

// Extend Request interface to include userInfo
interface CustomRequest extends Request {
  userInfo?: {
    name: string;
    email: string;
    id: string;
  };
}

// ✅ Register User
export const RegisterUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, city, address,role } = req.body;

  if (!name || !email || !password || !city || !address || !role) {
    res.status(400);
    throw new Error("All fields are mandatory");
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

  // Insert user
  const newUser = await AuthUser.create({
    name,
    email,
    password: hashedPassword,
    city,
    role,
    address,
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
          id: userInfo.id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET as string, // Ensure ENV is properly set
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
export const GetCurrentInfo = asyncHandler(async (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  res.status(200).json({ status: "ok", message: customReq.userInfo });
});

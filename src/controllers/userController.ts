import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import User from "../models/User_Model"; // Ensure this file is also converted to TypeScript

// 🟢 Get all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find();
    res.status(200).json(users);
});

// 🟢 Get a single user by ID
export const getSingleUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params._id);
    
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json(user);
});

// 🟢 Create a new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    console.log("The Request is:", req.body);

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        res.status(400);
        throw new Error("All fields are mandatory");
    }

    const userinfo = await User.create({ name, email, phone, password });

    res.status(201).json(userinfo);
});

// 🟢 Update a user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const updatedUser = await User.findByIdAndUpdate(req.params._id, req.body, { new: true });

    res.status(200).json(updatedUser);
});

// 🟢 Delete a user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    await User.deleteOne({ _id: req.params._id });

    res.status(200).json({ message: "User deleted successfully" });
});

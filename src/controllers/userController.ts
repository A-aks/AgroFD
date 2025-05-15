import { Request, Response } from "express";
import { User, IFarmingDetails, UserRole, UserHistory } from "../models/User_Model";
import streamifier from 'streamifier';
import { uploadMiddleware } from "../middleware/multer";
import {uploadToCloudinary}from "../utils/uploadToCloudinary"
import mongoose from "mongoose";
import fs from "fs/promises";
import { CustomRequest } from "../types/CustomRequest";


// // ✅ Get all users with pagination (Admin Only)
// export const getAllUsers = async (req: CustomRequest, res: Response): Promise<void> => {
//   try {
//     // Parse and validate pagination params
//     const page = Math.max(1, parseInt(req.query.page as string)) || 1;
//     const limit = Math.max(1, parseInt(req.query.limit as string)) || 10;
//     const skip = (page - 1) * limit;

//     // Get total number of users
//     const totalUsers = await User.countDocuments();
//     const totalPages = Math.ceil(totalUsers / limit);

//     // Fetch users with pagination and sort by latest
//     const users = await User.find()
//       .select("-password")
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     // Respond with paginated users
//     res.status(200).json({
//       users,
//       pagination: {
//         currentPage: page,
//         totalPages,
//         totalUsers,
//         limit
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ message: "Error fetching users", error });
//   }
// };
export const getAllUsers = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Dynamic search/filter
    const search = req.query.search?.toString().trim() || "";
    const role = req.query.role?.toString();

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// ✅ Get user by ID (Only for Authenticated Users)
export const getUserById = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    // Get user without password
    const user = await User.findById(req.params.id).select("-password -__v").lean();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Type assertion for user with farming details
    const userWithFarming = user as typeof user & {
      farmingDetails?: IFarmingDetails;
    };

    // Create base response object
    const response: any = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      city: user.city,
      isDisabled: user.isDisabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar,
      phone: user.phone,
      altPhone: user.altPhone,
      kyc: user.kyc || { isVerified: false }
    };

    // Only include farmingDetails if user is a farmer and has data
    if (user.role === 'farmer' && user.farmingDetails) {
      response.farmingDetails = {
        certifications: user.farmingDetails.certifications || [],
        crops: user.farmingDetails.crops || [],
        machinery: user.farmingDetails.machinery || [],
        landSize: user.farmingDetails.landSize,
        experienceYears: user.farmingDetails.experienceYears,
        irrigationType: user.farmingDetails.irrigationType,
        soilType: user.farmingDetails.soilType,
        organicPractices: user.farmingDetails.organicPractices
      };
    }

    // Only include businessDetails if user is a business and has data
    if (user.role === 'business' && user.businessDetails) {
      response.businessDetails = {
        businessType: user.businessDetails.businessType,
        businessName: user.businessDetails.businessName,
        gstNumber: user.businessDetails.gstNumber,
        businessRegistrationNumber: user.businessDetails.businessRegistrationNumber,
        businessAddress: user.businessDetails.businessAddress
      };
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// ✅ Create a new user (Admin Only)

export const createUser = async (req: CustomRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction({ maxTimeMS: 30000 });

  try {
   
    
    const files = req.files as {
      avatar?: Express.Multer.File[],
      documentImage?: Express.Multer.File[]
    } || {};

    const body = req.body;
    
    const readAndUpload = async (file: Express.Multer.File | undefined, folder: string) => {
      if (!file) return null;
      try {
       // console.log("try section",folder);
        const buffer = await fs.readFile(file.path);
        const result = await uploadToCloudinary(buffer, folder);
        await fs.unlink(file.path);
        return result;
      } catch (err) {
        if (file?.path) await fs.unlink(file.path).catch(() => null);
        throw err;
      }
    };

    const [avatarUpload, documentUpload] = await Promise.all([
      readAndUpload(files.avatar?.[0], "avatars"),
      readAndUpload(files.documentImage?.[0], "kyc-documents")
    ]);

    const farmingDetails = body.farmingDetails ? JSON.parse(body.farmingDetails) : null;
    const businessDetails = body.businessDetails ? JSON.parse(body.businessDetails) : null;

    const requiredFields = ['name', 'email', 'password', 'role', 'phone'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) throw new Error(`Missing fields: ${missingFields.join(', ')}`);

    const exists = await User.findOne({
      $or: [
        { email: new RegExp(`^${body.email}$`, 'i') },
        { phone: body.phone }
      ]
    }).session(session);

    if (exists) throw new Error(exists.email === body.email ? "Email exists" : "Phone exists");

    const userData: any = {
      name: body.name.trim(),
      email: body.email.toLowerCase(),
      password: body.password,
      role: body.role,
      phone: body.phone,
      ...(body.altPhone && { altPhone: body.altPhone }),
      ...(body.address && { address: body.address }),
      ...(body.city && { city: body.city }),
      createdBy: req.user?.id,
      isDisabled: false,
      ...(avatarUpload && { avatar: avatarUpload.secure_url }),
      ...(body.documentType && {
        kyc: {
          documentType: body.documentType,
          documentNumber: body.documentNumber,
          ...(documentUpload && { documentImage: documentUpload.secure_url }),
          isVerified: false
        }
      })
    };

    if (body.role === UserRole.FARMER) {
      if (!farmingDetails) throw new Error("Farming details required");
      userData.farmingDetails = {
        landSize: farmingDetails.landSize || '',
        experienceYears: Number(farmingDetails.experienceYears) || 0,
        irrigationType: farmingDetails.irrigationType,
        soilType: farmingDetails.soilType,
        organicPractices: Boolean(farmingDetails.organicPractices),
        crops: Array.isArray(farmingDetails.crops) ? farmingDetails.crops : [],
        machinery: Array.isArray(farmingDetails.machinery) ? farmingDetails.machinery : [],
        certifications: Array.isArray(farmingDetails.certifications) ? farmingDetails.certifications : []
      };
    } else if (body.role === UserRole.BUSINESS) {
      if (!businessDetails) throw new Error("Business details required");
      userData.businessDetails = {
        businessType: businessDetails.businessType,
        businessName: businessDetails.businessName,
        gstNumber: businessDetails.gstNumber,
        businessRegistrationNumber: businessDetails.businessRegistrationNumber,
        businessAddress: businessDetails.businessAddress
      };
    }

    const [newUser] = await User.create([userData], { session });
   // console.log(req.user?.userInfo?.id);
    
    if (!req.user?.userInfo?.id) {
      throw new Error("Authentication required for audit");
    }
    
    await UserHistory.create([{
      userId: newUser._id,
      updatedBy: req.user?.userInfo?.id,
      changes: {
        creation: {
          newValue: JSON.stringify(userData),
          oldValue: null
        }
      }
    }], { session });

    await session.commitTransaction();
    const { password, ...rest } = newUser.toObject();
    res.status(201).json(rest);

  } catch (err: any) {
    await session.abortTransaction();
    console.error("User creation failed:", err);
    res.status(err?.message?.includes("Missing") ? 400 : 500).json({
      success: false,
      message: err.message || "Something went wrong"
    });
  } finally {
    session.endSession();
  }
};

// ✅ Update user details (Authenticated Users Only)
export const updateUser = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || (req.user.id !== req.params.id && req.user.role !== "admin")) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

// ✅ Disable/Enable a user (Admin Only)
export const disableUser = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.isDisabled = !user.isDisabled;
    await user.save();
    res.status(200).json({ message: `User ${user.isDisabled ? "disabled" : "enabled"} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Error updating user status", error });
  }
};

// ✅ Delete user (Admin Only)
export const deleteUser = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};
// ✅ Update KYC details (Authenticated Users Only)
export const updateKYC = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.id !== req.params.id) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { kyc: req.body }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating KYC", error });
  }
};

// ✅ Update Bank Account details (Authenticated Users Only)
export const updateBankAccount = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.id !== req.params.id) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { bankAccount: req.body }, { new: true });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating bank details", error });
  }
};

// ✅ Update Business Details (Only for Business Users)
export const updateBusinessDetails = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (user.role !== "business") {
      res.status(403).json({ message: "Only business users can update business details" });
      return;
    }
    user.businessDetails = req.body;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating business details", error });
  }
};

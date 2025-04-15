import { Request, Response } from "express";
import { User,IFarmingDetails,UserRole } from "../models/User_Model";
import streamifier from 'streamifier';
import { cloudinary } from "../utils/cloudinary";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// ✅ Get all users (Admin Only)
export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // if (req.user?.role !== "admin") {
    //   res.status(403).json({ message: "Unauthorized access" });
    //   return;
    // }
    const users = await User.find().select("-password"); // Exclude password
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// ✅ Get user by ID (Only for Authenticated Users)
export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Extract basic fields
    const {
      name,
      email,
      password,
      role,
      phone,
      altPhone,
      address,
      city,
      kyc,
      businessDetails,
      farmingDetails,
      deliveryDetails
    } = req.body;

    // Required fields validation
    if (!name || !email || !password || !role || !phone) {
      res.status(400).json({ message: "Name, email, password, role and phone are required" });
      return;
    }

    // Check if email or phone already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      res.status(400).json({ 
        message: existingUser.email === email 
          ? "Email already exists" 
          : "Phone number already exists" 
      });
      return;
    }

    // Prepare the base user object
    const userData: any = {
      name,
      email,
      password,
      role,
      phone,
      altPhone,
      address,
      city,
      createdBy: req.user?.id // Track who created this user
    };

    // Handle file uploads if files exist in request
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Handle avatar upload
      if (files.avatar?.[0]) {
        const avatar = files.avatar[0];
        const uploadResult = await uploadToCloudinary(avatar.buffer, 'avatars');
        userData.avatar = uploadResult.secure_url;
      }

      // Handle KYC document upload
      if (files.documentImage?.[0]) {
        const document = files.documentImage[0];
        const uploadResult = await uploadToCloudinary(document.buffer, 'kyc-documents');
        
        // Prepare KYC data if provided
        if (kyc) {
          userData.kyc = {
            documentType: kyc.documentType,
            documentNumber: kyc.documentNumber,
            documentImage: uploadResult.secure_url,
            isVerified: false // Default to false, admin can verify later
          };
        }
      }
    }

    // Validate and add role-specific data
    switch (role) {
      case UserRole.BUSINESS:
        if (!businessDetails) {
          res.status(400).json({ message: "Business details are required for business users" });
          return;
        }
        userData.businessDetails = businessDetails;
        break;
        
      case UserRole.FARMER:
        if (!farmingDetails) {
          res.status(400).json({ message: "Farming details are required for farmer users" });
          return;
        }
        userData.farmingDetails = farmingDetails;
        break;
        
      case UserRole.DELIVERY_AGENT:
        if (!deliveryDetails) {
          res.status(400).json({ message: "Delivery details are required for delivery agents" });
          return;
        }
        userData.deliveryDetails = deliveryDetails;
        break;
    }

    // Create new user with all provided data
    const newUser = new User(userData);
    await newUser.save();
    
    // Return the user without the password
    const userToReturn = newUser.toObject();
    res.status(201).json(userToReturn);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ 
      message: "Error creating user", 
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

// Helper function to upload files to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `uploads/${folder}`,
        format: 'webp',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
      },
      (error: any, result: { secure_url: string } | undefined) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ✅ Update user details (Authenticated Users Only)
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const disableUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const updateKYC = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
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
  export const updateBankAccount = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
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
export const updateBusinessDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

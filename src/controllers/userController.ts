import { Request, Response } from "express";
import { User,IFarmingDetails } from "../models/User_Model";

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
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
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

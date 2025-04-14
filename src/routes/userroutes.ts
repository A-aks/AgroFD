import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  disableUser,
  updateKYC,
  updateBankAccount,
  updateBusinessDetails,
} from "../controllers/userController";
import authMiddleware from "../middleware/authMiddleware";
import checkRole from '../middleware/roleMiddleware';
import {uploadMiddleware} from "../utils/cloudinary"

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// 🔹 Admin Routes (Protected)
router.get("/", authMiddleware, checkRole(['admin']), getAllUsers);
router.delete("/:id", authMiddleware, isAdmin, deleteUser);
router.put("/disable/:id", authMiddleware, isAdmin, disableUser);
router.post("/", authMiddleware, checkRole(['admin']),uploadMiddleware.mixedUpload, createUser);

// 🔹 Authenticated User Routes (For Individual Users)
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, updateUser);
router.put("/:id/kyc", authMiddleware, updateKYC);
router.put("/:id/bank", authMiddleware, updateBankAccount);
router.put("/:id/business", authMiddleware, updateBusinessDetails);

export default router;

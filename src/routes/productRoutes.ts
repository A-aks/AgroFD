import express from "express";
import {
  getAllProducts,
  getProductsByCategory
} from "../controllers/ProductController";
import authMiddleware from "../middleware/authMiddleware";
import checkRole from '../middleware/roleMiddleware';
import {uploadMiddleware} from "../middleware/multer"

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.userInfo?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// Utility to wrap async route handlers and forward errors to Express error handler
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 🔹 Admin Routes (Protected)
router.get("/", authMiddleware, asyncHandler(getAllProducts));
router.get("/category", authMiddleware, asyncHandler(getProductsByCategory));



export default router;

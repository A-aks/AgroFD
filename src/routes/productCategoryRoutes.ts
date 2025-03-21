import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories 
} from "../controllers/ProductCategoryController";
import authMiddleware from "../middleware/authMiddleware";
import checkRole from "../middleware/roleMiddleware";
import { upload } from "../utils/cloudinary";

const router = express.Router();

// 🔹 Category Routes (Only Admin can manage categories)
router.post(
  "/api/categories",
  authMiddleware, 
  checkRole(["admin"]),
  upload.single("category_img"),
  createCategory);
router.put("/api/categories/:id", authMiddleware, checkRole(["admin"]), updateCategory);
router.delete("/api/categories/:id", authMiddleware, checkRole(["admin"]), deleteCategory);

// 🔹 Product Routes (Admin & Seller can manage products)
router.post("/api/product", authMiddleware, checkRole(["admin", "seller"]), createProduct);
router.put("/api/product/:id", authMiddleware, checkRole(["admin", "seller"]), updateProduct);
router.delete("/api/product/:id", authMiddleware, checkRole(["admin", "seller"]), deleteProduct);
router.get('/api/allcategories',authMiddleware,getCategories );

export default router;

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
  "/categories",
  authMiddleware, 
  checkRole(["admin"]),
  upload.single("category_img"),
  createCategory);
router.put("/categories/:id", authMiddleware, checkRole(["admin"]), updateCategory);
router.delete("/categories/:id", authMiddleware, checkRole(["admin"]), deleteCategory);

// 🔹 Product Routes (Admin & Seller can manage products)
router.post("/product", authMiddleware, checkRole(["admin", "seller"]), createProduct);
router.put("/product/:id", authMiddleware, checkRole(["admin", "seller"]), updateProduct);
router.delete("/product/:id", authMiddleware, checkRole(["admin", "seller"]), deleteProduct);
router.get('/allcategories',authMiddleware,getCategories );

export default router;

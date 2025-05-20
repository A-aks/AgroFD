import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories 
} from "../controllers/ProductCategoryController";
import authMiddleware from "../middleware/authMiddleware";
import checkRole from "../middleware/roleMiddleware";
import { uploadMiddleware} from "../middleware/multer";

const router = express.Router();

// 🔹 Category Routes (Only Admin can manage categories)
router.post(
  "/categories",
  authMiddleware, 
  checkRole(["admin"]),
  uploadMiddleware.singleImage("category_img"),
  createCategory);
router.put("/categories/:id", authMiddleware, checkRole(["admin"]),uploadMiddleware.singleImage("category_img"), updateCategory);
router.delete("/categories/:id", authMiddleware, checkRole(["admin"]), deleteCategory);


router.get('/allcategories',authMiddleware,getCategories );

export default router;

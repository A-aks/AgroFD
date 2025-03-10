import express from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/ProductCategoryController";
import authMiddleware from "../middleware/authMiddleware";
import checkRole from "../middleware/roleMiddleware";

const router = express.Router();

// 🔹 Category Routes (Only Admin can manage categories)
router.post("/category", authMiddleware, checkRole(["admin"]), createCategory);
router.put("/category/:id", authMiddleware, checkRole(["admin"]), updateCategory);
router.delete("/category/:id", authMiddleware, checkRole(["admin"]), deleteCategory);

// 🔹 Product Routes (Admin & Seller can manage products)
router.post("/product", authMiddleware, checkRole(["admin", "seller"]), createProduct);
router.put("/product/:id", authMiddleware, checkRole(["admin", "seller"]), updateProduct);
router.delete("/product/:id", authMiddleware, checkRole(["admin", "seller"]), deleteProduct);

export default router;

import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import {Category, Product, ProductCategory} from "../models/ProductsCategories";


// Extend Request interface to include user info
interface CustomRequest extends Request {
  userInfo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// ✅ Create a new category
export const createCategory = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    res.status(400);
    throw new Error("Category already exists");
  }

  const newCategory = await Category.create({ name, description });

  res.status(201).json({
    message: "Category created successfully",
    category: newCategory,
  });
});

// ✅ Update a category
export const updateCategory = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category.name = name || category.name;
  category.description = description || category.description;

  await category.save();

  res.status(200).json({
    message: "Category updated successfully",
    category,
  });
});

// ✅ Delete a category
export const deleteCategory = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  await category.deleteOne();

  res.status(200).json({ message: "Category deleted successfully" });
});

// ✅ Create a new product
export const createProduct = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { name, category, price, unit, stock, description, image } = req.body;

  if (!name || !category || !price || !unit || stock === undefined) {
    res.status(400);
    throw new Error("All product fields are required");
  }

  // Check if category exists
  const categoryExists = await Category.findOne({ name: category });
  if (!categoryExists) {
    res.status(400);
    throw new Error("Invalid category");
  }

  const newProduct = await Product.create({
    name,
    category,
    price,
    unit,
    stock,
    description,
    image,
    addedBy: req.userInfo?.id,
  });

  res.status(201).json({
    message: "Product created successfully",
    product: newProduct,
  });
});

// ✅ Update a product
export const updateProduct = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { name, category, price, unit, stock, description, image } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.name = name || product.name;
  product.category = category || product.category;
  product.price = price || product.price;
  product.unit = unit || product.unit;
  product.stock = stock !== undefined ? stock : product.stock;
  product.description = description || product.description;
  product.image = image || product.image;

  await product.save();

  res.status(200).json({
    message: "Product updated successfully",
    product,
  });
});

// ✅ Delete a product
export const deleteProduct = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();
  res.status(200).json({ message: "Product deleted successfully" });
});

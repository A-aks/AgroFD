import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { Category, Product } from "../models/ProductsCategories";
import {IMedia} from '../types/IMedia'
import {ICategory} from '../types/ICategory'
import {IProduct} from '../types/IProduct'



//Extend Request to include user info
interface CustomRequest<T = {}> extends Request {
  userInfo?: { id: string }; // Include user ID
  body: T;
  file?: Express.Multer.File; // Handle uploaded files
}

// Utility function to find a category by ID
const findCategoryById = async (id: string) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
};

// Utility function to find a product by ID
const findProductById = async (id: string) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
};

// ✅ Create a new category
export const createCategory = asyncHandler(async (req: CustomRequest<ICategory>, res: Response) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);

  const { name, description } = req.body;
  const category_img = req.file?.path || ""; // Ensure correct image path

  if (!name || !description) {
    res.status(400);
    throw new Error("Category requires name and description.");
  }

  // Check if category with the same English name exists
  const existingCategory = await Category.findOne({ "name.en": name.en });
  if (existingCategory) {
    res.status(400);
    throw new Error("Category already exists.");
  }

  const newCategory = await Category.create({ name, description, category_img });
  res.status(201).json({ message: "Category created successfully", category: newCategory });
});

export const updateCategory = asyncHandler(async (req: CustomRequest<ICategory>, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description } = req.body;
  const category_img = req.file?.path || req.body.category_img;

  const category = await findCategoryById(id);

  category.name = { ...category.name, ...name };
  category.description = { ...category.description, ...description };
  category.category_img = category_img || category.category_img;

  await category.save();
  res.status(200).json({ message: "Category updated successfully", category });
});

export const deleteCategory = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const category = await findCategoryById(id);

  await category.deleteOne();
  res.status(200).json({ message: "Category deleted successfully" });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find({});
  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// ✅ Create a new product
export const createProduct = asyncHandler(async (req: CustomRequest<IProduct>, res: Response) => {
  const { name, category, price, unit, stock, description, media } = req.body;

  if (!name || !category || !price || !unit || stock === undefined) {
    res.status(400);
    throw new Error("All product fields are required");
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error("Invalid category");
  }
  // Ensure media is an array of IMedia
  let formattedMedia: IMedia[] | undefined = undefined;
  if (media && Array.isArray(media)) {
    formattedMedia = media.map((item) => {
      if (typeof item === "string") {
        return { url: item, type: "image" }; // Default to "image"
      } else {
        return { url: item.url, type: item.type as "image" | "video" };
      }
    });
  }

  const newProduct = await Product.create({
    name,
    category,
    price,
    unit,
    stock,
    description,
    media:formattedMedia, // Ensure media is always a string[]
    addedBy: req.userInfo?.id,
  });

  res.status(201).json({ message: "Product created successfully", product: newProduct });
});

// ✅ Update a product
export const updateProduct = asyncHandler(async (req: CustomRequest<IProduct>, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, category, price, unit, stock, description, media } = req.body;

  const product = await findProductById(id);

  let formattedMedia: IMedia[] | undefined = product.media;
  if (media && Array.isArray(media)) {
    formattedMedia = media.map((item) => {
      if (typeof item === "string") {
        return { url: item, type: "image" }; // Default to "image"
      } else {
        return { url: item.url, type: item.type as "image" | "video" };
      }
    });
  }

  product.name = name || product.name;
  product.category = category || product.category;
  product.price = price || product.price;
  product.unit = unit || product.unit;
  product.stock = stock !== undefined ? stock : product.stock;
  product.description = description || product.description;
  product.media = formattedMedia;

  await product.save();
  res.status(200).json({ message: "Product updated successfully", product });
});
// ✅ Delete a product
export const deleteProduct = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const product = await findProductById(id);

  await product.deleteOne();
  res.status(200).json({ message: "Product deleted successfully" });
});

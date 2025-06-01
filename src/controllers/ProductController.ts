import { Request, Response } from "express";
import Product from "../models/Product";

import { CustomRequest } from "../types/CustomRequest";

export const getAllProducts = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;      // current page
    const limit = parseInt(req.query.limit as string) || 20;   // items per page
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    res.status(200).json({
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      items: products,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch products.' });
  }
};

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const filter = category ? { category } : {};

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ category: 1 }).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    if (!products.length) {
      res.status(404).json({
        message: category
          ? `No products found in category "${category}"`
          : "No products found",
      });
      return;
    }

    res.status(200).json({
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      items: products,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};




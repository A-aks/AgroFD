import { Request, Response } from "express";
import Product from "../models/Product";

import { CustomRequest } from "../types/CustomRequest";

export const getAllProducts = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch products.' });
  }
};
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;

  try {
    const filter = category ? { category } : {};
    const products = await Product.find(filter).sort({ category: 1 }); // 1 = ascending, -1 = descending

    if (!products.length) {
      res.status(404).json({
        message: category
          ? `No products found in category "${category}"`
          : "No products found",
      });
      return;
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};



import mongoose, { Schema, Model } from "mongoose";
import { ICategory } from "../types/ICategory";

// Category Enum
export enum ProductCategory {
  VEGETABLES = "vegetables",
  FRUITS = "fruits",
  MILK = "milk",
  MILK_PRODUCTS = "milk-products",
  GRAINS = "grains",
  SEEDS = "seed",
  NURSERY_TREES = "nursery-plants",
  FERTILIZER = "fertilizer",
  DRY_FRUITS = "dry-fruits",
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    key: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true,
      unique: true,
    },
    name: {
      type: Schema.Types.Mixed, // { en: "", hi: "" }
      required: true,
    },
    description: {
      type: Schema.Types.Mixed, // { en: "", hi: "" }
      required: true,
    },
    category_img: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> = mongoose.model("Category", CategorySchema);

import mongoose, { Document, Schema, Model } from "mongoose";
import {ICategory} from '../types/ICategory'
import {IProduct} from '../types/IProduct'

// Define product categories as an Enum
enum ProductCategory {
  VEGETABLES = "vegetables",
  FRUITS = "fruits",
  MILK = "milk",
  MILK_PRODUCTS = "milk-products",
  GRAINS = "grains", // anaaj in English grains
  SEEDS = "seed",
  NURSERY_TREES = "nursery-plants",
  FERTILIZER="fertilizer",
  DRY_FRUITS="dry-fruits"
}

// Define available units for pricing and stock
const validUnits = ["kg", "liter", "packet", "piece", "dozen", "quintal", "ton"]; 
// Quintal (100kg), Ton (1000kg)

// Interface for Media (image or video)
interface IMedia {
  type: "image" | "video";
  url: string;
}
// Category Schema
const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: Schema.Types.String,
      enum: Object.values(ProductCategory),
      required: true,
      unique: true,
    },
    description: {
      type: Schema.Types.String,
    },
    category_img: {
      type: Schema.Types.String,
      default: "", // Default image URL if not provided
    },
  },
  { timestamps: true }
);

// Product Schema
const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: [true, "Please provide product name"],
    },
    category: {
      type: Schema.Types.String,
      enum: Object.values(ProductCategory),
      required: [true, "Product category is required"],
    },
    price: {
      type: Schema.Types.Number,
      required: [true, "Please provide price"],
    },
    unit: {
      type: Schema.Types.String,
      enum: validUnits,
      required: [true, "Unit is required"],
    },
    stock: {
      type: Schema.Types.Number,
      required: [true, "Stock quantity is required"],
      default: 0,
    },
    description: {
      type: Schema.Types.String,
    },
    media: [
      {
        type: {
          type: Schema.Types.String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: Schema.Types.String,
          required: true,
        },
      },
    ],
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create Mongoose models
const Category: Model<ICategory> = mongoose.model<ICategory>("Category", CategorySchema);
const Product: Model<IProduct> = mongoose.model<IProduct>("Product", ProductSchema);

export { Category, Product, ProductCategory };

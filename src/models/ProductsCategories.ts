import mongoose, { Document, Schema, Model } from "mongoose";

// Define product categories as an Enum
enum ProductCategory {
  VEGETABLES = "vegetables",
  FRUITS = "fruits",
  MILK = "milk",
  MILK_PRODUCTS = "milk-products",
  ANAAJ = "anaaj",
  SEEDS = "seeds",
  FERTILIZERS_ORGANIC = "fertilizers-organic",
  FERTILIZERS_CHEMICAL = "fertilizers-chemical",
  NURSERY_TREES = "nursery-trees",
}

// Define available units for pricing and stock
const validUnits = ["kg", "liter", "packet", "piece", "dozen", "quintal", "ton"]; 
// Quintal (100kg), Ton (Tan) = 1000kg

// Interface for Category
interface ICategory extends Document {
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Category Schema
const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

// Interface for Product
interface IProduct extends Document {
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // kg, liter, packet, etc.
  stock: number; // Available stock quantity
  description?: string;
  image?: string; // Image URL
  addedBy: mongoose.Types.ObjectId; // User who added the product
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Schema
const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: [true, "Product category is required"],
    },
    price: {
      type: Number,
      required: [true, "Please provide price"],
    },
    unit: {
      type: String,
      enum: validUnits,
      required: [true, "Unit is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      default: 0,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
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

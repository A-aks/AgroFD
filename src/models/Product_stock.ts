import mongoose, { Schema, model, Types, Document } from "mongoose";
import { IProduct } from "../types/IProduct_stock";

const MultilingualTextSchema = new Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
  },
  { _id: false }
);

const MediaSchema = new Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct & Document>(
  {
    name: { type: MultilingualTextSchema, required: true },
    description: { type: MultilingualTextSchema },
    category: { type: Schema.Types.ObjectId as unknown as typeof String, ref: "Category", required: true },
    subcategory: { type: Schema.Types.ObjectId as unknown as typeof String, ref: "SubCategory" },
    price: { type: Number, required: true },
    unit: { type: String, enum: ["kg", "liter", "packet", "piece", "dozen", "quintal", "ton"], required: true },
    stock: { type: Number, required: true, default: 0 },
    media: [MediaSchema],
    addedBy: { type: Schema.Types.ObjectId as unknown as typeof String, ref: "User" },
  },
  { timestamps: true }
);

export const Product = model<IProduct & Document>("seller_product", ProductSchema);

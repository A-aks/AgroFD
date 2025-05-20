import mongoose, { Schema, Model } from "mongoose";
import { IStock } from "../types/IStock";

const StockSchema: Schema<IStock> = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Stock: Model<IStock> = mongoose.model("Stock", StockSchema);

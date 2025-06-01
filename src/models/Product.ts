const mongoose = require('mongoose');
import { Schema,model} from "mongoose";
import { IMultilingualText } from "../types/IMultilingualText";
import {IProduct} from '../types/IProduct'

type ProductDocument = IProduct & Document;

 const productSchema = new Schema<ProductDocument>({
  _id:{
    type: String,
    required:false
  },
  name: {
    type: Schema.Types.Mixed, // Allows any object structure, suitable for multilingual text
    required: true
  },
  category: {
    type: String, // e.g., "vegetables", "pulses", "nursery-plants"
    required: true
  },
  type: {
    type: String, //Optional: e.g., "flower", "grain"
    required: false 
  },
  image: {
    type: String, //URL to image
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = model<ProductDocument>('Product', productSchema);
export default Product;

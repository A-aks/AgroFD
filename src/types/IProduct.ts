import {IMedia} from './IMedia'
import {Document} from 'mongoose'

export interface IProduct extends Document {
  id?: string;
  name: string;
  category: string; // Reference to Category ID
  price: number;
  unit: string;
  stock: number;
  description?: string;
  media?: IMedia[]; // Ensure it's always string[]
  addedBy?: string; // User ID who added the product
  createdAt?: Date;
  updatedAt?: Date;
} 
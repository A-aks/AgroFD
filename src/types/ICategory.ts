import { Document } from "mongoose";

// Define Interface for Category
export interface ICategory extends Document {
  id?: string; // Optional for new categories before MongoDB assigns an ID
  key: string; // Matches ProductCategory enum (e.g., "vegetables", "fruits")
  name: {
    en: string;
    hi: string;
  };
  description: {
    en: string;
    hi: string;
  };
  category_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

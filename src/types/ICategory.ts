import {Document} from 'mongoose'
// Define Interfaces for Category and Product
export interface ICategory extends Document {
    id?: string; // Optional for new categories before MongoDB assigns an ID
    name: string;
    description: string;
    category_img: string;
    createdAt?: Date;
    updatedAt?: Date;
  } 
// src/models/SubCategory.ts

import mongoose, { Schema, model } from 'mongoose';
import { ISubCategory } from '../types/ISubCategory';
import { MultilingualTextSchema } from '../schemas/MultilingualTextSchema';

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: MultilingualTextSchema, required: true },
    description: { type: MultilingualTextSchema },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory_img: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const SubCategory = model<ISubCategory>('SubCategory', SubCategorySchema);

// src/types/ISubCategory.ts

import { IMultilingualText } from './IMultilingualText';
import { Types } from 'mongoose';

export interface ISubCategory {
  name: IMultilingualText;
  description?: IMultilingualText;
  parentCategory: Types.ObjectId;
  subcategory_img?: string;
}

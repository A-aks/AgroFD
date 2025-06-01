import { IMedia } from "./IMedia";
import { IMultilingualText } from "./IMultilingualText";

export interface IProduct {
  name: IMultilingualText;
  description?: IMultilingualText;
  category: string;
  subcategory?: string;
  price: number;
  unit: string;
  stock: number;
  media?: IMedia[];
  addedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

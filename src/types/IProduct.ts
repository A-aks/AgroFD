import { Document} from 'mongoose';
import { IMultilingualText } from "./IMultilingualText";
export interface IProduct extends Document {
   _id: string;  
  name: IMultilingualText;
  category: string;
  type?: string;
  image: string;
  createdAt?: Date;
}


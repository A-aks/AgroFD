// src/schemas/MultilingualTextSchema.ts

import { Schema } from 'mongoose';

export const MultilingualTextSchema = new Schema(
  {
    en: { type: String, required: true },
    hi: { type: String },
  },
  { _id: false }
);

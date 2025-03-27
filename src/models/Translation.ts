import mongoose, { Document, Schema } from "mongoose";

interface ITranslation extends Document {
  _id: string;
  en: { [key: string]: string };
  hi: { [key: string]: string };
  [key: string]: any; // Allows more languages dynamically
}

const TranslationSchema = new Schema<ITranslation>({
  _id: { type: String, required: true }, // Example: "home"
  en: { type: Object, required: true },
  hi: { type: Object, required: true },
}, { _id: false });

export const Translation = mongoose.model<ITranslation>("Translation", TranslationSchema);

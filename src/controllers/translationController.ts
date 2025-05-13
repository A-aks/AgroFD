import { Request, Response } from "express";
import { Translation } from "../models/Translation";

export const getTranslations = async (req: Request, res: Response) => {

  try {
    const lang = req.params.lang || "en"; // Default to English if no language provided
    const translations = await Translation.find({}, { _id: 1, [lang]: 1 });
    console.log(lang);
    const formattedTranslations = translations.reduce((acc, item) => {
      acc[item._id] = item[lang];
      return acc;
    }, {} as Record<string, any>);

    res.json(formattedTranslations);
  } catch (error) {
    console.error("Error fetching translations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

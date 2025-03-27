import express from "express";
import { getTranslations } from "../controllers/translationController";

const router = express.Router();

router.get("/:lang", getTranslations); // Example: /api/translations/en

export default router;

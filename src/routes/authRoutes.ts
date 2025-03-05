import express, { Router } from "express";
import { RegisterUser, login, GetCurrentInfo } from "../controllers/AuthController";
import validateToken from "../middleware/Validatetoken"; // Ensure this file is also in TypeScript

const router: Router = express.Router();

router.post("/", RegisterUser);
router.post("/login", login);
router.get("/current-user", validateToken, GetCurrentInfo);

export default router; // Use `export default` instead of `module.exports`

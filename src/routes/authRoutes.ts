import express, { Router } from "express";
import { RegisterUser, login, GetCurrentInfo,UpdateUserInfo } from "../controllers/AuthController";
import validateToken from "../middleware/Validatetoken"; // Ensure this file is also in TypeScript
import { uploadMiddleware } from "../middleware/multer";
import { userInfo } from "os";

const router: Router = express.Router();

router.post("/", RegisterUser);
router.post("/login", login);
router.get("/current-user", validateToken, GetCurrentInfo);

// ✅ New route to update user profile with an avatar
router.put("/update-user", validateToken, uploadMiddleware.singleImage("avatar"), UpdateUserInfo);

export default router; // Use `export default` instead of `module.exports`

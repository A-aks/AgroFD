// import express from "express";
// import { addUser, getUserList } from "../controllers/userController";
// import checkRole from "../middleware/roleMiddleware";
// import authMiddleware from "../middleware/authMiddleware"; // Auth Middleware

// const router = express.Router();

// // ✅ Only "admin" and "marketer" can add users
// router.post("/add", authMiddleware, checkRole(["admin", "marketer"]), addUser);

// // ✅ "Admin" can get all users, others can only see limited data
// router.get("/list", authMiddleware, checkRole(["admin", "seller", "marketer"]), getUserList);

// export default router;

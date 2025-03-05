import express from "express";
import {
  getUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import validateToken from "../middleware/Validatetoken";

const router = express.Router();

// Apply middleware if needed
// router.use(validateToken);

router.route("/").get(getUsers);
router.route("/:_id").get(getSingleUser);
router.route("/").post(createUser);
router.route("/:_id").put(updateUser);
router.route("/:_id").delete(deleteUser);

export default router;

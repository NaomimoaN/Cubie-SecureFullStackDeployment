// server/routes/userRoutes.js

import express from "express";
const router = express.Router();
import * as userController from "../../controllers/model/userController.js";
import { protect, authorize } from "../../middleware/authMiddleware.js";

router.post("/", userController.createUser);

router.get("/", protect, authorize(["admin"]), userController.getAllUsers);

router
  .route("/:id")
  .get(protect, userController.getUserById)
  .put(protect, authorize(["admin"]), userController.updateUser)
  .delete(protect, authorize(["admin"]), userController.deleteUser);

export default router;

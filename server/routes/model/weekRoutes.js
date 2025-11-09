// server/routes/weekRoutes.js

import express from "express";
const router = express.Router();
import { protect, authorize } from "../../middleware/authMiddleware.js";
import * as weekController from "../../controllers/model/weekController.js";

router.get(
  "/",
  protect,
  authorize(["teacher", "student", "admin"]),
  weekController.getWeeksBySubject
);

router
  .route("/:id")
  .get(
    protect,
    authorize(["teacher", "student", "admin"]),
    weekController.getWeekById
  );

router.patch(
  "/:id",
  protect,
  authorize(["teacher", "admin"]),
  weekController.updateWeekContent
);
export default router;

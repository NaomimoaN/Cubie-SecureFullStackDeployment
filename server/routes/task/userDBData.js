import express from "express";
// import { protect } from "../../middleware/authMiddleware.js";
// import * as userContentController from "../../controllers/task/userContentController.js";
import User from "../../models/userModel.js";

const router = express.Router();

// fetch data from DB here

router.get("/:id", async (req, res) => {
  // This route is for fetching user DB data.
  // You can implement the logic to retrieve user DB data here.

  try {
    const userId = req.params.id;
    // console.log("userDBD.js", userId); // For testing: logs the user ID
    // Fetch user data from the database
    const userData = await User.findById(userId).exec();
    console.log(userData); // For testing: logs the query

    res.status(200).json({ data: userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // Rethrow the error for further handling
  }
});

export default router;

import express from "express";
import { getUsersByTrek, 
  clearPastTrekBookings,
  getTreksOverview  } from "../controller/adminController.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/trek-users/:trekId", getUsersByTrek);
router.delete("/clear-bookings/:trekId", clearPastTrekBookings);
router.get("/treks-overview", getTreksOverview);

export default router;

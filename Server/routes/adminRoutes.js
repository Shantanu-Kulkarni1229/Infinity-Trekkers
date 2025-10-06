import express from "express";
import { getUsersByTrek, 
  clearPastTrekBookings,
  getTreksOverview,
  createOfflineBooking,
  getUsersByTour,
  getAllBookings,
  clearPastTourBookings,
  getToursOverview,
  getUnifiedOverview } from "../controller/adminController.js";
import adminAuth from "../middlewares/adminAuth.js";


const router = express.Router();

router.get("/trek-users/:trekId", getUsersByTrek);
router.get("/tour-users/:tourId", getUsersByTour);
router.get("/all-bookings", getAllBookings);
router.delete("/clear-bookings/:trekId", clearPastTrekBookings);
router.delete("/clear-tour-bookings/:tourId", clearPastTourBookings);
router.get("/treks-overview", getTreksOverview);
router.get("/tours-overview", getToursOverview);
router.get("/unified-overview", getUnifiedOverview);
router.post("/offline-booking", adminAuth, createOfflineBooking);

export default router;

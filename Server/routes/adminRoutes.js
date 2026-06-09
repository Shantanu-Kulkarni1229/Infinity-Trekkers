import express from "express";
import { getUsersByTrek, 
  clearPastTrekBookings,
  getTreksOverview,
  createOfflineBooking,
  getUsersByTour,
  getAllBookings,
  deleteBookingById,
  clearPastTourBookings,
  getToursOverview,
  getUnifiedOverview,
  updateBookingPaymentStatus,
  downloadBatchBookingsPdf } from "../controller/adminController.js";
import adminAuth from "../middlewares/adminAuth.js";


const router = express.Router();

router.get("/trek-users/:trekId", getUsersByTrek);
router.get("/tour-users/:tourId", getUsersByTour);
router.get("/all-bookings", getAllBookings);
router.delete("/bookings/:bookingId", adminAuth, deleteBookingById);
router.patch("/bookings/:bookingId/status", adminAuth, updateBookingPaymentStatus);
router.get("/bookings/:itemType/:itemId/batch-report", adminAuth, downloadBatchBookingsPdf);
router.delete("/clear-bookings/:trekId", clearPastTrekBookings);
router.delete("/clear-tour-bookings/:tourId", clearPastTourBookings);
router.get("/treks-overview", getTreksOverview);
router.get("/tours-overview", getToursOverview);
router.get("/unified-overview", getUnifiedOverview);
router.post("/offline-booking", adminAuth, createOfflineBooking);

export default router;

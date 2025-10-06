import express from "express";
import { createBooking, verifyPayment } from "../controller/universalBookingController.js";

const router = express.Router();

router.post("/book", createBooking);       // create booking and generate Razorpay order for both treks and tours
router.post("/verify-payment", verifyPayment); // verify payment after success

export default router;
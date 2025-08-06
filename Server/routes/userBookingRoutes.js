import express from "express";
import { createBooking,verifyPayment } from "../controller/userBookingController.js";


const router = express.Router();

router.post("/book", createBooking);       // create booking and generate Razorpay order
router.post("/verify-payment", verifyPayment); // verify payment after success

export default router;

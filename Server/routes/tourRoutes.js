import express from "express";
import { addTour, getTours, getFeaturedTours, getTourById, updateTour, deleteTour, toggleTourStatus } from "../controller/tourController.js";
import { upload } from "../config/cloudinary.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

// Public routes
router.get("/featured", getFeaturedTours);
router.get("/", getTours);
router.get("/:id", getTourById);

// Admin routes
router.post("/add", upload.single("thumbnail"), addTour);
router.put("/:id", adminAuth, upload.single("thumbnail"), updateTour);
router.delete("/:id", adminAuth, deleteTour);
router.patch("/toggle-status/:id", toggleTourStatus);

export default router;
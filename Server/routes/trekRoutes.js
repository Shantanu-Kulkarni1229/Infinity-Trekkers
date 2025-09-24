import express from "express";
import { addTrek, getTreks, getTrekById, updateTrek, deleteTrek, toggleTrekStatus } from "../controller/trekController.js";
import { upload } from "../config/cloudinary.js";
import adminAuth from "../middlewares/adminAuth.js";


const router = express.Router();

// Admin routes
router.post("/add", upload.single("thumbnail"), addTrek);
router.get("/", getTreks);
router.get("/:id", getTrekById);
router.put("/:id",adminAuth, upload.single("thumbnail"), updateTrek);
router.delete("/:id",adminAuth, deleteTrek);
router.patch("/toggle-status/:id", toggleTrekStatus);

export default router;

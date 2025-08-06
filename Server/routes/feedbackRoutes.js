import express from "express";
import multer from "multer";
import { createFeedback , deleteFeedback, getAllFeedbacks , getFeedbackByTrek, toggleFeedbackVisibility} from "../controller/feedbackController.js";


const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/feedback"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
router.post("/create", upload.single("photo"), createFeedback);
router.get("/", getAllFeedbacks);
router.get("/:trekId", getFeedbackByTrek);
router.patch("/:feedbackId" , toggleFeedbackVisibility )
router.delete("/:feedbackId",  deleteFeedback);

export default router;

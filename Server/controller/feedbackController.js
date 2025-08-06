import Feedback from "../models/Feedback.js";
import Trek from "../models/Trek.js";
import cloudinary from "cloudinary";

// ✅ Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ========================
// Helper: Upload to Cloudinary
// ========================
const uploadToCloudinary = async (fileBase64) => {
  return await cloudinary.v2.uploader.upload(fileBase64, {
    folder: "feedback_photos",
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  });
};

// ========================
// Create Feedback
// ========================
export const createFeedback = async (req, res) => {
  try {
    const { name, trekId, date, feedback, starRating, photo } = req.body;

    // Validation
    if (!name || !trekId || !date || !feedback || !starRating) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: "Trek not found" });
    }

    let photoUrl = null;
    if (photo) {
      const uploadedResponse = await uploadToCloudinary(photo);
      photoUrl = uploadedResponse.secure_url;
    }

    const newFeedback = new Feedback({
      name,
      trek: trekId,
      date,
      photo: photoUrl,
      feedback,
      starRating,
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: newFeedback,
    });
  } catch (error) {
    console.error("Feedback creation failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit feedback",
    });
  }
};




// ========================
// Get all feedbacks
// ========================
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("trek", "name thumbnail");
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedbacks" 
    });
  }
};

// ========================
// Get feedbacks for a specific trek
// ========================
export const getFeedbackByTrek = async (req, res) => {
  try {
    const { trekId } = req.params;
    const feedbacks = await Feedback.find({ trek: trekId })
      .populate("trek", "name");
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedbacks for trek" 
    });
  }
};
export const toggleFeedbackVisibility = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { isVisible } = req.body;

    // ✅ Update visibility
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { isVisible },
      { new: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    res.status(200).json({
      success: true,
      message: `Feedback visibility updated to ${isVisible}`,
      data: updatedFeedback,
    });
  } catch (error) {
    console.error("Failed to update feedback visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback visibility",
    });
  }
};


export const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!deletedFeedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    res.status(200).json({ success: true, message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete feedback" });
  }
};
// controllers/feedbackController.js
import Feedback from "../models/Feedback.js";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBase64) => {
  try {
    return await cloudinary.v2.uploader.upload(fileBase64, {
      folder: "feedback_photos",
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

export const createFeedback = async (req, res) => {
  try {
    const { name, trek, date, feedback, starRating, photo } = req.body;

    // Basic validation
    if (!name || !trek || !date || !feedback || !starRating) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Additional validation
    if (feedback.length < 10 || feedback.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be between 10 and 1000 characters"
      });
    }

    let photoUrl = null;
    if (photo) {
      try {
        const uploadedResponse = await uploadToCloudinary(photo);
        photoUrl = uploadedResponse.secure_url;
      } catch (error) {
        console.error("Image upload failed:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
      }
    }

    const newFeedback = new Feedback({
      name: name.trim(),
      trek: trek.trim(),
      date: new Date(date),
      photo: photoUrl,
      feedback: feedback.trim(),
      starRating: Number(starRating),
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        _id: newFeedback._id,
        name: newFeedback.name,
        trek: newFeedback.trek,
        date: newFeedback.date,
        starRating: newFeedback.starRating,
        isVisible: newFeedback.isVisible
      }
    });
  } catch (error) {
    console.error("Feedback creation failed:", error);
    
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    const message = error.name === 'ValidationError' 
      ? error.message 
      : "Failed to submit feedback";

    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.status(200).json({ 
      success: true, 
      count: feedbacks.length,
      data: feedbacks 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedbacks",
      error: error.message 
    });
  }
};

export const getFeedbackByTrek = async (req, res) => {
  try {
    const { trek } = req.params;
    const feedbacks = await Feedback.find({ 
      trek: new RegExp(trek, 'i'), // Case-insensitive search
      isVisible: true // Only visible feedbacks
    }).sort({ date: -1 });

    if (!feedbacks.length) {
      return res.status(404).json({
        success: false,
        message: "No feedbacks found for this trek"
      });
    }

    res.status(200).json({ 
      success: true, 
      count: feedbacks.length,
      data: feedbacks 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch feedbacks for trek",
      error: error.message 
    });
  }
};

export const toggleFeedbackVisibility = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isVisible must be a boolean value"
      });
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { isVisible },
      { new: true, runValidators: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ 
        success: false, 
        message: "Feedback not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: `Feedback visibility ${isVisible ? 'enabled' : 'disabled'}`,
      data: updatedFeedback
    });
  } catch (error) {
    console.error("Failed to update feedback visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback visibility",
      error: error.message
    });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    
    // Optional: Delete photo from Cloudinary first if exists
    const feedback = await Feedback.findById(feedbackId);
    if (feedback?.photo) {
      const publicId = feedback.photo.split('/').pop().split('.')[0];
      await cloudinary.v2.uploader.destroy(`feedback_photos/${publicId}`);
    }

    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);
    
    if (!deletedFeedback) {
      return res.status(404).json({ 
        success: false, 
        message: "Feedback not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Feedback deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete feedback",
      error: error.message 
    });
  }
};
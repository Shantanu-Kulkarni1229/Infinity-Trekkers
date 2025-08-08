// models/Feedback.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    trek: {
      type: String, // Changed to String as per your requirement
      required: [true, "Trek name is required"],
      trim: true,
      maxlength: [100, "Trek name cannot exceed 100 characters"]
    },
    date: { 
      type: Date, 
      required: [true, "Date is required"],
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v.valueOf());
        },
        message: "Invalid date format"
      }
    },
    photo: { 
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: "Invalid photo URL"
      }
    },
    feedback: {
      type: String,
      required: [true, "Feedback is required"],
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
      minlength: [3, "Feedback must be at least 03 characters"]
    },
    starRating: { 
      type: Number, 
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"], 
      required: [true, "Star rating is required"] 
    },
    isVisible: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
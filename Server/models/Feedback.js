import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    trek: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trek",
      required: [true, "Trek is required"],
    },
    date: { type: Date, required: [true, "Date is required"] },
    photo: { type: String },
    feedback: {
      type: String,
      required: [true, "Feedback is required"],
      maxlength: 1000,
    },
    starRating: { type: Number, min: 1, max: 5, required: [true, "Star rating is required"] },
    
    // ✅ New field for admin approval
    isVisible: { type: Boolean, default: false },
  },
  { timestamps: true }
);


const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;

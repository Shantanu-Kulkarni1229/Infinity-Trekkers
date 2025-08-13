import mongoose from "mongoose";

const userBookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true }, // ✅ Added email field
    phoneNumber: { type: String, required: true },
    city: {
      type: String,
      enum: ["Chh. Sambhajinagar", "Pune", "Mumbai"],
      required: true
    },
    membersCount: { type: Number, required: true, min: 1 },
    trek: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trek",
      required: true
    },
    finalPrice: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
  },
  { timestamps: true }
);

const UserBooking = mongoose.model("UserBooking", userBookingSchema);
export default UserBooking;

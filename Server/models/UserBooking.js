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
      ref: "Trek"
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour"
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

// Add validation to ensure either trek or tour is provided
userBookingSchema.pre('save', function(next) {
  if (!this.trek && !this.tour) {
    next(new Error('Either trek or tour must be specified'));
  } else if (this.trek && this.tour) {
    next(new Error('Cannot specify both trek and tour'));
  } else {
    next();
  }
});

const UserBooking = mongoose.model("UserBooking", userBookingSchema);
export default UserBooking;

import mongoose from "mongoose";

const travelerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const selectedDateWindowSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
);

const pickupLocationSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    pickupTime: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { _id: false }
);

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
    travelerDetails: {
      type: [travelerSchema],
      default: [],
      validate: {
        validator: function (value) {
          return value.length === this.membersCount;
        },
        message: "Traveler details must match membersCount",
      },
    },
    selectedDateWindow: selectedDateWindowSchema,
    pickupLocation: { type: pickupLocationSchema, required: true },
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

import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
  city: {
    type: String,
    enum: ["Chh. Sambhajinagar", "Pune", "Mumbai"],
  },
  price: { 
    type: Number, 
    required: false,  // Make price optional
    default: null     // Default to null when not provided
  },
  discountPrice: { type: Number, default: 0 },
});

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    thumbnail: { type: String, required: true },
    description: { type: String, required: true, minlength: 20 },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    tourType: {
      type: String,
      enum: ["Adventure", "Cultural", "Wildlife", "Spiritual", "Heritage", "Beach", "Hill Station", "Desert", "Backwater", "Photography"],
      default: "Adventure",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
      default: "Moderate",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    highlights: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    itinerary: [{
      day: { type: Number, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      meals: { type: String, default: "" },
      accommodation: { type: String, default: "" }
    }],
    cityPricing: {
      type: [priceSchema],
      validate: [
        {
          validator: function (value) {
            const cities = value.map((item) => item.city);
            return new Set(cities).size === cities.length; // prevent duplicates
          },
          message: "Duplicate city pricing is not allowed",
        },
      ],
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalBookings: { type: Number, default: 0 },
    maxGroupSize: { type: Number, default: 20 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;
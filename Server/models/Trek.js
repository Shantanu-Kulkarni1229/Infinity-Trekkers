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

const itinerarySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    meals: { type: String, default: "", trim: true },
    accommodation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const carryItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const pickupLocationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      enum: ["Chh. Sambhajinagar", "Pune", "Mumbai"],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    pickupTime: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const dateWindowSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
);

const trekSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    thumbnail: { type: String, required: true },
    description: { type: String, required: true, minlength: 20 },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Hard"],
      default: "Moderate",
    },
    specialType: {
      type: String,
      enum: [
        "Pre Monsoon Special",
        "Fireflies Festival Special",
        "Technical Treks",
        "Waterfall Treks",
        "Jungle Treks",
        "Outdoor Camping",
        "One Day Treks",
      ],
      default: "Technical Treks",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dateWindows: {
      type: [dateWindowSchema],
      default: [],
      validate: {
        validator: function (value) {
          const serialized = value.map((item) => `${new Date(item.startDate).toISOString()}|${new Date(item.endDate).toISOString()}`);
          return new Set(serialized).size === serialized.length;
        },
        message: "Duplicate date windows are not allowed",
      },
    },
    highlights: { type: [String], default: [] },
    itinerary: {
      type: [itinerarySchema],
      default: [],
      validate: {
        validator: function (value) {
          const days = value.map((item) => item.day);
          return new Set(days).size === days.length;
        },
        message: "Duplicate itinerary days are not allowed",
      },
    },
    thingsToCarry: { type: [carryItemSchema], default: [] },
    pickupLocations: { type: [pickupLocationSchema], default: [] },
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
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Trek = mongoose.model("Trek", trekSchema);
export default Trek;

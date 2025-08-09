import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({
  city: {
    type: String,
    enum: ["Chh. Sambhajinagar", "Pune", "Mumbai"],
    
  },
  price: { type: Number, },
  discountPrice: { type: Number, default: 0 },
});

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
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    highlights: { type: [String], default: [] },
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
  },
  { timestamps: true }
);

const Trek = mongoose.model("Trek", trekSchema);
export default Trek;

import mongoose from "mongoose";

const userEnquirySchema = new mongoose.Schema({
  // Required fields
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [100, 'Destination cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    trim: true
  },

  // Optional contact information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    maxlength: [100, 'Email cannot exceed 100 characters']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  // Enquiry details
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  preferredDate: {
    type: Date,
    validate: {
      validator: function (value) {
        // Only allow future dates
        return value > new Date();
      },
      message: 'Preferred date must be in the future'
    }
  },

  // System fields
  status: {
    type: String,
    enum: ['new', 'contacted', 'followup', 'converted', 'rejected'],
    default: 'new'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },

  // History with flexible changedBy
  statusHistory: [{
    status: {
      type: String,
      enum: ['new', 'contacted', 'followup', 'converted', 'rejected'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.Mixed, // ✅ Allows ObjectId or string
      ref: 'User',
      default: 'system'
    }
  }],

  // Metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userEnquirySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Text index for search
userEnquirySchema.index({
  destination: 'text',
  name: 'text',
  message: 'text'
});

export default mongoose.model("UserEnquiry", userEnquirySchema);

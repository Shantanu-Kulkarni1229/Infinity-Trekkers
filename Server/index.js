import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import trekRoutes from "./routes/trekRoutes.js";
import userBookingRoutes from "./routes/userBookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import "./services/bookingCleanupService.js";
import userRoutes from "./routes/userRoutes.js";
import UserEnquiryRoutes from "./routes/userEnquiryRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
dotenv.config();

const app = express();

// Middleware

// Middleware
const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://infinity-trekkers.vercel.app" // production frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  credentials: true
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to Database
connectDB();

app.use("/api/treks", trekRoutes);
app.use("/api/bookings", userBookingRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/enquiries', UserEnquiryRoutes);
app.use('/api/feedback', feedbackRoutes);
// Sample Route
app.get("/", (req, res) => {
  res.send("Infinity Trekkers Backend is running 🚀");
});

// Server Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

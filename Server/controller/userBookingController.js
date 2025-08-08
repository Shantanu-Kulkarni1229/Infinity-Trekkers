import Trek from "../models/Trek.js";
import UserBooking from "../models/UserBooking.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import transporter from "../config/nodemailer.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper function for error handling
const handleError = (res, error, defaultMessage = "Server Error") => {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ 
      success: false,
      message: "Validation Error",
      errors: error.errors 
    });
  }
  res.status(500).json({ 
    success: false,
    message: defaultMessage 
  });
};

// Validate phone number format
const isValidPhoneNumber = (phone) => {
  return /^[0-9]{10}$/.test(phone);
};

// Create booking and initiate Razorpay
export const createBooking = async (req, res) => {
  try {
    const { name, email, phoneNumber, city, membersCount, trekId } = req.body;

    if (!name || !email || !phoneNumber || !city || !membersCount || !trekId) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, phoneNumber, city, membersCount, trekId) are required",
      });
    }


    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format (10 digits required)",
      });
    }

    if (membersCount < 1 || membersCount > 20) {
      return res.status(400).json({
        success: false,
        message: "Members count must be between 1 and 20",
      });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found",
      });
    }

    if (!trek.isActive) {
      return res.status(400).json({
        success: false,
        message: "This trek is currently not available for booking",
        availableCities: trek.cityPricing.map((cp) => cp.city),
      });
    }

    // ✅ Check pricing availability
    const cityPriceObj = trek.cityPricing.find(
      (cp) => cp.city.toLowerCase() === city.toLowerCase()
    );
    if (!cityPriceObj) {
      return res.status(400).json({
        success: false,
        message: `No pricing available for ${city}`,
        availableCities: trek.cityPricing.map((cp) => cp.city), // ✅ Added here
      });
    }

    const pricePerMember =
      cityPriceObj.discountPrice > 0
        ? cityPriceObj.discountPrice
        : cityPriceObj.price;
    const finalPrice = pricePerMember * membersCount;

    if (finalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price calculation",
        availableCities: trek.cityPricing.map((cp) => cp.city), // ✅ Return cities
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalPrice * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        trekId: trek._id.toString(),
        city,
        membersCount,
        bookingFor: name,
      },
    });

        const booking = new UserBooking({
      name,
      email, // ✅ new field
      phoneNumber,
      city,
      membersCount,
      trek: trek._id,
      finalPrice,
      razorpayOrderId: order.id,
      paymentStatus: "pending",
    });


    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking created, proceed to payment",
      data: {
        order,
        bookingId: booking._id,
        amount: finalPrice,
        trekName: trek.name,
        availableCities: trek.cityPricing.map((cp) => cp.city), // ✅ Include cities in success response
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.error.description || "Payment gateway validation failed",
      });
    }
    handleError(res, error, "Failed to create booking");
  }
};


// Verify payment and update booking
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId
    } = req.body;

    // Log incoming data for debugging
    console.log("Received verification data:", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId
    });

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      console.warn("Signature mismatch:", { generatedSignature, razorpaySignature });
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature, payment verification failed" });
    }

    // ✅ Update booking
    const booking = await UserBooking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: "paid",
        razorpayPaymentId,
        razorpaySignature
      },
      { new: true }
    ).populate("trek", "name startDate endDate");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // ✅ Send email to user
 const userMailOptions = {
  from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
  to: booking.email || process.env.TEST_USER_EMAIL || "user@example.com",
  subject: `🎟️ Booking Confirmed: ${booking.trek.name.replace(/<[^>]*>/g, '')}`,
  html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f9f9f9;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
        }
        .header {
            background: linear-gradient(135deg, #2E8B57 0%, #3CB371 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 25px;
        }
        .trek-title {
            font-size: 20px;
            font-weight: 600;
            color: #2E8B57;
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 25px 0 15px 0;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 8px;
        }
        .details-list {
            margin: 0;
            padding: 0;
            list-style: none;
        }
        .details-list li {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
        }
        .details-list li:before {
            content: "✓";
            color: #2E8B57;
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        .payment-badge {
            display: inline-block;
            background-color: #e6f7ee;
            color: #2E8B57;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f5f5f5;
            font-size: 12px;
            color: #777;
        }
        .cta-button {
            display: inline-block;
            background-color: #2E8B57;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .mountain-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: block;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Your Adventure Awaits!</h1>
        </div>
        
        <div class="content">
            <svg class="mountain-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2E8B57">
                <path d="M12 3L2 21h20L12 3zm0 4.5l5.5 9.5H6.5L12 7.5z"/>
            </svg>
            
            <p>Dear <strong>${booking.name}</strong>,</p>
            
            <div class="trek-title">${booking.trek.name}</div>
            
            <p>We're thrilled to confirm your upcoming trek with Infinity Trekkers! Get ready for an unforgettable journey through breathtaking landscapes.</p>
            
            <div class="section-title">📅 Your Trek Details</div>
            <ul class="details-list">
                <li><strong>Date:</strong> ${new Date(booking.trek.startDate).toDateString()} to ${new Date(booking.trek.endDate).toDateString()}</li>
                <li><strong>Duration:</strong> ${booking.trek.duration || "As per itinerary"}</li>
                <li><strong>Difficulty:</strong> ${booking.trek.difficulty || "Moderate"}</li>
                <li><strong>Total Members:</strong> ${booking.membersCount}</li>
                <li><strong>Departure City:</strong> ${booking.city}</li>
            </ul>
            
            <div class="section-title">💳 Payment Information</div>
            <p>Your payment of <strong>₹${booking.finalPrice}</strong> has been received.</p>
            <span class="payment-badge">PAID ✅</span>
            
            <p style="margin-top: 25px;">You'll receive detailed preparation guidelines and WhatsApp group invite 1 day before your trek date.</p>
            
            <a href="mailto:${process.env.EMAIL_USER}" class="cta-button">Contact Our Team</a>
            
            <p>We can't wait to share this adventure with you! 🏔️</p>
            
            <p>Warm regards,<br/>
            <strong>Infinity Trekkers India Team</strong></p>
        </div>
        
        <div class="footer">
            <small>This is an automated confirmation. Please do not reply directly to this email.</small>
            <p style="margin-top: 10px;">
                <a href="https://infinitytrekkersindia.com" style="color: #2E8B57; text-decoration: none;">infinitytrekkersindia.com</a>
            </p>
        </div>
    </div>
</body>
</html>
`
};

// Admin notification email
const adminMailOptions = {
  from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: `🚨 New Booking: ${booking.trek.name.replace(/<[^>]*>/g, '')} - ${booking.membersCount} pax`,
  html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f9f9f9;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
        }
        .header {
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
            padding: 25px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .content {
            padding: 25px;
        }
        .booking-title {
            font-size: 18px;
            font-weight: 600;
            color: #FF6B6B;
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 20px 0 10px 0;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 6px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .detail-item {
            margin-bottom: 10px;
        }
        .detail-label {
            font-weight: 500;
            color: #666;
            font-size: 14px;
        }
        .detail-value {
            font-weight: 600;
            color: #333;
            font-size: 15px;
        }
        .alert-badge {
            display: inline-block;
            background-color: #FFEBEE;
            color: #FF6B6B;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 15px;
            background-color: #f5f5f5;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🚨 New Booking Alert</h1>
        </div>
        
        <div class="content">
            <div class="booking-title">${booking.trek.name}</div>
            
            <p><strong>${booking.name}</strong> has just confirmed a booking!</p>
            
            <div class="section-title">Booking Summary</div>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${booking.phoneNumber}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${booking.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div class="detail-value">${booking.city}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Members</div>
                    <div class="detail-value">${booking.membersCount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Amount Paid</div>
                    <div class="detail-value">₹${booking.finalPrice}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Dates</div>
                    <div class="detail-value">${new Date(booking.trek.startDate).toDateString()} - ${new Date(booking.trek.endDate).toDateString()}</div>
                </div>
            </div>
            
            <div style="margin-top: 25px;">
                <span class="alert-badge">ACTION REQUIRED</span>
                <p style="margin-top: 10px;">Please process this booking in the admin panel and add the customer to the trek WhatsApp group.</p>
            </div>
        </div>
        
        <div class="footer">
            <small>This is an automated notification from Infinity Trekkers India</small>
        </div>
    </div>
</body>
</html>
`
};

await transporter.sendMail(userMailOptions);
await transporter.sendMail(adminMailOptions);

    
    // ✅ Respond to frontend
    res.status(200).json({
      success: true,
      message: "Payment verified, emails sent",
      booking
    });

  } catch (error) {
    console.error("🔴 Payment Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error during payment verification" });
  }
};
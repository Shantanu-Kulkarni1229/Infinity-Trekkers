import Razorpay from "razorpay";
import UserBooking from "../models/UserBooking.js";
import Trek from "../models/Trek.js";
import Tour from "../models/Tour.js";
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

// Create booking and initiate Razorpay (unified for treks and tours)
export const createBooking = async (req, res) => {
  try {
    const { name, email, phoneNumber, city, membersCount, trekId, tourId, bookingType = "trek" } = req.body;

    if (!name || !email || !phoneNumber || !city || !membersCount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!trekId && !tourId) {
      return res.status(400).json({
        success: false,
        message: "Either trekId or tourId is required"
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format (10 digits required)"
      });
    }

    if (membersCount < 1 || membersCount > 20) {
      return res.status(400).json({
        success: false,
        message: "Members count must be between 1 and 20"
      });
    }

    // Find the item (trek or tour)
    let item = null;
    let itemType = "";
    
    if (trekId) {
      item = await Trek.findById(trekId);
      itemType = "trek";
    } else if (tourId) {
      item = await Tour.findById(tourId);
      itemType = "tour";
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`
      });
    }

    if (!item.isActive) {
      return res.status(400).json({
        success: false,
        message: `This ${itemType} is currently not available for booking`
      });
    }

    // ✅ Check pricing availability
    const cityPriceObj = item.cityPricing.find(
      (cp) => cp.city.toLowerCase() === city.toLowerCase()
    );
    if (!cityPriceObj) {
      return res.status(400).json({
        success: false,
        message: `No pricing available for ${city}`,
        availableCities: item.cityPricing.map((cp) => cp.city)
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
        message: "Invalid price calculation"
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(finalPrice * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        itemId: item._id.toString(),
        itemType: itemType,
        city,
        membersCount,
        bookingFor: name,
      },
    });

    const bookingData = {
      name,
      email,
      phoneNumber,
      city,
      membersCount,
      finalPrice,
      razorpayOrderId: order.id,
      paymentStatus: "pending",
    };

    // Set either trek or tour reference
    if (trekId) {
      bookingData.trek = item._id;
    } else if (tourId) {
      bookingData.tour = item._id;
    }

    const booking = new UserBooking(bookingData);
    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking created, proceed to payment",
      data: {
        order,
        bookingId: booking._id,
        amount: finalPrice,
        itemName: item.name,
        itemType: itemType,
        availableCities: item.cityPricing.map((cp) => cp.city),
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    handleError(res, error, "Failed to create booking");
  }
};

// Verify payment and update booking (unified for treks and tours)
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
      return res.status(400).json({ success: false, message: "Missing required payment verification data" });
    }

    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
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
    ).populate("trek", "name startDate endDate")
     .populate("tour", "name startDate endDate");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const item = booking.trek || booking.tour;
    const itemType = booking.trek ? "trek" : "tour";

    // ✅ Send email to user
    const userMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `🎉 Payment Successful - ${item.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #28a745; margin: 0;">🎉 Payment Successful!</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Booking Details</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${item.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">Customer Name:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${booking.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">Phone Number:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${booking.phoneNumber}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">Start Date:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${new Date(item.startDate).toDateString()}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">End Date:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${new Date(item.endDate).toDateString()}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">Members:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${booking.membersCount}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 8px 0; font-weight: bold; color: #495057;">City:</td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">${booking.city}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #495057; font-size: 18px;">Total Amount:</td>
                    <td style="padding: 8px 0; text-align: right; color: #28a745; font-weight: bold; font-size: 18px;">₹${booking.finalPrice}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div style="margin-bottom: 30px;">
              <h3 style="color: #333; margin-bottom: 15px;">Payment Information</h3>
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <p style="margin: 0; color: #495057;"><strong>Payment ID:</strong> ${razorpayPaymentId}</p>
                <p style="margin: 5px 0 0 0; color: #495057;"><strong>Order ID:</strong> ${razorpayOrderId}</p>
              </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #856404; margin-top: 0;">📋 Important Instructions</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Please carry a valid ID proof during the ${itemType}</li>
                <li>Reach the pickup point 15 minutes before departure time</li>
                <li>Follow all safety guidelines provided by our team</li>
                <li>Contact us for any queries or assistance</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6c757d; margin-bottom: 10px;">Thank you for choosing Infinity Trekkers!</p>
              <p style="color: #6c757d; font-size: 14px;">For support, contact us at: <a href="mailto:support@infinitytrekkers.com" style="color: #007bff; text-decoration: none;">support@infinitytrekkers.com</a></p>
            </div>
          </div>
        </div>
      `,
      text: `Payment successful for ${item.name}. Booking ID: ${booking._id}. Amount: ₹${booking.finalPrice}. Start Date: ${new Date(item.startDate).toDateString()}.`
    };

    // ✅ Send email to admin
    const adminMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `💰 New Booking Payment: ${item.name} - ${booking.membersCount} pax`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; text-align: center; margin-bottom: 30px;">💰 New Booking Payment Received</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">${itemType.charAt(0).toUpperCase() + itemType.slice(1)}:</td>
                  <td style="padding: 8px 0; text-align: right;">${item.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
                  <td style="padding: 8px 0; text-align: right;">${booking.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                  <td style="padding: 8px 0; text-align: right;">${booking.phoneNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; text-align: right;">${booking.email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">City:</td>
                  <td style="padding: 8px 0; text-align: right;">${booking.city}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Members:</td>
                  <td style="padding: 8px 0; text-align: right;">${booking.membersCount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
                  <td style="padding: 8px 0; text-align: right; color: #28a745; font-size: 18px; font-weight: bold;">₹${booking.finalPrice}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="padding: 8px 0; font-weight: bold;">Payment ID:</td>
                  <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${razorpayPaymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Date Range:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(item.startDate).toDateString()} - ${new Date(item.endDate).toDateString()}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `,
      text: `New booking payment: ${booking.name} paid ₹${booking.finalPrice} for ${item.name} (${booking.membersCount} members from ${booking.city})`
    };

    // Send emails
    try {
      await transporter.sendMail(userMailOptions);
      await transporter.sendMail(adminMailOptions);
      console.log("✅ Confirmation emails sent successfully");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      // Don't fail the payment verification if email fails
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully and confirmation emails sent",
      data: {
        bookingId: booking._id,
        paymentId: razorpayPaymentId,
        amount: booking.finalPrice,
        itemName: item.name,
        itemType: itemType
      }
    });

  } catch (error) {
    handleError(res, error, "Payment verification failed");
  }
};
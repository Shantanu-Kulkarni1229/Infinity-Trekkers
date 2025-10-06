import UserBooking from "../models/UserBooking.js";
import Trek from "../models/Trek.js";
import Tour from "../models/Tour.js";
import transporter from "../config/nodemailer.js";

// Helper function for error handling
const handleError = (res, error, defaultMessage = "Server Error") => {
  console.error(error);
  if (error.name === "CastError") {
    return res.status(400).json({ 
      success: false,
      message: "Invalid ID format" 
    });
  }
  res.status(500).json({ 
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// ✅ Get all users for a particular trek with summary (enhanced with pagination and filters)
export const getUsersByTrek = async (req, res) => {
  try {
    const { trekId } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    // Validate trek ID
    if (!trekId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid trek ID format" 
      });
    }

    // Check if trek exists
    const trek = await Trek.findById(trekId).select("name startDate endDate isActive");
    if (!trek) {
      return res.status(404).json({ 
        success: false, 
        message: "Trek not found" 
      });
    }

    // Build query
    const query = { trek: trekId };
    if (status !== 'all') {
      query.paymentStatus = status;
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      UserBooking.find(query)
        .select("name phoneNumber membersCount city finalPrice paymentStatus createdAt")
        .populate("trek", "name startDate endDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      UserBooking.countDocuments(query)
    ]);

    // Calculate summary
    const totalMembers = bookings.reduce((sum, user) => sum + user.membersCount, 0);
    const totalRevenue = bookings.reduce((sum, user) => 
      sum + (user.paymentStatus === "paid" ? user.finalPrice : 0), 0);

    res.status(200).json({
      success: true,
      data: {
        trekDetails: {
          id: trek._id,
          name: trek.name,
          startDate: trek.startDate,
          endDate: trek.endDate,
          isActive: trek.isActive,
          totalMembers,
          totalRevenue
        },
        meta: {
          totalBookings: totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          bookingsCount: bookings.length,
          statusFilter: status
        },
        bookings: bookings.map(booking => ({
          id: booking._id,
          name: booking.name,
          phone: booking.phoneNumber,
          city: booking.city,
          members: booking.membersCount,
          amount: booking.finalPrice,
          status: booking.paymentStatus,
          bookedOn: booking.createdAt
        }))
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch trek bookings");
  }
};

// ✅ Delete all bookings for a trek after it is completed (with additional checks)
export const clearPastTrekBookings = async (req, res) => {
  try {
    const { trekId } = req.params;

    // Validate trek ID
    if (!trekId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid trek ID format" 
      });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ 
        success: false, 
        message: "Trek not found" 
      });
    }

    // Additional check for active treks
    if (trek.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete bookings for active treks. Deactivate trek first."
      });
    }

    // Ensure trek is completed
    if (new Date() < new Date(trek.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Trek is not completed yet. Cannot delete bookings."
      });
    }

    // Check if there are any paid bookings
    const paidBookingsCount = await UserBooking.countDocuments({ 
      trek: trekId, 
      paymentStatus: 'paid' 
    });

    if (paidBookingsCount > 0) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete trek with paid bookings. Archive instead."
      });
    }

    const result = await UserBooking.deleteMany({ trek: trekId });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} bookings for completed trek`,
      data: {
        trekId: trek._id,
        trekName: trek.name,
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to clear trek bookings");
  }
};

// ✅ Get all upcoming and past treks with bookings (enhanced with filters)
export const getTreksOverview = async (req, res) => {
  try {
    const { status = 'all', sort = 'startDate', page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (status === 'upcoming') {
      query.startDate = { $gt: new Date() };
    } else if (status === 'completed') {
      query.endDate = { $lt: new Date() };
    } else if (status === 'active') {
      query.$and = [
        { startDate: { $lte: new Date() } },
        { endDate: { $gte: new Date() } }
      ];
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [treks, totalCount] = await Promise.all([
      Trek.find(query)
        .select("name startDate endDate isActive")
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),
      Trek.countDocuments(query)
    ]);

    const overview = await Promise.all(
      treks.map(async trek => {
        const bookings = await UserBooking.find({ trek: trek._id });
        const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
        
        return {
          id: trek._id,
          name: trek.name,
          startDate: trek.startDate,
          endDate: trek.endDate,
          isActive: trek.isActive,
          totalBookings: bookings.length,
          paidBookings: paidBookings.length,
          totalMembers: bookings.reduce((sum, b) => sum + b.membersCount, 0),
          totalRevenue: paidBookings.reduce((sum, b) => sum + b.finalPrice, 0),
          status: new Date() > new Date(trek.endDate) ? 
            "completed" : 
            (new Date() < new Date(trek.startDate) ? "upcoming" : "active")
        };
      })
    );

    res.status(200).json({ 
      success: true,
      data: overview,
      meta: {
        totalTreks: totalCount,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
        statusFilter: status,
        sortBy: sort
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch trek overview");
  }
};

// ✅ Create offline booking (cash payment) by admin
export const createOfflineBooking = async (req, res) => {
  try {
    console.log("Received offline booking request:", req.body);
    const { name, email, phoneNumber, city, membersCount, trekId, tourId, bookingType = "trek", paymentMode = "cash" } = req.body;

    // Validation
    if (!name || !email || !phoneNumber || !city || !membersCount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (name, email, phoneNumber, city, membersCount)",
      });
    }

    if (!trekId && !tourId) {
      return res.status(400).json({
        success: false,
        message: "Either trekId or tourId is required",
      });
    }

    // Validate phone number format
    const isValidPhoneNumber = (phone) => {
      return /^[0-9]{10}$/.test(phone);
    };

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

    // Check if trek or tour exists
    let item = null;
    let itemType = "";
    
    if (trekId) {
      item = await Trek.findById(trekId);
      itemType = "trek";
      console.log("Found trek:", item ? item.name : "Not found");
    } else if (tourId) {
      item = await Tour.findById(tourId);
      itemType = "tour";
      console.log("Found tour:", item ? item.name : "Not found");
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found`,
      });
    }

    if (!item.isActive) {
      return res.status(400).json({
        success: false,
        message: `This ${itemType} is currently not available for booking`,
      });
    }

    // Check pricing availability
    const cityPriceObj = item.cityPricing.find(
      (cp) => cp.city.toLowerCase() === city.toLowerCase()
    );
    if (!cityPriceObj) {
      return res.status(400).json({
        success: false,
        message: `No pricing available for ${city}`,
        availableCities: item.cityPricing.map((cp) => cp.city),
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
      });
    }

    // Create offline booking with "paid" status
    const bookingData = {
      name,
      email,
      phoneNumber,
      city,
      membersCount,
      finalPrice,
      paymentStatus: "paid", // Mark as paid since it's cash payment
      razorpayOrderId: `OFFLINE_${Date.now()}`, // Generate unique identifier for offline bookings
      razorpayPaymentId: `CASH_${Date.now()}`,
      razorpaySignature: "OFFLINE_CASH_PAYMENT"
    };

    // Set either trek or tour reference
    if (trekId) {
      bookingData.trek = item._id;
    } else if (tourId) {
      bookingData.tour = item._id;
    }

    const booking = new UserBooking(bookingData);

    await booking.save();
    console.log("Booking saved successfully:", booking._id);

    // Send confirmation emails (simple version)
    const userMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `🎟️ Booking Confirmed: ${item.name.replace(/<[^>]*>/g, '')}`,
      html: `
<h2>Booking Confirmed!</h2>
<p>Dear ${booking.name},</p>
<p>Your booking for <strong>${item.name}</strong> has been confirmed.</p>
<p><strong>Details:</strong></p>
<ul>
  <li>Date: ${new Date(item.startDate).toDateString()} to ${new Date(item.endDate).toDateString()}</li>
  <li>Members: ${booking.membersCount}</li>
  <li>City: ${booking.city}</li>
  <li>Amount: ₹${booking.finalPrice}</li>
  <li>Type: ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}</li>
</ul>
<p>Thank you for choosing Infinity Trekkers!</p>
`,
      text: `Booking confirmed for ${item.name}. Details: ${booking.membersCount} members from ${booking.city} for ₹${booking.finalPrice}`
    };

    // Admin notification email (simple version)
    const adminMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `💰 Offline Booking: ${item.name} - ${booking.membersCount} pax (Cash)`,
      html: `
<h2>New Offline Booking</h2>
<p><strong>${booking.name}</strong> has been added as an offline booking.</p>
<p><strong>Details:</strong></p>
<ul>
  <li>${itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${item.name}</li>
  <li>Phone: ${booking.phoneNumber}</li>
  <li>Email: ${booking.email}</li>
  <li>City: ${booking.city}</li>
  <li>Members: ${booking.membersCount}</li>
  <li>Amount (Cash): ₹${booking.finalPrice}</li>
  <li>Dates: ${new Date(item.startDate).toDateString()} - ${new Date(item.endDate).toDateString()}</li>
</ul>
<p>This booking was added via admin panel for cash payment.</p>
`,
      text: `New offline booking: ${booking.name} for ${item.name}, ${booking.membersCount} members, ₹${booking.finalPrice} cash payment`
    };

    // Send emails
    let emailStatus = "not sent";
    try {
      console.log("Attempting to send emails...");
      await transporter.sendMail(userMailOptions);
      console.log("User email sent successfully");
      await transporter.sendMail(adminMailOptions);
      console.log("Admin email sent successfully");
      emailStatus = "sent successfully";
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      emailStatus = "failed";
      // Don't fail the booking creation if email fails
    }

    console.log("About to send response...");
    res.status(201).json({
      success: true,
      message: `Offline booking created successfully and confirmation emails ${emailStatus}`,
      data: {
        bookingId: booking._id,
        itemName: item.name,
        itemType: itemType,
        customerName: booking.name,
        amount: finalPrice,
        membersCount: booking.membersCount,
        city: booking.city,
        paymentMode: "cash"
      },
    });

  } catch (error) {
    handleError(res, error, "Failed to create offline booking");
  }
};

// ✅ Get all users for a particular tour with summary
export const getUsersByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { status = 'all', page = 1, limit = 20 } = req.query;

    // Validate tour ID
    if (!tourId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid tour ID format" 
      });
    }

    // Check if tour exists
    const tour = await Tour.findById(tourId).select("name startDate endDate isActive");
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: "Tour not found" 
      });
    }

    // Build query
    const query = { tour: tourId };
    if (status !== 'all') {
      query.paymentStatus = status;
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get bookings with pagination
    const [bookings, totalCount] = await Promise.all([
      UserBooking.find(query)
        .select("name phoneNumber membersCount city finalPrice paymentStatus createdAt")
        .populate("tour", "name startDate endDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      UserBooking.countDocuments(query)
    ]);

    // Calculate summary
    const totalMembers = bookings.reduce((sum, user) => sum + user.membersCount, 0);
    const totalRevenue = bookings.reduce((sum, user) => 
      sum + (user.paymentStatus === "paid" ? user.finalPrice : 0), 0);

    res.status(200).json({
      success: true,
      data: {
        tourDetails: {
          id: tour._id,
          name: tour.name,
          startDate: tour.startDate,
          endDate: tour.endDate,
          isActive: tour.isActive,
          totalMembers,
          totalRevenue
        },
        meta: {
          totalBookings: totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          bookingsCount: bookings.length,
          statusFilter: status
        },
        bookings: bookings.map(booking => ({
          id: booking._id,
          name: booking.name,
          phone: booking.phoneNumber,
          city: booking.city,
          members: booking.membersCount,
          amount: booking.finalPrice,
          status: booking.paymentStatus,
          bookedOn: booking.createdAt
        }))
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to get tour users");
  }
};

// ✅ Get all bookings (treks and tours combined) for admin overview
export const getAllBookings = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50, type = 'all' } = req.query;

    // Build query
    const query = {};
    if (status !== 'all') {
      query.paymentStatus = status;
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get all bookings with population
    let bookingsQuery = UserBooking.find(query)
      .select("name phoneNumber membersCount city finalPrice paymentStatus createdAt trek tour")
      .populate("trek", "name startDate endDate")
      .populate("tour", "name startDate endDate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const [bookings, totalCount] = await Promise.all([
      bookingsQuery.exec(),
      UserBooking.countDocuments(query)
    ]);

    // Filter by type if specified
    let filteredBookings = bookings;
    if (type === 'trek') {
      filteredBookings = bookings.filter(booking => booking.trek);
    } else if (type === 'tour') {
      filteredBookings = bookings.filter(booking => booking.tour);
    }

    // Calculate summary
    const totalMembers = filteredBookings.reduce((sum, booking) => sum + booking.membersCount, 0);
    const totalRevenue = filteredBookings.reduce((sum, booking) => 
      sum + (booking.paymentStatus === "paid" ? booking.finalPrice : 0), 0);

    res.status(200).json({
      success: true,
      data: {
        meta: {
          totalBookings: totalCount,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          bookingsCount: filteredBookings.length,
          statusFilter: status,
          typeFilter: type,
          totalMembers,
          totalRevenue
        },
        bookings: filteredBookings.map(booking => {
          const item = booking.trek || booking.tour;
          const itemType = booking.trek ? 'trek' : 'tour';
          
          return {
            id: booking._id,
            name: booking.name,
            phone: booking.phoneNumber,
            city: booking.city,
            members: booking.membersCount,
            amount: booking.finalPrice,
            status: booking.paymentStatus,
            bookedOn: booking.createdAt,
            itemType: itemType,
            itemName: item?.name || 'Unknown',
            itemDates: item ? `${new Date(item.startDate).toDateString()} - ${new Date(item.endDate).toDateString()}` : 'N/A'
          };
        })
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to get all bookings");
  }
};

// ✅ Get tours overview with booking statistics
export const getToursOverview = async (req, res) => {
  try {
    const tours = await Tour.find({ isActive: true }).select("name startDate endDate isActive").sort({ startDate: 1 });

    // Get booking statistics for each tour
    const toursWithStats = await Promise.all(
      tours.map(async (tour) => {
        const bookings = await UserBooking.find({ tour: tour._id });
        const totalBookings = bookings.length;
        const totalMembers = bookings.reduce((sum, booking) => sum + booking.membersCount, 0);
        const totalRevenue = bookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === "paid" ? booking.finalPrice : 0), 0);

        return {
          id: tour._id,
          name: tour.name,
          startDate: tour.startDate,
          endDate: tour.endDate,
          isActive: tour.isActive,
          totalBookings,
          totalMembers,
          totalRevenue,
          type: "tour"
        };
      })
    );

    res.status(200).json({
      success: true,
      data: toursWithStats
    });
  } catch (error) {
    handleError(res, error, "Failed to get tours overview");
  }
};

// ✅ Get unified overview (treks and tours combined)
export const getUnifiedOverview = async (req, res) => {
  try {
    const [treks, tours] = await Promise.all([
      Trek.find({ isActive: true }).select("name startDate endDate isActive").sort({ startDate: 1 }),
      Tour.find({ isActive: true }).select("name startDate endDate isActive").sort({ startDate: 1 })
    ]);

    // Get booking statistics for treks
    const treksWithStats = await Promise.all(
      treks.map(async (trek) => {
        const bookings = await UserBooking.find({ trek: trek._id });
        const totalBookings = bookings.length;
        const totalMembers = bookings.reduce((sum, booking) => sum + booking.membersCount, 0);
        const totalRevenue = bookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === "paid" ? booking.finalPrice : 0), 0);

        return {
          id: trek._id,
          name: trek.name,
          startDate: trek.startDate,
          endDate: trek.endDate,
          isActive: trek.isActive,
          totalBookings,
          totalMembers,
          totalRevenue,
          type: "trek"
        };
      })
    );

    // Get booking statistics for tours
    const toursWithStats = await Promise.all(
      tours.map(async (tour) => {
        const bookings = await UserBooking.find({ tour: tour._id });
        const totalBookings = bookings.length;
        const totalMembers = bookings.reduce((sum, booking) => sum + booking.membersCount, 0);
        const totalRevenue = bookings.reduce((sum, booking) => 
          sum + (booking.paymentStatus === "paid" ? booking.finalPrice : 0), 0);

        return {
          id: tour._id,
          name: tour.name,
          startDate: tour.startDate,
          endDate: tour.endDate,
          isActive: tour.isActive,
          totalBookings,
          totalMembers,
          totalRevenue,
          type: "tour"
        };
      })
    );

    // Combine and sort by start date
    const allItems = [...treksWithStats, ...toursWithStats].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    res.status(200).json({
      success: true,
      data: allItems
    });
  } catch (error) {
    handleError(res, error, "Failed to get unified overview");
  }
};

// ✅ Clear past tour bookings (similar to trek clearing)
export const clearPastTourBookings = async (req, res) => {
  try {
    const { tourId } = req.params;

    if (!tourId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid tour ID format" 
      });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false, 
        message: "Tour not found" 
      });
    }

    const currentDate = new Date();
    if (tour.endDate > currentDate) {
      return res.status(400).json({
        success: false,
        message: "Cannot clear bookings for future or ongoing tours"
      });
    }

    const result = await UserBooking.deleteMany({ tour: tourId });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} booking(s) for past tour: ${tour.name}`,
      data: {
        deletedCount: result.deletedCount,
        tourName: tour.name,
        tourEndDate: tour.endDate
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to clear past tour bookings");
  }
};
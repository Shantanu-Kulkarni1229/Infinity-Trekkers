import UserBooking from "../models/UserBooking.js";
import Trek from "../models/Trek.js";

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
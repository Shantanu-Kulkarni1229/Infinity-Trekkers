import UserBooking from "../models/UserBooking.js";
import Trek from "../models/Trek.js";
import Tour from "../models/Tour.js";
import transporter from "../config/nodemailer.js";
import { normalizeTravelerDetails, normalizeOptionalTravelerDetails, isMatchingDateWindow } from "../utils/bookingHelpers.js";
import { calculateMemberDiscountedPrice } from "../utils/bookingHelpers.js";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

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

const formatDateWindowKey = (window = {}) => {
  const label = String(window?.label ?? "").trim() || "Primary Schedule";
  const startCandidate = window?.startDate ? new Date(window.startDate) : null;
  const endCandidate = window?.endDate ? new Date(window.endDate) : null;
  const startDate = startCandidate instanceof Date && !Number.isNaN(startCandidate.getTime()) ? startCandidate : null;
  const endDate = endCandidate instanceof Date && !Number.isNaN(endCandidate.getTime()) ? endCandidate : null;

  return {
    key: `${label}|${startDate?.toISOString() || ""}|${endDate?.toISOString() || ""}`,
    label,
    startDate: startDate ? startDate.toISOString() : "",
    endDate: endDate ? endDate.toISOString() : "",
  };
};

const buildBatchSummary = (bookings = []) => {
  const batches = new Map();

  bookings.forEach((booking) => {
    const window = formatDateWindowKey(booking.selectedDateWindow);
    const current = batches.get(window.key) || {
      ...window,
      totalBookings: 0,
      totalMembers: 0,
      totalRevenue: 0,
      paidBookings: 0,
      pendingBookings: 0,
      failedBookings: 0,
    };

    current.totalBookings += 1;
    current.totalMembers += Number(booking.membersCount || 0);
    if (booking.paymentStatus === "paid") {
      current.paidBookings += 1;
      current.totalRevenue += Number(booking.finalPrice || 0);
    } else if (booking.paymentStatus === "pending") {
      current.pendingBookings += 1;
    } else if (booking.paymentStatus === "failed") {
      current.failedBookings += 1;
    }

    batches.set(window.key, current);
  });

  return [...batches.values()].sort((left, right) => {
    const leftDate = new Date(left.startDate || left.endDate || 0).getTime();
    const rightDate = new Date(right.startDate || right.endDate || 0).getTime();
    return leftDate - rightDate;
  });
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeRichHtml = (value = "") =>
  String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "");

const formatEmailDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatBatchLabel = (window = {}) => {
  const label = String(window?.label ?? "").trim();
  return label || "Primary Schedule";
};

const formatDateDDMMYYYY = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const buildPaymentMethodLabel = (booking) => {
  if (booking?.paymentMode === "cash") return "Cash";
  if (booking?.paymentMode === "online") return booking.paymentStatus === "paid" ? "Online (Paid)" : "Online (Pending)";
  if (String(booking?.razorpayPaymentId || "").startsWith("CASH_")) return "Cash";
  if (booking?.razorpayPaymentId || booking?.razorpayOrderId) return "Online";
  return booking?.paymentStatus === "paid" ? "Paid" : "Pending";
};

const getItemLabel = (item) => item?.name || "Selected Trip";

const getBookingItem = (booking) => booking.trek || booking.tour || null;

const getBookingItemType = (booking) => (booking.trek ? "trek" : "tour");

const findBatchBookings = (bookings = [], selectedDateWindow = {}) => {
  return bookings.filter((booking) => isMatchingDateWindow(booking.selectedDateWindow, selectedDateWindow));
};

const writePdfRows = (doc, rows, options = {}) => {
  const { x = 40, y = 0, columns = [], rowHeight = 22, headerHeight = 28, pageBottom = 750 } = options;
  let currentY = y;

  const drawHeader = () => {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
    let currentX = x;
    columns.forEach((column) => {
      doc.rect(currentX, currentY, column.width, headerHeight).fillAndStroke("#e0f2fe", "#94a3b8");
      doc.fillColor("#0f172a").text(column.label, currentX + 6, currentY + 8, {
        width: column.width - 12,
        align: column.align || "left",
      });
      currentX += column.width;
    });
    currentY += headerHeight;
  };

  const ensureSpace = () => {
    if (currentY + rowHeight > pageBottom) {
      doc.addPage();
      currentY = 40;
      drawHeader();
    }
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    ensureSpace();
    let currentX = x;
    columns.forEach((column) => {
      doc.rect(currentX, currentY, column.width, rowHeight).stroke("#cbd5e1");
      doc.font("Helvetica").fontSize(8.5).fillColor("#111827").text(String(row[column.key] ?? ""), currentX + 5, currentY + 6, {
        width: column.width - 10,
        align: column.align || "left",
      });
      currentX += column.width;
    });
    currentY += rowHeight;
    if (rowIndex === rows.length - 1) {
      currentY += 4;
    }
  });
};

const getBookingsForBatch = async ({ itemId, itemType, selectedDateWindow, status = "all" }) => {
  const query = { [itemType]: itemId };
  if (status !== "all") {
    query.paymentStatus = status;
  }

  const bookings = await UserBooking.find(query)
    .select("name phoneNumber email membersCount city finalPrice paymentStatus paymentMode advancePaidAmount remainingAmount createdAt travelerDetails selectedDateWindow pickupLocation trek tour razorpayPaymentId razorpayOrderId")
    .populate(itemType, "name startDate endDate")
    .sort({ createdAt: 1 });

  return bookings.filter((booking) => isMatchingDateWindow(booking.selectedDateWindow, selectedDateWindow));
};

const sendPdfBuffer = (res, doc, filename) => {
  const stream = new PassThrough();
  const chunks = [];

  stream.on("data", (chunk) => chunks.push(chunk));
  stream.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(pdfBuffer);
  });

  doc.pipe(stream);
  doc.end();
};

const pickOfflineDateWindow = (item, selectedDateWindow) => {
  const availableDateWindows = item?.dateWindows?.length > 0
    ? item.dateWindows
    : [{ label: "Primary Schedule", startDate: item.startDate, endDate: item.endDate }];

  if (!selectedDateWindow) {
    return availableDateWindows[0] || null;
  }

  return availableDateWindows.find((window) => isMatchingDateWindow(window, selectedDateWindow)) || availableDateWindows[0] || null;
};

const buildOfflineBookingEmailHtml = ({ item, itemType, booking, pickupLocationSummary, remainingAmount, advancePaidAmount, selectedDateWindow }) => {
  const itinerary = Array.isArray(item.itinerary) ? item.itinerary : [];
  const highlights = Array.isArray(item.highlights) ? item.highlights : [];
  const carryItems = Array.isArray(item.thingsToCarry) ? item.thingsToCarry : [];
  const pickupLocations = Array.isArray(item.pickupLocations) ? item.pickupLocations : [];
  const cityPricing = Array.isArray(item.cityPricing) ? item.cityPricing : [];
  const memberDiscountRules = Array.isArray(item.memberDiscountRules) ? item.memberDiscountRules : [];

  const travelerRows = booking.travelerDetails.length > 0
    ? booking.travelerDetails.map((traveler, index) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;">${index + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;">${escapeHtml(traveler.name || "N/A") || "N/A"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;">${escapeHtml(traveler.phoneNumber || "N/A") || "N/A"}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" style="padding:12px;color:#4b5563;">No member details provided.</td></tr>`;

  const itineraryRows = itinerary.length > 0
    ? itinerary.map((day) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;vertical-align:top;">${escapeHtml(day.day ?? "")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;vertical-align:top;">${escapeHtml(day.title || "")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;vertical-align:top;line-height:1.6;">${sanitizeRichHtml(day.description || "") || ""}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;vertical-align:top;">${escapeHtml(day.meals || "")}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #d7e6f4;vertical-align:top;">${escapeHtml(day.accommodation || "")}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5" style="padding:12px;color:#4b5563;">No itinerary added.</td></tr>`;

  const highlightsMarkup = highlights.length > 0
    ? `<ul style="margin:0;padding-left:18px;color:#1f2937;">${highlights.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p style="margin:0;color:#4b5563;">No highlights added.</p>`;

  const carryMarkup = carryItems.length > 0
    ? `<ul style="margin:0;padding-left:18px;color:#1f2937;">${carryItems.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item.item || item || "")}${item.details ? ` - ${escapeHtml(item.details)}` : ""}${item.required === false ? " (Optional)" : ""}</li>`).join("")}</ul>`
    : `<p style="margin:0;color:#4b5563;">No carry list added.</p>`;

  const pricingMarkup = cityPricing.length > 0
    ? cityPricing.map((pricing) => `<li>${escapeHtml(pricing.city || "")} - ${formatMoney(pricing.discountPrice > 0 ? pricing.discountPrice : pricing.price || 0)} per person</li>`).join("")
    : `<li>No city pricing data available.</li>`;

  const pickupMarkup = pickupLocations.length > 0
    ? pickupLocations.map((location) => `<li>${escapeHtml(location.city || "")} - ${escapeHtml(location.location || "")} (${escapeHtml(location.pickupTime || "")})${location.notes ? ` - ${escapeHtml(location.notes)}` : ""}</li>`).join("")
    : `<li>No pickup locations available.</li>`;

  const discountMarkup = memberDiscountRules.length > 0
    ? memberDiscountRules.map((rule) => `<li>${escapeHtml(rule.label || "Tier")}: ${escapeHtml(String(rule.minMembers || ""))}+ members, ${escapeHtml(String(rule.discountValue || ""))} ${rule.discountType === "percentage" ? "%" : "per person"}</li>`).join("")
    : `<li>No member discount rules configured.</li>`;

  return `
    <div style="margin:0;padding:0;background:#f4f8fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #d7e6f4;">
        <div style="background:#38bdf8;color:#ffffff;padding:24px 28px;">
          <h1 style="margin:0;font-size:24px;line-height:1.3;">Offline Booking Confirmed</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Cash booking created by admin panel</p>
        </div>

        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;">Dear ${escapeHtml(booking.name)},</p>
          <p style="margin:0 0 20px;line-height:1.6;">Your offline booking has been recorded successfully for <strong>${escapeHtml(item.name || "the selected trip")}</strong>.</p>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#0369a1;">Advance Payment Summary</p>
            <p style="margin:0 0 6px;">Total amount: <strong>${formatMoney(booking.finalPrice)}</strong></p>
            <p style="margin:0 0 6px;">Advance received: <strong>${formatMoney(advancePaidAmount)}</strong></p>
            <p style="margin:0 0 6px;">Remaining amount: <strong>${formatMoney(remainingAmount)}</strong></p>
            <p style="margin:0;color:#b45309;font-weight:bold;">Advance is refundable only if the booking is cancelled at least 3 days before the trek.</p>
          </div>

          <div style="margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;width:40%;">Customer</td><td style="padding:8px 0;">${escapeHtml(booking.name)}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Email</td><td style="padding:8px 0;">${escapeHtml(booking.email)}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Phone</td><td style="padding:8px 0;">${escapeHtml(booking.phoneNumber)}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Type</td><td style="padding:8px 0;">${escapeHtml(itemType.charAt(0).toUpperCase() + itemType.slice(1))}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">City</td><td style="padding:8px 0;">${escapeHtml(booking.city)}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Members</td><td style="padding:8px 0;">${booking.membersCount}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Booked Batch</td><td style="padding:8px 0;">${escapeHtml(selectedDateWindow?.label || "Primary Schedule")}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Batch Dates</td><td style="padding:8px 0;">${formatEmailDate(selectedDateWindow?.startDate)} to ${formatEmailDate(selectedDateWindow?.endDate)}</td></tr>
              <tr><td style="padding:8px 0;color:#0f172a;font-weight:bold;">Pickup Location</td><td style="padding:8px 0;">${escapeHtml(pickupLocationSummary)}</td></tr>
            </table>
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">Highlights</h2>
            ${highlightsMarkup}
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">Itinerary</h2>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:640px;">
                <thead>
                  <tr style="background:#e0f2fe;color:#0f172a;">
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Day</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Title</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Description</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Meals</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Accommodation</th>
                  </tr>
                </thead>
                <tbody>
                  ${itineraryRows}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">Member Details</h2>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#e0f2fe;color:#0f172a;">
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">#</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Name</th>
                    <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #d7e6f4;">Mobile Number</th>
                  </tr>
                </thead>
                <tbody>
                  ${travelerRows}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">What to Carry</h2>
            ${carryMarkup}
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">Pickup Locations</h2>
            <ul style="margin:0;padding-left:18px;">${pickupMarkup}</ul>
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">City Pricing</h2>
            <ul style="margin:0;padding-left:18px;">${pricingMarkup}</ul>
          </div>

          <div style="margin-bottom:22px;">
            <h2 style="margin:0 0 10px;font-size:18px;color:#0369a1;">Member Discounts</h2>
            <ul style="margin:0;padding-left:18px;">${discountMarkup}</ul>
          </div>

          <div style="background:#f8fbfd;border:1px solid #d7e6f4;border-radius:12px;padding:16px 18px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#0369a1;">Important Notice</p>
            <p style="margin:0;line-height:1.6;">The advance amount is refundable only if the booking is cancelled at least 3 days before the trek date.</p>
          </div>
        </div>

        <div style="padding:18px 28px;border-top:1px solid #d7e6f4;background:#f8fbfd;color:#475569;font-size:12px;line-height:1.6;">
          <p style="margin:0 0 8px;font-weight:bold;color:#0369a1;">Follow us</p>
          <p style="margin:0 0 4px;"><a href="https://www.instagram.com/infinity_trekkers_india?igsh=eXUycXZiMGpsdGx0" style="color:#0369a1;">Instagram - Infinity Trekkers India</a></p>
          <p style="margin:0 0 4px;"><a href="https://www.instagram.com/channel/AbYQMOqZ85DGrOES/" style="color:#0369a1;">Instagram Channel Trek Trips Update</a></p>
          <p style="margin:12px 0 0;">Thank you for choosing Infinity Trekkers.</p>
        </div>
      </div>
    </div>
  `;
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
    const trek = await Trek.findById(trekId).select("name startDate endDate isActive dateWindows");
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
        .select("name phoneNumber membersCount city finalPrice paymentStatus paymentMode advancePaidAmount remainingAmount createdAt travelerDetails selectedDateWindow pickupLocation")
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
          dateWindows: trek.dateWindows || [],
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
        batchSummary: buildBatchSummary(bookings),
        bookings: bookings.map(booking => ({
          id: booking._id,
          name: booking.name,
          phone: booking.phoneNumber,
          city: booking.city,
          members: booking.membersCount,
          amount: booking.finalPrice,
          status: booking.paymentStatus,
          paymentMode: booking.paymentMode,
          advancePaidAmount: booking.advancePaidAmount,
          remainingAmount: booking.remainingAmount,
          bookedOn: booking.createdAt,
          travelerDetails: booking.travelerDetails || [],
          selectedDateWindow: booking.selectedDateWindow,
          pickupLocation: booking.pickupLocation,
          trek: booking.trek,
          tour: booking.tour
        }))
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch trek bookings");
  }
};

// ✅ Delete an individual booking
export const deleteBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }

    const booking = await UserBooking.findById(bookingId)
      .populate("trek", "name")
      .populate("tour", "name");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const item = booking.trek || booking.tour;
    const itemType = booking.trek ? "trek" : "tour";

    await UserBooking.findByIdAndDelete(bookingId);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      data: {
        bookingId: booking._id,
        itemId: item?._id,
        itemType,
        itemName: item?.name || "Unknown"
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to delete booking");
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
    const {
      name,
      email,
      phoneNumber,
      city,
      membersCount,
      trekId,
      tourId,
      bookingType = "trek",
      paymentMode = "cash",
      travelerDetails,
      selectedDateWindow,
      advancePaidAmount = 0,
    } = req.body;
    const totalMembers = Number(membersCount);
    const advanceAmount = Number(advancePaidAmount || 0);

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

    if (totalMembers < 1 || totalMembers > 20) {
      return res.status(400).json({
        success: false,
        message: "Members count must be between 1 and 20",
      });
    }

    if (advanceAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Advance amount cannot be negative",
      });
    }

    if (!Number.isFinite(advanceAmount)) {
      return res.status(400).json({
        success: false,
        message: "Advance amount must be a valid number",
      });
    }

    let normalizedTravelerDetails;
    try {
      normalizedTravelerDetails = normalizeOptionalTravelerDetails(travelerDetails, totalMembers);
    } catch (travelerError) {
      return res.status(400).json({
        success: false,
        message: travelerError.message,
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

    const chosenDateWindow = pickOfflineDateWindow(item, selectedDateWindow);
    if (!chosenDateWindow) {
      return res.status(400).json({
        success: false,
        message: `No date windows are available for this ${itemType}`,
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

    const pricingResult = calculateMemberDiscountedPrice(
      cityPriceObj.discountPrice > 0 ? cityPriceObj.discountPrice : cityPriceObj.price,
      totalMembers,
      item.memberDiscountRules || []
    );
    const finalPrice = pricingResult.finalPrice;
    const safeAdvanceAmount = Math.min(finalPrice, Math.max(0, advanceAmount));
    const remainingAmount = Math.max(0, finalPrice - safeAdvanceAmount);
    const paymentStatus = remainingAmount > 0 ? "pending" : "paid";

    if (finalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price calculation",
      });
    }

    // Create offline booking with "paid" status
    const matchingPickupLocation = item.pickupLocations?.find(
      (location) => location.city.toLowerCase() === city.toLowerCase()
    );

    if (!matchingPickupLocation) {
      return res.status(400).json({
        success: false,
        message: `No pickup location available for ${city}`,
        availablePickupLocations: item.pickupLocations || [],
      });
    }

    const bookingData = {
      name,
      email,
      phoneNumber,
      city,
      pickupLocation: matchingPickupLocation,
      membersCount: totalMembers,
      travelerDetails: normalizedTravelerDetails,
      finalPrice,
      selectedDateWindow: chosenDateWindow,
      advancePaidAmount: safeAdvanceAmount,
      remainingAmount,
      paymentMode: "cash",
      paymentStatus,
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
    const pickupLocationSummary = booking.pickupLocation
      ? `${booking.pickupLocation.location} (${booking.pickupLocation.pickupTime})${booking.pickupLocation.notes ? ` - ${booking.pickupLocation.notes}` : ""}`
      : "N/A";

    const bookingSnapshot = {
      name: booking.name,
      email: booking.email,
      phoneNumber: booking.phoneNumber,
      city: booking.city,
      membersCount: booking.membersCount,
      travelerDetails: booking.travelerDetails || [],
      finalPrice: booking.finalPrice,
      selectedDateWindow: booking.selectedDateWindow,
    };

    const emailHtml = buildOfflineBookingEmailHtml({
      item,
      itemType,
      booking: bookingSnapshot,
      pickupLocationSummary,
      remainingAmount,
      advancePaidAmount: safeAdvanceAmount,
      selectedDateWindow: chosenDateWindow,
    });

    // Send confirmation emails
    const userMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `🎟️ Booking Confirmed: ${item.name.replace(/<[^>]*>/g, '')}`,
      html: emailHtml,
      text: `Booking confirmed for ${item.name}. Details: ${booking.membersCount} members from ${booking.city}, pickup location ${pickupLocationSummary}, total ₹${booking.finalPrice}, advance ₹${safeAdvanceAmount}, remaining ₹${remainingAmount}`
    };

    // Admin notification email (simple version)
    const adminMailOptions = {
      from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `💰 Offline Booking: ${item.name} - ${booking.membersCount} pax (Cash)`,
      html: emailHtml,
      text: `New offline booking: ${booking.name} for ${item.name}, ${booking.membersCount} members, pickup location ${pickupLocationSummary}, total ₹${booking.finalPrice}, advance ₹${safeAdvanceAmount}, remaining ₹${remainingAmount}`
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
        advancePaidAmount: safeAdvanceAmount,
        remainingAmount,
        membersCount: booking.membersCount,
        city: booking.city,
        paymentMode: paymentMode || "cash",
        paymentStatus,
        selectedDateWindow: booking.selectedDateWindow,
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
    const tour = await Tour.findById(tourId).select("name startDate endDate isActive dateWindows");
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
        .select("name phoneNumber membersCount city finalPrice paymentStatus paymentMode advancePaidAmount remainingAmount createdAt travelerDetails selectedDateWindow pickupLocation")
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
          dateWindows: tour.dateWindows || [],
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
        batchSummary: buildBatchSummary(bookings),
        bookings: bookings.map(booking => ({
          id: booking._id,
          name: booking.name,
          phone: booking.phoneNumber,
          city: booking.city,
          members: booking.membersCount,
          amount: booking.finalPrice,
          status: booking.paymentStatus,
          paymentMode: booking.paymentMode,
          advancePaidAmount: booking.advancePaidAmount,
          remainingAmount: booking.remainingAmount,
          bookedOn: booking.createdAt,
          travelerDetails: booking.travelerDetails || [],
          selectedDateWindow: booking.selectedDateWindow,
          pickupLocation: booking.pickupLocation,
          trek: booking.trek,
          tour: booking.tour
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
      .select("name phoneNumber membersCount city finalPrice paymentStatus paymentMode advancePaidAmount remainingAmount createdAt trek tour travelerDetails selectedDateWindow pickupLocation")
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
            paymentMode: booking.paymentMode,
            advancePaidAmount: booking.advancePaidAmount,
            remainingAmount: booking.remainingAmount,
            bookedOn: booking.createdAt,
            itemType: itemType,
            itemName: item?.name || 'Unknown',
            itemDates: item ? `${new Date(item.startDate).toDateString()} - ${new Date(item.endDate).toDateString()}` : 'N/A',
            travelerDetails: booking.travelerDetails || [],
            selectedDateWindow: booking.selectedDateWindow,
            pickupLocation: booking.pickupLocation,
            trek: booking.trek,
            tour: booking.tour
          };
        })
      }
    });
  } catch (error) {
    handleError(res, error, "Failed to get all bookings");
  }
};

// ✅ Update a booking payment status
export const updateBookingPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body;

    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    if (!paymentStatus || !["pending", "paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const booking = await UserBooking.findById(bookingId)
      .populate("trek", "name startDate endDate")
      .populate("tour", "name startDate endDate");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const updatePayload = { paymentStatus };
    if (paymentStatus === "paid") {
      updatePayload.remainingAmount = 0;
      updatePayload.advancePaidAmount = booking.finalPrice;
      if (!booking.paymentMode) {
        updatePayload.paymentMode = booking.razorpayPaymentId?.startsWith("CASH_") ? "cash" : "online";
      }
    }

    const updatedBooking = await UserBooking.findByIdAndUpdate(bookingId, updatePayload, { new: true })
      .populate("trek", "name startDate endDate")
      .populate("tour", "name startDate endDate");

    return res.status(200).json({
      success: true,
      message: "Booking payment status updated successfully",
      data: {
        id: updatedBooking._id,
        status: updatedBooking.paymentStatus,
        paymentMode: updatedBooking.paymentMode,
        advancePaidAmount: updatedBooking.advancePaidAmount,
        remainingAmount: updatedBooking.remainingAmount,
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to update booking payment status");
  }
};

// ✅ Download a batch booking report as PDF
export const downloadBatchBookingsPdf = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { startDate, endDate, label, status = "all" } = req.query;

    if (!itemType || !["trek", "tour"].includes(itemType)) {
      return res.status(400).json({ success: false, message: "Invalid item type" });
    }

    if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid item ID format" });
    }

    const item = itemType === "trek"
      ? await Trek.findById(itemId).select("name startDate endDate")
      : await Tour.findById(itemId).select("name startDate endDate");

    if (!item) {
      return res.status(404).json({ success: false, message: `${itemType === "trek" ? "Trek" : "Tour"} not found` });
    }

    const selectedDateWindow = {
      label: String(label || "").trim(),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    if (!selectedDateWindow.startDate || !selectedDateWindow.endDate || Number.isNaN(selectedDateWindow.startDate.getTime()) || Number.isNaN(selectedDateWindow.endDate.getTime())) {
      return res.status(400).json({ success: false, message: "Valid batch startDate and endDate are required" });
    }

    const bookings = await getBookingsForBatch({ itemId, itemType, selectedDateWindow, status });

    const reportLabel = formatBatchLabel(selectedDateWindow);
    const pdfDoc = new PDFDocument({ size: "A4", margin: 36, bufferPages: true });

    pdfDoc.font("Helvetica-Bold").fontSize(20).fillColor("#0f172a").text(getItemLabel(item), { align: "center" });
    pdfDoc.moveDown(0.3);
    pdfDoc.font("Helvetica-Bold").fontSize(14).fillColor("#0369a1").text(`${reportLabel} Batch Report`, { align: "center" });
    pdfDoc.moveDown(0.2);
    pdfDoc.font("Helvetica").fontSize(10).fillColor("#475569").text(`Batch Dates: ${formatDateDDMMYYYY(selectedDateWindow.startDate)} to ${formatDateDDMMYYYY(selectedDateWindow.endDate)}`, { align: "center" });
    pdfDoc.moveDown(0.2);
    pdfDoc.font("Helvetica").fontSize(10).fillColor("#475569").text(`Total Bookings: ${bookings.length}`, { align: "center" });
    pdfDoc.moveDown(0.6);

    const rows = bookings.map((booking, index) => ({
      srNo: index + 1,
      customer: booking.name || "N/A",
      city: booking.city || "N/A",
      members: booking.membersCount || 0,
      paymentMethod: buildPaymentMethodLabel(booking),
      status: String(booking.paymentStatus || "N/A").toUpperCase(),
      givenAmount: formatMoney(booking.advancePaidAmount || 0),
      remainingAmount: formatMoney(booking.remainingAmount ?? Math.max((booking.finalPrice || 0) - Number(booking.advancePaidAmount || 0), 0)),
      totalAmount: formatMoney(booking.finalPrice || 0),
      phone: booking.phoneNumber || "N/A",
      pickup: booking.pickupLocation ? `${booking.pickupLocation.location} (${booking.pickupLocation.pickupTime})` : "N/A",
    }));

    writePdfRows(pdfDoc, rows, {
      y: pdfDoc.y + 10,
      pageBottom: 760,
      columns: [
        { key: "srNo", label: "#", width: 22 },
        { key: "customer", label: "Customer", width: 95 },
        { key: "phone", label: "Phone", width: 72 },
        { key: "city", label: "City", width: 68 },
        { key: "members", label: "Members", width: 42, align: "center" },
        { key: "paymentMethod", label: "Payment Method", width: 78 },
        { key: "status", label: "Status", width: 50, align: "center" },
        { key: "givenAmount", label: "Given", width: 58, align: "right" },
        { key: "remainingAmount", label: "Remaining", width: 60, align: "right" },
        { key: "totalAmount", label: "Total", width: 58, align: "right" },
        { key: "pickup", label: "Pickup", width: 128 },
      ],
    });

    if (bookings.length === 0) {
      pdfDoc.moveDown(1);
      pdfDoc.font("Helvetica").fontSize(11).fillColor("#475569").text("No bookings were found for this batch.", { align: "center" });
    }

    const footerY = Math.max(pdfDoc.y + 24, 780);
    pdfDoc.font("Helvetica-Bold").fontSize(11).fillColor("#0369a1").text(`Report generated for ${itemType === "trek" ? "Trek" : "Tour"}: ${item.name}`, 36, footerY, { align: "center", width: 523 });

    return sendPdfBuffer(res, pdfDoc, `${getItemLabel(item).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${reportLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-batch-report.pdf`);
  } catch (error) {
    handleError(res, error, "Failed to generate batch PDF report");
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
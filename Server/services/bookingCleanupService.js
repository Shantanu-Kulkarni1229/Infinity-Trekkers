import cron from "node-cron";
import Trek from "../models/Trek.js";
import UserBooking from "../models/UserBooking.js";

// Schedule: Runs every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("🧹 Booking cleanup job started...");

  try {
    const now = new Date();

    // Find completed treks
    const completedTreks = await Trek.find({ endDate: { $lt: now } });

    for (const trek of completedTreks) {
      const deletedBookings = await UserBooking.deleteMany({ trek: trek._id });
      if (deletedBookings.deletedCount > 0) {
        console.log(`✅ Deleted ${deletedBookings.deletedCount} bookings for trek: ${trek.name}`);
      }
    }

    console.log("✅ Booking cleanup job finished successfully.");
  } catch (error) {
    console.error("❌ Booking cleanup job failed:", error);
  }
});

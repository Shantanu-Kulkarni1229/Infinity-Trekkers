import Trek from "../models/Trek.js";

// Helper for errors
const handleError = (res, error, message = "Server Error") => {
  console.error(error);
  res.status(500).json({
    success: false,
    message,
  });
};

// ✅ 1) Get all active treks
export const getActiveTreks = async (req, res) => {
  try {
    const treks = await Trek.find({ isActive: true }).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: treks.length,
      data: treks,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch active treks");
  }
};

// ✅ 2) Get trek by ID
export const getTrekByIdForUser = async (req, res) => {
  try {
    const trek = await Trek.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!trek) {
      return res.status(404).json({
        success: false,
        message: "Trek not found or inactive",
      });
    }

    // Extract unique cities from cityPricing
    const departureCities = trek.cityPricing.map((cp) => cp.city);

    res.status(200).json({
      success: true,
      data: trek,
      departureCities, // 👈 Added here
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid trek ID",
      });
    }
    handleError(res, error, "Failed to fetch trek details");
  }
};


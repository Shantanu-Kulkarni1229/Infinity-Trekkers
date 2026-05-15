import Trek from "../models/Trek.js";
import {
  normalizeItinerary,
  normalizeDateWindows,
  normalizeThingsToCarry,
  normalizePickupLocations,
  parseJsonArrayField,
} from "../utils/bookingHelpers.js";

// Helper function for error handling
const handleError = (res, error, defaultMessage = "Server Error") => {
  console.error(error);

  // Handle Mongoose validation errors
  if (error.name === "ValidationError") {
    return res.status(400).json({ 
      success: false,
      message: "Validation Error",
      errors: error.errors 
    });
  }

  // Handle JSON parsing errors (invalid cityPricing input)
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in cityPricing",
    });
  }

  res.status(500).json({ 
    success: false,
    message: defaultMessage 
  });
};

// ✅ Add a new trek
export const addTrek = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      duration, 
      difficulty, 
      specialType,
      startDate, 
      endDate, 
      highlights,
      cityPricing,
      itinerary,
      thingsToCarry,
      pickupLocations,
      dateWindows
    } = req.body;

    if (!name || !description || !location || !duration || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, description, location, duration, difficulty)"
      });
    }

    // ✅ Parse and validate cityPricing (optional but at least one)
    let parsedCityPricing = [];
    if (cityPricing) {
      parsedCityPricing = parseJsonArrayField(cityPricing, []);

      const validCities = ["Chh. Sambhajinagar", "Pune", "Mumbai"];

      // Filter only valid cities (ignore others)
      parsedCityPricing = parsedCityPricing.filter(city => 
        validCities.includes(city.city)
      );

      // ✅ Ensure at least one city has confirmed pricing (trek must operate from somewhere)
      if (parsedCityPricing.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one city must have confirmed pricing for the trek to be available"
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide pricing for at least one departure city"
      });
    }

    // ✅ Only include cities that have confirmed prices (filter out empty prices)
    const sanitizedCityPricing = parsedCityPricing
      .filter(city => city.price !== undefined && city.price !== "" && city.price !== "0" && city.price > 0)
      .map(city => ({
        city: city.city,
        price: parseFloat(city.price),
        discountPrice: city.discountPrice !== undefined && city.discountPrice !== "" && city.discountPrice !== "0" ? parseFloat(city.discountPrice) : 0,
      }));

    // ✅ Final check: ensure at least one city has pricing after filtering
    if (sanitizedCityPricing.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one city must have a valid price greater than 0"
      });
    }

    const normalizedDateWindows = normalizeDateWindows(dateWindows, startDate, endDate);

    if (normalizedDateWindows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid date window",
      });
    }

    if (normalizedDateWindows.some((window) => window.startDate >= window.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Each start date must be before its end date"
      });
    }

    const thumbnail = req.file?.path;
    if (!thumbnail) {
      return res.status(400).json({ 
        success: false,
        message: "Thumbnail is required" 
      });
    }

    const newTrek = new Trek({
      name,
      thumbnail,
      description,
      location,
      duration,
      difficulty,
      specialType,
      startDate,
      endDate,
      dateWindows: normalizedDateWindows,
      highlights: parseJsonArrayField(highlights, []),
      itinerary: normalizeItinerary(itinerary),
      thingsToCarry: normalizeThingsToCarry(thingsToCarry),
      pickupLocations: normalizePickupLocations(pickupLocations),
      cityPricing: sanitizedCityPricing
    });

    await newTrek.save();
    
    res.status(201).json({ 
      success: true,
      message: "Trek added successfully", 
      data: newTrek 
    });
  } catch (error) {
    handleError(res, error, "Failed to add trek");
  }
};




// Get all treks
export const getTreks = async (req, res) => {
  try {
    const { city } = req.query;
    let treks = await Trek.find().sort({ createdAt: -1 });

    // Filter city pricing if query provided
    if (city) {
      treks = treks.map(trek => ({
        ...trek._doc,
        cityPricing: trek.cityPricing.filter(cp => cp.city === city)
      }));
    }

    res.status(200).json({ 
      success: true,
      count: treks.length,
      data: treks 
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch treks");
  }
};

// Get single trek by ID
export const getTrekById = async (req, res) => {
  try {
    const { city } = req.query;
    const trek = await Trek.findById(req.params.id);
    
    if (!trek) {
      return res.status(404).json({ 
        success: false,
        message: "Trek not found" 
      });
    }

    let trekData = trek._doc;
    if (city) {
      trekData = {
        ...trek._doc,
        cityPricing: trek.cityPricing.filter(cp => cp.city === city)
      };
    }
    
    res.status(200).json({ 
      success: true,
      data: trekData 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ 
        success: false,
        message: "Invalid trek ID format" 
      });
    }
    handleError(res, error, "Failed to fetch trek");
  }
};

// Update trek
export const updateTrek = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      duration, 
      difficulty, 
      specialType,
      startDate, 
      endDate, 
      highlights,
      cityPricing,
      itinerary,
      thingsToCarry,
      pickupLocations,
      dateWindows
    } = req.body;

    const updatedData = { 
      name, 
      description, 
      location, 
      duration, 
      difficulty, 
      specialType,
      startDate, 
      endDate, 
      highlights: parseJsonArrayField(highlights, [])
    };

    if (cityPricing) {
      updatedData.cityPricing = parseJsonArrayField(cityPricing, []);
    }

    if (itinerary) {
      updatedData.itinerary = normalizeItinerary(itinerary);
    }

    if (thingsToCarry) {
      updatedData.thingsToCarry = normalizeThingsToCarry(thingsToCarry);
    }

    if (pickupLocations) {
      updatedData.pickupLocations = normalizePickupLocations(pickupLocations);
    }

    if (dateWindows || (startDate && endDate)) {
      // If the client provided explicit dateWindows use them as-is.
      // Only fall back to using primary start/end when dateWindows is not provided
      // to avoid inserting a duplicate "Primary Schedule" window.
      const normalizedDateWindows = dateWindows
        ? normalizeDateWindows(dateWindows)
        : normalizeDateWindows(null, startDate, endDate);

      if (normalizedDateWindows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide at least one valid date window",
        });
      }

      if (normalizedDateWindows.some((window) => window.startDate >= window.endDate)) {
        return res.status(400).json({
          success: false,
          message: "Each start date must be before its end date",
        });
      }

      updatedData.dateWindows = normalizedDateWindows;
      updatedData.startDate = normalizedDateWindows[0].startDate;
      updatedData.endDate = normalizedDateWindows[normalizedDateWindows.length - 1].endDate;
    }

    if (req.file) {
      updatedData.thumbnail = req.file.path;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    const updatedTrek = await Trek.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedTrek) {
      return res.status(404).json({ 
        success: false,
        message: "Trek not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Trek updated successfully", 
      data: updatedTrek 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ 
        success: false,
        message: "Invalid trek ID format" 
      });
    }
    handleError(res, error, "Failed to update trek");
  }
};

// Delete trek
export const deleteTrek = async (req, res) => {
  try {
    const deletedTrek = await Trek.findByIdAndDelete(req.params.id);

    if (!deletedTrek) {
      return res.status(404).json({ 
        success: false,
        message: "Trek not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Trek deleted successfully",
      data: { id: req.params.id } 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ 
        success: false,
        message: "Invalid trek ID format" 
      });
    }
    handleError(res, error, "Failed to delete trek");
  }
};

// Toggle trek active/inactive
export const toggleTrekStatus = async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);

    if (!trek) {
      return res.status(404).json({ 
        success: false,
        message: "Trek not found" 
      });
    }

    trek.isActive = !trek.isActive;
    await trek.save();

    res.status(200).json({ 
      success: true,
      message: `Trek is now ${trek.isActive ? "Active" : "Inactive"}`, 
      data: trek 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ 
        success: false,
        message: "Invalid trek ID format" 
      });
    }
    handleError(res, error, "Failed to toggle trek status");
  }
};

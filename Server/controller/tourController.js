import Tour from "../models/Tour.js";

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

// ✅ Add a new tour
export const addTour = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      duration, 
      tourType,
      difficulty, 
      startDate, 
      endDate, 
      highlights,
      cityPricing,
      maxGroupSize,
      isFeatured
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
      parsedCityPricing = typeof cityPricing === "string" 
        ? JSON.parse(cityPricing) 
        : cityPricing;

      const validCities = ["Chh. Sambhajinagar", "Pune", "Mumbai"];

      // Filter only valid cities (ignore others)
      parsedCityPricing = parsedCityPricing.filter(city => 
        validCities.includes(city.city)
      );
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

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date"
      });
    }

    const thumbnail = req.file?.path;
    if (!thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required"
      });
    }

    const newTour = new Tour({
      name,
      thumbnail,
      description,
      location,
      duration,
      tourType: tourType || "Adventure",
      difficulty,
      startDate,
      endDate,
      highlights: highlights 
        ? highlights.split(",").map(h => h.trim()) 
        : [],
      cityPricing: sanitizedCityPricing,
      maxGroupSize: maxGroupSize || 20,
      isFeatured: isFeatured === 'true' || isFeatured === true || false
    });

    await newTour.save();
    
    res.status(201).json({ 
      success: true,
      message: "Tour added successfully", 
      data: newTour 
    });
  } catch (error) {
    handleError(res, error, "Failed to add tour");
  }
};

// Get all tours
export const getTours = async (req, res) => {
  try {
    const { city } = req.query;
    let tours = await Tour.find().sort({ createdAt: -1 });

    // Filter city pricing if query provided
    if (city) {
      tours = tours.map(tour => ({
        ...tour._doc,
        cityPricing: tour.cityPricing.filter(cp => cp.city === city)
      }));
    }

    res.status(200).json({ 
      success: true,
      count: tours.length,
      data: tours 
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch tours");
  }
};

// Get featured tours
export const getFeaturedTours = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const tours = await Tour.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({ 
      success: true,
      count: tours.length,
      data: tours 
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch featured tours");
  }
};

// Get single tour by ID
export const getTourById = async (req, res) => {
  try {
    const { city } = req.query;
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }

    let tourData = tour._doc;
    if (city) {
      tourData.cityPricing = tour.cityPricing.filter(cp => cp.city === city);
    }

    // Extract unique cities from cityPricing (only cities with confirmed prices)
    const departureCities = tour.cityPricing.map((cp) => cp.city);
    
    res.status(200).json({ 
      success: true,
      data: tourData,
      departureCities, // 👈 Added here
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }
    handleError(res, error, "Failed to fetch tour");
  }
};

// Update tour
export const updateTour = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      location, 
      duration, 
      difficulty, 
      startDate, 
      endDate, 
      highlights,
      cityPricing
    } = req.body;

    const updatedData = { 
      name, 
      description, 
      location, 
      duration, 
      difficulty, 
      startDate, 
      endDate, 
      highlights: highlights ? highlights.split(",").map(h => h.trim()) : [] 
    };

    if (cityPricing) {
      updatedData.cityPricing = typeof cityPricing === "string" ? JSON.parse(cityPricing) : cityPricing;
    }

    if (req.file) {
      updatedData.thumbnail = req.file.path;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date"
      });
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Tour updated successfully", 
      data: updatedTour 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }
    handleError(res, error, "Failed to update tour");
  }
};

// Delete tour
export const deleteTour = async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);

    if (!deletedTour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Tour deleted successfully",
      data: { id: req.params.id } 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }
    handleError(res, error, "Failed to delete tour");
  }
};

// Toggle tour active/inactive
export const toggleTourStatus = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }

    tour.isActive = !tour.isActive;
    await tour.save();

    res.status(200).json({ 
      success: true,
      message: `Tour is now ${tour.isActive ? "Active" : "Inactive"}`, 
      data: tour 
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ 
        success: false,
        message: "Tour not found" 
      });
    }
    handleError(res, error, "Failed to toggle tour status");
  }
};
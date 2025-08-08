import Trek from "../models/Trek.js";

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
      startDate, 
      endDate, 
      highlights,
      cityPricing
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

      // ✅ Ensure at least one valid city remains
      if (parsedCityPricing.length === 0) {
        return res.status(400).json({
          success: false,
          message: `At least one valid city (Chh. Sambhajinagar, Pune, Mumbai) must be provided`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one city with pricing info"
      });
    }

    // ✅ Sanitize pricing (allow missing/null price)
    const sanitizedCityPricing = parsedCityPricing.map(city => ({
      city: city.city,
      price: city.price !== undefined && city.price !== "" ? city.price : null,
    }));

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
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
      startDate,
      endDate,
      highlights: highlights 
        ? highlights.split(",").map(h => h.trim()) 
        : [],
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

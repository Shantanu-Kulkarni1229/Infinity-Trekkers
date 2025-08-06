import express from "express";


import { createEnquiry , getAllEnquiries ,updateEnquiryStatus  } from "../controller/userEnquiryController.js";
import { validateEnquiry , validateStatusUpdate ,  } from "../validator/enquiryValidators.js";

const router = express.Router();

// Public routes (no authentication required)
router.post(
  "/",
  validateEnquiry,
  createEnquiry
);

// Protected admin routes (require authentication and admin role)
router.get(
  "/",
  
 
  getAllEnquiries
);
router.put("/:id",  updateEnquiryStatus);


export default router;
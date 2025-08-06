import { body, param } from 'express-validator';

export const validateEnquiry = [
  body('destination')
    .trim()
    .notEmpty().withMessage('Destination is required')
    .isLength({ max: 100 }).withMessage('Destination cannot exceed 100 characters'),
    
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),
    
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
    
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    
  body('preferredDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate()
];

export const validateStatusUpdate = [
  param('id')
    .isMongoId().withMessage('Invalid enquiry ID'),
    
  body('status')
    .isIn(['new', 'contacted', 'followup', 'converted', 'rejected'])
    .withMessage('Invalid status value'),
    
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
];
import UserEnquiry from "../models/UserEnquiry.js";
import transporter from "../config/nodemailer.js";
import { validationResult } from 'express-validator';

// Create a new enquiry and send notifications
export const createEnquiry = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { 
      destination, 
      phoneNumber, 
      email, 
      name, 
      message, 
      preferredDate,
      serviceNeeded,
      groupSize,
      duration
    } = req.body;

    // Additional validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Save enquiry in DB with additional metadata
    const enquiry = new UserEnquiry({
      destination,
      phoneNumber,
      email: email || undefined, // Only store if provided
      name: name || undefined,
      message: message || undefined,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      serviceNeeded: serviceNeeded || undefined,
      groupSize: groupSize || undefined,
      duration: duration || undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await enquiry.save();

    // Prepare email templates
const adminMailOptions = {
  from: `"Infinity Trekkers Enquiries" <${process.env.EMAIL_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: `🌄 New ${serviceNeeded || 'Service'} Enquiry: ${destination.replace(/<[^>]*>/g, '')}`,
  html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@700&display=swap');
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 650px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            margin: 20px auto;
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            position: relative;
            z-index: 2;
        }
        .header:after {
            content: "";
            position: absolute;
            bottom: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        .header:before {
            content: "";
            position: absolute;
            top: -50px;
            left: -50px;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        .content {
            padding: 30px;
        }
        .destination-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 25px;
            text-align: center;
            position: relative;
        }
        .destination-title:after {
            content: "";
            display: block;
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            margin: 10px auto 0;
            border-radius: 2px;
        }
        .details-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border-radius: 12px;
            overflow: hidden;
        }
        .details-table th {
            text-align: left;
            padding: 12px 15px;
            background-color: #e2e8f0;
            font-weight: 600;
            color: #334155;
        }
        .details-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .details-table tr:last-child td {
            border-bottom: none;
        }
        .message-box {
            background-color: #f0fdf4;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 4px solid #10b981;
        }
        .message-box h3 {
            margin-top: 0;
            color: #065f46;
            font-size: 18px;
        }
        .message-box p {
            margin-bottom: 0;
            color: #064e3b;
        }
        .actions-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #bae6fd;
        }
        .actions-box h3 {
            margin-top: 0;
            color: #0369a1;
            font-size: 18px;
            margin-bottom: 20px;
        }
        .action-button {
            display: inline-block;
            padding: 12px 24px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            margin: 0 10px 10px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .call-button {
            background-color: #10b981;
            color: white !important;
        }
        .call-button:hover {
            background-color: #059669;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2);
        }
        .email-button {
            background-color: #3b82f6;
            color: white !important;
        }
        .email-button:hover {
            background-color: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.2);
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f1f5f9;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .urgency-badge {
            display: inline-block;
            background-color: #fef2f2;
            color: #dc2626;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 15px;
            border: 1px solid #fecaca;
        }
        .timestamp {
            color: #64748b;
            font-size: 14px;
            text-align: right;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>New ${serviceNeeded || 'Service'} Enquiry</h1>
        </div>
        
        <div class="content">
            <div class="urgency-badge">❗ Respond within 24 hours</div>
            
            <div class="destination-title">${destination}</div>
            
            <div class="timestamp">Received at ${new Date().toLocaleString()}</div>
            
            <table class="details-table">
                <tr>
                    <td style="width: 30%; font-weight: 600; color: #475569;">Name</td>
                    <td>${name || 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; color: #475569;">Phone</td>
                    <td>
                        <a href="tel:${phoneNumber}" style="color: #3b82f6; text-decoration: none;">
                            ${phoneNumber}
                        </a>
                    </td>
                </tr>
                ${email ? `<tr>
                    <td style="font-weight: 600; color: #475569;">Email</td>
                    <td>
                        <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">
                            ${email}
                        </a>
                    </td>
                </tr>` : ''}
                ${serviceNeeded ? `<tr>
                    <td style="font-weight: 600; color: #475569;">Service Needed</td>
                    <td><span style="background-color: #e0f2fe; color: #0277bd; padding: 4px 8px; border-radius: 12px; font-weight: 500;">${serviceNeeded}</span></td>
                </tr>` : ''}
                ${groupSize ? `<tr>
                    <td style="font-weight: 600; color: #475569;">Group Size</td>
                    <td><strong>${groupSize}</strong> ${groupSize === 1 ? 'person' : 'people'}</td>
                </tr>` : ''}
                ${duration ? `<tr>
                    <td style="font-weight: 600; color: #475569;">Duration</td>
                    <td>${duration}</td>
                </tr>` : ''}
                ${preferredDate ? `<tr>
                    <td style="font-weight: 600; color: #475569;">Preferred Date</td>
                    <td>${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                </tr>` : ''}
            </table>
            
            ${message ? `<div class="message-box">
                <h3>Customer Message</h3>
                <p>${message}</p>
            </div>` : ''}
            
            <div class="actions-box">
                <h3>Quick Actions</h3>
                <a href="tel:${phoneNumber}" class="action-button call-button">📞 Call Customer</a>
                ${email ? `<a href="mailto:${email}" class="action-button email-button">✉️ Email Customer</a>` : ''}
            </div>
        </div>
        
        <div class="footer">
            <p>This enquiry was submitted via the Infinity Trekkers website</p>
            <p style="margin-top: 5px;">
                <a href="https://infinitytrekkersindia.com/admin" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                    View in Admin Dashboard
                </a>
            </p>
        </div>
    </div>
</body>
</html>
`
};

    // Send notifications in parallel
    const [adminEmailResult] = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      // Future: Add SMS notification here
    ]);

    // Prepare response
    const response = {
      success: true,
      message: "Enquiry submitted successfully",
      data: {
        enquiry,
        notifications: {
          adminEmail: adminEmailResult.status === 'fulfilled' ? 'sent' : 'failed'
        }
      }
    };

    // If email was provided, send acknowledgement
    if (email) {
      try {
       await transporter.sendMail({
  from: `"Infinity Trekkers" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: `🌄 We've received your ${serviceNeeded ? serviceNeeded.toLowerCase() : 'service'} enquiry!`,
  html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@700&display=swap');
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            margin: 20px auto;
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
            position: relative;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
        }
        .mountain-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            display: block;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .summary-box {
            background-color: #f0fdf4;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 4px solid #10b981;
        }
        .summary-title {
            font-size: 20px;
            font-weight: 600;
            color: #065f46;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .detail-item {
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #475569;
            display: inline-block;
            width: 120px;
        }
        .support-note {
            background-color: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
        }
        .support-phone {
            font-weight: 700;
            color: #1e40af;
            text-decoration: none;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f1f5f9;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .social-links {
            margin-top: 15px;
        }
        .social-links a {
            margin: 0 10px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <svg class="mountain-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 3L2 21h20L12 3zm0 4.5l5.5 9.5H6.5L12 7.5z"/>
            </svg>
            <h1>Thank You for Your Enquiry!</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Dear ${name || 'Adventure Seeker'},</p>
            
            <p>We're excited you're considering <strong>${destination}</strong> for your next ${serviceNeeded ? serviceNeeded.toLowerCase() : 'adventure'}! Our team is reviewing your enquiry and will get back to you shortly.</p>
            
            <div class="summary-box">
                <h3 class="summary-title">Your Enquiry Details</h3>
                <div class="detail-item">
                    <span class="detail-label">Destination:</span>
                    <strong>${destination}</strong>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <a href="tel:${phoneNumber}" style="color: #3b82f6; text-decoration: none;">${phoneNumber}</a>
                </div>
                ${email ? `<div class="detail-item">
                    <span class="detail-label">Email:</span>
                    ${email}
                </div>` : ''}
                ${serviceNeeded ? `<div class="detail-item">
                    <span class="detail-label">Service Needed:</span>
                    <strong style="color: #059669;">${serviceNeeded}</strong>
                </div>` : ''}
                ${groupSize ? `<div class="detail-item">
                    <span class="detail-label">Group Size:</span>
                    <strong>${groupSize}</strong> ${groupSize === 1 ? 'person' : 'people'}
                </div>` : ''}
                ${duration ? `<div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    ${duration}
                </div>` : ''}
                ${preferredDate ? `<div class="detail-item">
                    <span class="detail-label">Preferred Date:</span>
                    ${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>` : ''}
            </div>
            
            <div class="support-note">
                <p>For urgent enquiries, please call our support team at<br>
                <a href="tel:${process.env.SUPPORT_PHONE}" class="support-phone">${process.env.SUPPORT_PHONE}</a></p>
            </div>
            
            <p>We can't wait to help you plan your perfect ${serviceNeeded ? serviceNeeded.toLowerCase() : 'adventure'} experience!</p>
            
            <p>Best regards,<br>
            <strong>The Infinity Trekkers Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Connect with us for more adventures:</p>
            <div class="social-links">
                <a href="https://instagram.com/infinitytrekkers" style="color: #3b82f6;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#3b82f6"/>
                        <path d="M17 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5Z" stroke="#3b82f6" stroke-width="2"/>
                        <path d="M17.5 7.5H17.51" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </a>
                <a href="https://facebook.com/infinitytrekkers" style="color: #3b82f6;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" fill="#3b82f6"/>
                    </svg>
                </a>
                <a href="https://wa.me/${process.env.SUPPORT_PHONE}" style="color: #3b82f6;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382C17.231 14.382 17.024 14.491 16.886 14.683L15.428 16.641C14.308 15.834 13.345 14.948 12.587 14.002C11.627 12.811 10.997 11.663 10.587 10.547L12.176 9.084C12.4 8.862 12.472 8.582 12.415 8.314C12.358 8.046 12.166 7.834 11.908 7.738C10.675 7.28 9.757 6.493 9.155 5.377C8.96 4.988 8.559 4.8 8.144 4.8H5.962C5.521 4.8 5.073 5.002 4.914 5.41C4.511 6.496 4.311 7.661 4.311 8.848C4.311 15.614 8.677 20.689 14.703 20.689C15.911 20.689 17.086 20.477 18.177 20.066C18.583 19.904 18.782 19.466 18.782 19.038V16.856C18.782 16.441 18.592 16.04 18.203 15.845C17.967 15.728 17.719 15.618 17.472 15.618V14.382H17.472Z" fill="#3b82f6"/>
                        <path d="M14.703 2C7.826 2 2.311 7.516 2.311 14.392C2.311 16.524 2.859 18.544 3.827 20.329C3.94 20.542 4.17 20.689 4.425 20.689H7.311V19.038C7.311 18.1 7.769 17.253 8.514 16.79C10.232 15.683 11.428 13.916 11.428 11.967V10.547C11.428 9.609 11.886 8.762 12.631 8.299C13.376 7.836 14.311 7.836 15.056 8.299L16.886 9.609C17.631 10.072 18.311 10.072 19.056 9.609L21.647 7.836C22.392 7.373 22.782 6.526 22.589 5.623C21.374 3.096 18.768 2 14.703 2Z" fill="#3b82f6" fill-opacity="0.2"/>
                    </svg>
                </a>
            </div>
            <p style="margin-top: 20px;"><a href="https://infinitytrekkers.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Visit our website</a></p>
        </div>
    </div>
</body>
</html>
`
});
        response.data.notifications.customerEmail = 'sent';
      } catch (emailError) {
        console.error('Failed to send customer acknowledgement:', emailError);
        response.data.notifications.customerEmail = 'failed';
      }
    }

    res.status(201).json(response);

  } catch (error) {
    console.error("Enquiry creation failed:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fetch all enquiries with pagination and filtering
export const getAllEnquiries = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.destination) {
      filter.destination = { $regex: req.query.destination, $options: 'i' };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      const sortFields = req.query.sortBy.split(',');
      sortFields.forEach(field => {
        const [key, value] = field.split(':');
        sort[key] = value === 'desc' ? -1 : 1;
      });
    } else {
      sort.createdAt = -1; // Default sort by newest first
    }

    // Get enquiries with pagination
    const [enquiries, total] = await Promise.all([
      UserEnquiry.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserEnquiry.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        enquiries,
        meta: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error("Fetching enquiries failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update enquiry status (for admin)
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID format"
      });
    }

    const validStatuses = ['new', 'contacted', 'followup', 'converted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedEnquiry = await UserEnquiry.findByIdAndUpdate(
      id,
      {
        status,
        adminNotes,
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: req.user?.id || 'system'
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry status updated",
      data: updatedEnquiry
    });

  } catch (error) {
    console.error("Updating enquiry failed:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update enquiry",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
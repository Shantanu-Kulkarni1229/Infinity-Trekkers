import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EnquiryForm: React.FC = () => {
  const [formData, setFormData] = useState({
    destination: "",
    phoneNumber: "",
    email: "",
    name: "",
    message: "",
    preferredDate: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/enquiries`, formData);
      toast.success(res.data.message || "Enquiry submitted successfully!");
      setFormData({
        destination: "",
        phoneNumber: "",
        email: "",
        name: "",
        message: "",
        preferredDate: "",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to submit enquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 via-white to-sky-100 flex items-center justify-center p-4 sm:p-6">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-sky-200 rounded-full -mt-16 sm:-mt-20 -mr-16 sm:-mr-20 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-sky-300 rounded-full -mb-12 sm:-mb-16 -ml-12 sm:-ml-16 opacity-20"></div>

        <h2 className="text-3xl sm:text-4xl font-bold text-center text-sky-700 mb-4 sm:mb-6">
          Trek Enquiry Form
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base">
          Fill out the form and our team will get in touch with you soon.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Destination */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Destination *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
              placeholder="Enter trek destination"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
              placeholder="Your name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
              placeholder="Enter your email (optional)"
            />
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Preferred Date
            </label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none text-sm sm:text-base"
              placeholder="Write your message here..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-sky-600 to-sky-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Enquiry"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnquiryForm;
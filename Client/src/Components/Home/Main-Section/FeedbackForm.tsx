import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Trek {
  _id: string;
  name: string;
}

interface FeedbackFormState {
  name: string;
  trekId: string;
  date: string;
  feedback: string;
  starRating: number;
  photoFile: File | null;
  photoPreview: string;
}

const FeedbackForm: React.FC = () => {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loadingTreks, setLoadingTreks] = useState<boolean>(true);
  const [formData, setFormData] = useState<FeedbackFormState>({
    name: "",
    trekId: "",
    date: "",
    feedback: "",
    starRating: 0,
    photoFile: null,
    photoPreview: "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTreks = async () => {
      try {
        const res = await axios.get<{ data: Trek[] }>(
          `${import.meta.env.VITE_API_BASE_URL}/api/treks`
        );
        setTreks(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch treks", err);
        toast.error("Failed to load treks. Please try again later.");
      } finally {
        setLoadingTreks(false);
      }
    };
    fetchTreks();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview and store file
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: reader.result as string,
      }));
    };
    reader.onerror = () => {
      toast.error("Failed to read the image file");
    };
    reader.readAsDataURL(file);
  };

  const handleStarClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, starRating: rating }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("trekId", formData.trekId);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("feedback", formData.feedback);
      formDataToSend.append("starRating", formData.starRating.toString());

      if (formData.photoFile) {
        formDataToSend.append("photo", formData.photoFile);
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/feedback/create`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(res.data.message || "Feedback submitted successfully!");
      setFormData({
        name: "",
        trekId: "",
        date: "",
        feedback: "",
        starRating: 0,
        photoFile: null,
        photoPreview: "",
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to submit feedback");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-100 to-blue-100 px-4 py-8">
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

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-green-600 mb-6">
          📝 Share Your Trek Experience
        </h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none text-sm sm:text-base"
            required
          />
        </div>

        {/* Trek Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Trek *
          </label>
          <select
            name="trekId"
            value={formData.trekId}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none text-sm sm:text-base"
            required
            disabled={loadingTreks}
          >
            <option value="">
              {loadingTreks ? "Loading treks..." : "Select a trek"}
            </option>
            {treks.map((trek) => (
              <option key={trek._id} value={trek._id}>
                {trek.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trek Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none text-sm sm:text-base"
            required
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Feedback */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Experience *
          </label>
          <textarea
            name="feedback"
            placeholder="Share your trekking experience..."
            value={formData.feedback}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none text-sm sm:text-base"
            required
            minLength={10}
          />
        </div>

        {/* Star Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Rating *
          </label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                onClick={() => handleStarClick(star)}
                className={`cursor-pointer text-2xl sm:text-3xl ${
                  formData.starRating >= star
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-1">
            Click to rate your experience
          </p>
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Photo (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-xs sm:text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:font-medium
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />
          {formData.photoPreview && (
            <div className="mt-2 flex justify-center">
              <img
                src={formData.photoPreview}
                alt="Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition duration-300 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            "Submit Feedback"
          )}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
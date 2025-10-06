import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Item {
  _id: string;
  name: string;
  cityPricing: {
    city: string;
    price: number;
    discountPrice: number;
  }[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface OfflineBookingForm {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  membersCount: number;
  trekId: string;
  tourId: string;
  bookingType: "trek" | "tour";
}

const OfflineBooking: React.FC = () => {
  const [treks, setTreks] = useState<Item[]>([]);
  const [tours, setTours] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<OfflineBookingForm>({
    name: "",
    email: "",
    phoneNumber: "",
    city: "",
    membersCount: 1,
    trekId: "",
    tourId: "",
    bookingType: "trek",
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Fetch active items
  useEffect(() => {
    fetchTreks();
    fetchTours();
  }, []);

  // Calculate price when item or members change
  useEffect(() => {
    if (selectedItem && formData.city && formData.membersCount) {
      const cityPricing = selectedItem.cityPricing.find(
        (cp: { city: string; price: number; discountPrice: number; }) => cp.city.toLowerCase() === formData.city.toLowerCase()
      );
      if (cityPricing) {
        const pricePerMember = cityPricing.discountPrice > 0 
          ? cityPricing.discountPrice 
          : cityPricing.price;
        setCalculatedPrice(pricePerMember * formData.membersCount);
      }
    }
  }, [selectedItem, formData.city, formData.membersCount]);

  const fetchTreks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/treks/`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only active treks
        const activetreks = data.data.filter((trek: Item) => trek.isActive);
        setTreks(activetreks);
      } else {
        toast.error("Failed to fetch treks");
      }
    } catch (error) {
      console.error("Error fetching treks:", error);
      toast.error("Error fetching treks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTours = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tours/`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only active tours
        const activetours = data.data.filter((tour: Item) => tour.isActive);
        setTours(activetours);
      } else {
        toast.error("Failed to fetch tours");
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Error fetching tours");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "bookingType") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as "trek" | "tour", 
        trekId: "", 
        tourId: "", 
        city: "" 
      }));
      setSelectedItem(null);
    } else if (name === "trekId") {
      const trek = treks.find(t => t._id === value);
      setSelectedItem(trek || null);
      setFormData(prev => ({ ...prev, [name]: value, tourId: "", city: "" })); // Reset city when trek changes
    } else if (name === "tourId") {
      const tour = tours.find(t => t._id === value);
      setSelectedItem(tour || null);
      setFormData(prev => ({ ...prev, [name]: value, trekId: "", city: "" })); // Reset city when tour changes
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }
    
    if (formData.bookingType === "trek" && !formData.trekId) {
      toast.error("Please select a trek");
      return false;
    }
    
    if (formData.bookingType === "tour" && !formData.tourId) {
      toast.error("Please select a tour");
      return false;
    }
    
    if (!formData.city) {
      toast.error("Please select a city");
      return false;
    }
    
    if (formData.membersCount < 1 || formData.membersCount > 20) {
      toast.error("Members count must be between 1 and 20");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offline-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("adminKey") || "",
        },
        body: JSON.stringify({
          ...formData,
          ...(formData.bookingType === "trek" && { trekId: formData.trekId }),
          ...(formData.bookingType === "tour" && { tourId: formData.tourId })
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Offline booking created successfully! Customer: ${data.data.customerName} - ₹${data.data.amount}`, {
          position: "top-center",
          autoClose: 5000,
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          city: "",
          membersCount: 1,
          trekId: "",
          tourId: "",
          bookingType: "trek",
        });
        setSelectedItem(null);
        setCalculatedPrice(0);
      } else {
        toast.error(data.message || "Failed to create booking", {
          position: "top-center",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("Error creating offline booking:", error);
      toast.error("Network error: Unable to create booking. Please try again.", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Add Offline Booking (Cash Payment)
          </h1>
          <p className="text-orange-100 mt-2">
            Add bookings for customers who paid in cash
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter customer's full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="customer@example.com"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="9876543210"
                pattern="[0-9]{10}"
                required
              />
            </div>

            {/* Members Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Members *
              </label>
              <input
                type="number"
                name="membersCount"
                value={formData.membersCount}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Booking Type Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Booking Type *
              </label>
              <select
                name="bookingType"
                value={formData.bookingType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                required
              >
                <option value="trek">🏔️ Trek</option>
                <option value="tour">🚌 Tour</option>
              </select>
            </div>

            {/* Trek/Tour Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select {formData.bookingType === "trek" ? "Trek" : "Tour"} *
              </label>
              {formData.bookingType === "trek" ? (
                <select
                  name="trekId"
                  value={formData.trekId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Choose a trek...</option>
                  {treks.map((trek) => (
                    <option key={trek._id} value={trek._id}>
                      {trek.name} ({new Date(trek.startDate).toLocaleDateString()} - {new Date(trek.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  name="tourId"
                  value={formData.tourId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Choose a tour...</option>
                  {tours.map((tour) => (
                    <option key={tour._id} value={tour._id}>
                      {tour.name} ({new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* City Selection */}
            {selectedItem && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departure City *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Choose departure city...</option>
                  {selectedItem.cityPricing.map((cp: { city: string; price: number; discountPrice: number; }) => (
                    <option key={cp.city} value={cp.city}>
                      {cp.city} - ₹{cp.discountPrice > 0 ? cp.discountPrice : cp.price} per person
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Price Calculation */}
          {calculatedPrice > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">
                  Total Amount (Cash):
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  ₹{calculatedPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {formData.membersCount} member(s) × ₹{(calculatedPrice / formData.membersCount).toLocaleString()} = ₹{calculatedPrice.toLocaleString()}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting || calculatedPrice === 0}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                submitting || calculatedPrice === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:scale-105"
              } text-white`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Booking...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Offline Booking
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use this form to add bookings for customers who paid in cash</li>
          <li>• Customer will receive the same confirmation email as online bookings</li>
          <li>• Admin will receive a notification about the offline booking</li>
          <li>• The booking will be marked as "paid" and appear in regular booking reports</li>
        </ul>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default OfflineBooking;
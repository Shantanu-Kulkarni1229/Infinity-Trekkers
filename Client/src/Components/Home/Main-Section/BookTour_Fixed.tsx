import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { MapPin, Clock, Users, Star, ChevronDown, ChevronUp, User } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

// Razorpay types
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface Tour {
  _id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  tourType: string;
  highlights: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  thumbnail: string;
  images: string[];
  cityPricing: CityPricing[];
  maxGroupSize: number;
  rating: number;
  totalBookings: number;
  cancellationPolicy: string;
  bestTimeToVisit: string;
}

interface CityPricing {
  city: string;
  price: number;
  discountPrice?: number;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  members: number;
}

const BookTour: React.FC = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [bookingProcessing, setBookingProcessing] = useState<boolean>(false);
  
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState<boolean>(false);
  const [isItineraryExpanded, setIsItineraryExpanded] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    city: "",
    members: 1,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Helper function to remove HTML tags
  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Helper function to check if text needs "Read More"
  const shouldShowReadMore = (text: string, limit: number = 150): boolean => {
    return text.length > limit;
  };

  // Helper function to truncate text
  const truncateText = (text: string, limit: number = 150): string => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!tourId) return;
    const fetchTour = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tours/${tourId}`);
        const data = await res.json();
        if (data.success) {
          setTour(data.data.tour);
          setDepartureCities(data.data.departureCities || []);
          toast.success("Tour details loaded successfully!");
        } else {
          throw new Error(data.message || "Failed to fetch tour");
        }
      } catch (err) {
        console.error("Error fetching tour details:", err);
        setError("Failed to load tour details. Please try again.");
        toast.error("Failed to load tour details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [tourId, API_BASE]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tour) return;
    
    const selectedCityPricing = tour.cityPricing.find(cp => cp.city === formData.city);
    if (!selectedCityPricing) {
      toast.error("Please select a valid city");
      return;
    }

    const finalPrice = (selectedCityPricing.discountPrice || selectedCityPricing.price) * formData.members;
    
    setBookingProcessing(true);
    
    try {
      const bookingData = {
        tourId: tour._id,
        tourName: tour.name,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        departureCity: formData.city,
        members: formData.members,
        totalAmount: finalPrice,
        bookingType: "tour"
      };

      const response = await fetch(`${API_BASE}/api/universal-bookings/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        // Initialize Razorpay
        const options: RazorpayOptions = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
          amount: finalPrice * 100,
          currency: "INR",
          name: "Infinity Trekkers",
          description: `Tour Booking - ${tour.name}`,
          order_id: data.data.razorpayOrderId,
          handler: async (response: RazorpayResponse) => {
            try {
              const verifyResponse = await fetch(`${API_BASE}/api/universal-bookings/verify-payment`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookingId: data.data.bookingId
                }),
              });

              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast.success("Payment successful! Booking confirmed.");
                navigate("/");
              } else {
                toast.error("Payment verification failed. Please contact support.");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#0ea5e9",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error(data.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setBookingProcessing(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Adventure": "border-orange-300 bg-orange-50 text-orange-700",
      "Cultural": "border-purple-300 bg-purple-50 text-purple-700", 
      "Wildlife": "border-green-300 bg-green-50 text-green-700",
      "Spiritual": "border-blue-300 bg-blue-50 text-blue-700",
      "Beach": "border-cyan-300 bg-cyan-50 text-cyan-700"
    };
    return colors[type] || "border-gray-300 bg-gray-50 text-gray-700";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      "Easy": "border-green-300 bg-green-50 text-green-700",
      "Moderate": "border-yellow-300 bg-yellow-50 text-yellow-700",
      "Challenging": "border-orange-300 bg-orange-50 text-orange-700",
      "Difficult": "border-red-300 bg-red-50 text-red-700"
    };
    return colors[difficulty] || "border-gray-300 bg-gray-50 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tour Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/upcoming-tours")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Tours
          </button>
        </div>
      </div>
    );
  }

  const selectedCityPricing = tour.cityPricing.find(cp => cp.city === formData.city);
  const finalPrice = selectedCityPricing ? ((selectedCityPricing.discountPrice || selectedCityPricing.price) * formData.members) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Tour Header */}
          <div className="relative">
            <img
              src={tour.thumbnail || "/api/placeholder/1200/400"}
              alt={tour.name}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <div className="flex gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(tour.tourType)}`}>
                    {tour.tourType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{tour.name}</h1>
                <div className="flex items-center gap-6 text-lg">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {tour.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    {tour.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Max {tour.maxGroupSize}
                  </div>
                  {tour.rating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-400" />
                      {tour.rating}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Tour Details */}
            <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">About This Tour</h3>
                <div className="text-gray-700">
                  {shouldShowReadMore(stripHtmlTags(tour.description)) ? (
                    <>
                      {isDescriptionExpanded ? stripHtmlTags(tour.description) : truncateText(stripHtmlTags(tour.description))}
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none"
                      >
                        {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                      </button>
                    </>
                  ) : (
                    stripHtmlTags(tour.description)
                  )}
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Highlights</h3>
                <div className="text-gray-700">
                  {shouldShowReadMore(stripHtmlTags(tour.highlights)) ? (
                    <>
                      {isHighlightsExpanded ? stripHtmlTags(tour.highlights) : truncateText(stripHtmlTags(tour.highlights))}
                      <button
                        onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none"
                      >
                        {isHighlightsExpanded ? 'Read Less' : 'Read More'}
                      </button>
                    </>
                  ) : (
                    stripHtmlTags(tour.highlights)
                  )}
                </div>
              </div>

              {/* Inclusions/Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tour.inclusions && tour.inclusions.length > 0 && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-green-800">Inclusions</h3>
                    <ul className="space-y-2">
                      {tour.inclusions.map((inclusion, index) => (
                        <li key={index} className="flex items-start text-green-700">
                          <span className="text-green-500 mr-2 mt-1">✓</span>
                          {inclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tour.exclusions && tour.exclusions.length > 0 && (
                  <div className="bg-red-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-red-800">Exclusions</h3>
                    <ul className="space-y-2">
                      {tour.exclusions.map((exclusion, index) => (
                        <li key={index} className="flex items-start text-red-700">
                          <span className="text-red-500 mr-2 mt-1">✗</span>
                          {exclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Itinerary */}
              {tour.itinerary && tour.itinerary.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Itinerary</h3>
                    <button
                      onClick={() => setIsItineraryExpanded(!isItineraryExpanded)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      {isItineraryExpanded ? 'Hide' : 'Show'} Details
                      {isItineraryExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                  </div>
                  {isItineraryExpanded && (
                    <div className="space-y-4">
                      {tour.itinerary.map((day, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-semibold text-gray-800">Day {day.day}: {day.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{day.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 sticky top-4 lg:top-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -translate-y-12 -translate-x-12 sm:-translate-y-16 sm:-translate-x-16"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Booking Form</h2>
                  </div>

                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-l-4 border-blue-500">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                      ₹{finalPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total amount (including GST)
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Name Input */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <div className="relative">
                        <input
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Phone Input */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <input
                          name="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* City Selection */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Departure City</label>
                      <div className="relative">
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-sm sm:text-base appearance-none bg-white"
                        >
                          <option value="">Select departure city</option>
                          {departureCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Members Count Input */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Members</label>
                      <div className="relative">
                        <input
                          name="members"
                          type="number"
                          min="1"
                          max={tour.maxGroupSize}
                          placeholder="Enter number of members"
                          value={formData.members}
                          onChange={handleChange}
                          required
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                        />
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </div>

                    {/* Pricing Display */}
                    {formData.city && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Pricing Details:</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Price per person:</span>
                            <span className="font-medium">
                              {selectedCityPricing?.discountPrice ? (
                                <>
                                  <span className="line-through text-gray-400 mr-2">₹{selectedCityPricing.price}</span>
                                  <span className="text-green-600">₹{selectedCityPricing.discountPrice}</span>
                                </>
                              ) : (
                                `₹${selectedCityPricing?.price || 0}`
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Members:</span>
                            <span className="font-medium">{formData.members}</span>
                          </div>
                          <div className="flex justify-between items-center text-base font-bold border-t border-gray-200 pt-2">
                            <span>Total Amount:</span>
                            <span className="text-blue-600">₹{finalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={bookingProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                      {bookingProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Book Now & Pay Securely
                        </div>
                      )}
                    </button>
                    
                    <div className="text-xs text-gray-500 text-center space-y-1">
                      <p>🔒 Secure payment gateway</p>
                      <p>💯 100% safe & trusted booking</p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookTour;
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import DOMPurify from "dompurify";
import { BadgeCheck, CalendarDays, Clock, MapPin, Route, Sparkles, Star, Users, ChevronDown, ChevronUp, User } from "lucide-react";
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
  highlights: string | string[];
  inclusions: string[];
  exclusions: string[];
  startDate?: string;
  endDate?: string;
  dateWindows?: Array<{
    label?: string;
    startDate: string;
    endDate: string;
  }>;
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    meals?: string;
    accommodation?: string;
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
  phoneNumber: string;
  city: string;
  membersCount: number;
}

interface DateWindow {
  label?: string;
  startDate: string;
  endDate: string;
}

interface TravelerDetail {
  name: string;
  phoneNumber: string;
}

const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const BookTour = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingProcessing, setBookingProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState<boolean>(false);
  const [availableDateWindows, setAvailableDateWindows] = useState<DateWindow[]>([]);
  const [selectedDateWindowIndex, setSelectedDateWindowIndex] = useState<string>("");
  const [travelerDetails, setTravelerDetails] = useState<TravelerDetail[]>([
    { name: "", phoneNumber: "" },
  ]);

  const navigate = useNavigate();

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    };

    if (!window.Razorpay) {
      loadRazorpayScript();
    }
  }, []);

  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    city: "",
    membersCount: 1
  });

  // Fetch tour details
  useEffect(() => {
    const fetchTourDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tours/${tourId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.success) {
          const tourData = data.data as Tour;
          
          if (!tourData) {
            setError("Tour data not found");
            toast.error("Tour data not found");
            return;
          }
          
          setTour(tourData);

          const fallbackWindows = tourData.dateWindows && tourData.dateWindows.length > 0
            ? tourData.dateWindows
            : [{ label: "Primary Schedule", startDate: tourData.startDate, endDate: tourData.endDate } as DateWindow];

          const todayStart = getStartOfToday();
          const futureWindows = fallbackWindows.filter((window) => new Date(window.endDate) >= todayStart);
          setAvailableDateWindows(futureWindows);
          setSelectedDateWindowIndex(futureWindows.length > 0 ? "0" : "");

          if (futureWindows.length === 0) {
            setError("No future booking dates are available for this tour.");
          } else {
            setError("");
          }
          
          const cities = tourData.cityPricing ? 
            [...new Set(tourData.cityPricing.map(cp => cp.city))] : [];
          setDepartureCities(cities);
          
          if (tourData.cityPricing && tourData.cityPricing.length > 0) {
            const firstCity = tourData.cityPricing[0];
            setFinalPrice(firstCity.discountPrice || firstCity.price);
          }
        } else {
          setError("Tour not found");
          toast.error("Tour not found");
        }
      } catch (error) {
        console.error("Error fetching tour:", error);
        setError("Failed to load tour details");
        toast.error("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      fetchTourDetails();
    }
  }, [tourId]);

  // Calculate price when departure city or members count changes
  useEffect(() => {
    if (tour && formData.city) {
      const cityPricing = tour.cityPricing?.find(cp => cp.city === formData.city);
      if (cityPricing) {
        const pricePerPerson = cityPricing.discountPrice || cityPricing.price;
        const baseAmount = pricePerPerson * formData.membersCount;
        setFinalPrice(baseAmount);
      }
    }
  }, [formData.city, formData.membersCount, tour]);

  useEffect(() => {
    setTravelerDetails((prev) => {
      const nextCount = Math.max(1, Number(formData.membersCount) || 1);
      if (prev.length === nextCount) return prev;
      if (prev.length > nextCount) return prev.slice(0, nextCount);
      return [
        ...prev,
        ...Array.from({ length: nextCount - prev.length }, () => ({ name: "", phoneNumber: "" })),
      ];
    });
  }, [formData.membersCount]);

  const handleInputChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTravelerChange = (
    index: number,
    field: keyof TravelerDetail,
    value: string
  ) => {
    setTravelerDetails((prev) =>
      prev.map((traveler, travelerIndex) =>
        travelerIndex === index ? { ...traveler, [field]: value } : traveler
      )
    );
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length !== 10) {
      toast.error("Valid 10-digit phone number is required");
      return false;
    }
    if (!formData.city) {
      toast.error("Departure city is required");
      return false;
    }
    if (formData.membersCount < 1 || formData.membersCount > 20) {
      toast.error("Members count must be between 1 and 20");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!tour) {
      toast.error("Tour information not available");
      return;
    }

    const selectedDateWindow = selectedDateWindowIndex !== "" ? availableDateWindows[Number(selectedDateWindowIndex)] : undefined;
    if (availableDateWindows.length > 0 && !selectedDateWindow) {
      toast.error("Please select a tour date");
      return;
    }

    const incompleteTraveler = travelerDetails.find(
      (traveler) => !traveler.name.trim() || !/^\d{10}$/.test(traveler.phoneNumber.trim())
    );
    if (incompleteTraveler) {
      toast.error("Please enter valid name and 10-digit phone for each traveler");
      return;
    }

    setBookingProcessing(true);

    try {
      const bookingData = {
        tourId: tour._id,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        membersCount: formData.membersCount,
        travelerDetails,
        selectedDateWindow,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/universal-bookings/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.data.order.amount,
          currency: data.data.order.currency,
          name: "Infinity Trekkers",
          description: `Tour Booking - ${tour.name}`,
          order_id: data.data.order.id,
          handler: async function (response: RazorpayResponse) {
            try {
              const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/universal-bookings/verify-payment`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  bookingId: data.data.bookingId
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                toast.success("Payment successful! Tour booked successfully.");
                navigate("/");
              } else {
                toast.error("Payment verification failed");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phoneNumber,
          },
          theme: {
            color: "#2563eb",
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Adventure': 'text-orange-600 bg-orange-50 border-orange-200',
      'Cultural': 'text-purple-600 bg-purple-50 border-purple-200',
      'Wildlife': 'text-green-600 bg-green-50 border-green-200',
      'Spiritual': 'text-blue-600 bg-blue-50 border-blue-200',
      'Heritage': 'text-amber-600 bg-amber-50 border-amber-200',
      'Beach': 'text-cyan-600 bg-cyan-50 border-cyan-200',
      'Hill Station': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Desert': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Backwater': 'text-teal-600 bg-teal-50 border-teal-200',
      'Photography': 'text-pink-600 bg-pink-50 border-pink-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);

  const activeDateWindow = selectedDateWindowIndex !== "" ? availableDateWindows[Number(selectedDateWindowIndex)] : availableDateWindows[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-700 text-lg font-semibold tracking-tight">Loading your itinerary...</p>
          <p className="text-slate-500 text-sm mt-2">Preparing the booking page and trip details.</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-sky-100/60 backdrop-blur">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <BadgeCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Tour Not Found</h2>
          <p className="text-slate-600 mb-6 leading-7">{error}</p>
          <button
            onClick={() => navigate("/upcoming-tours")}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
          >
            Browse Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-50 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.20),_transparent_58%)]" />
      <div className="pointer-events-none absolute -left-20 top-40 h-64 w-64 rounded-full bg-sky-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-sky-100/70 backdrop-blur">
          {/* Tour Header */}
          <div className="relative">
            <img
              src={tour.thumbnail || "/api/placeholder/1200/400"}
              alt={tour.name}
              className="h-72 w-full object-cover md:h-[32rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end">
              <div className="max-w-4xl p-6 text-white sm:p-8 lg:p-10">
                <div className="mb-4 flex flex-wrap gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(tour.tourType)}`}>
                    {tour.tourType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white drop-shadow md:text-6xl">
                  {tour.name}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100/90 sm:text-base md:text-lg">
                  Designed as a calm, easy-to-scan booking page with a clear itinerary, essential trip details, and a focused checkout flow.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-100/90 sm:text-base">
                  <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <MapPin className="mr-2 h-4 w-4" />
                    {tour.location}
                  </div>
                  <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Clock className="mr-2 h-4 w-4" />
                    {tour.duration}
                  </div>
                  <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Users className="mr-2 h-4 w-4" />
                    Max {tour.maxGroupSize}
                  </div>
                  {tour.rating > 0 && (
                    <div className="flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                      <Star className="mr-2 h-4 w-4 text-yellow-300" />
                      {tour.rating}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Travel window</p>
              <p className="mt-2 text-lg font-bold tracking-tight text-slate-900">{activeDateWindow ? new Date(activeDateWindow.startDate).toLocaleDateString() : "Dates pending"}</p>
              <p className="text-sm text-slate-500">{activeDateWindow ? new Date(activeDateWindow.endDate).toLocaleDateString() : "Select a date to continue"}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Departure cities</p>
              <p className="mt-2 text-lg font-bold tracking-tight text-slate-900">{departureCities.length}</p>
              <p className="text-sm text-slate-500">pickup points available</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Itinerary stops</p>
              <p className="mt-2 text-lg font-bold tracking-tight text-slate-900">{tour.itinerary?.length || 0}</p>
              <p className="text-sm text-slate-500">day-by-day plan</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Booking style</p>
              <p className="mt-2 text-lg font-bold tracking-tight text-slate-900">Secure checkout</p>
              <p className="text-sm text-slate-500">Razorpay protected</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:gap-8 lg:p-8">
            {/* Tour Details */}
            <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
              {/* Description */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-sky-50/40">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Tour story</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">About This Tour</h3>
                  </div>
                  <div className="hidden rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 sm:flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Curated trip overview
                  </div>
                </div>
                <div
                  className={`prose prose-sky max-w-none text-slate-700 leading-7 ${!isDescriptionExpanded ? 'line-clamp-4 overflow-hidden' : ''}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.description) }}
                />
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-800"
                >
                  {isDescriptionExpanded ? 'Show less' : 'Read the full story'}
                  {isDescriptionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Highlights */}
              {(() => {
                const highlightsArray = Array.isArray(tour.highlights) 
                  ? tour.highlights 
                  : typeof tour.highlights === 'string' 
                    ? tour.highlights.split(',').map(h => h.trim()).filter(h => h)
                    : [];
                
                if (highlightsArray.length === 0) return null;

                return (
                  <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm shadow-sky-50/40">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Top reasons to go</p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Tour Highlights</h3>
                      </div>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {(isHighlightsExpanded 
                        ? highlightsArray 
                        : highlightsArray.slice(0, 6)
                      ).map((highlight: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-700 shadow-sm">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">{index + 1}</span>
                          <span className="text-sm leading-6 text-justify">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {highlightsArray.length > 6 && (
                      <button
                        onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-800"
                      >
                        {isHighlightsExpanded ? 'Show less' : `Show ${highlightsArray.length - 6} more`}
                        {isHighlightsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Inclusions/Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tour.inclusions && tour.inclusions.length > 0 && (
                  <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm shadow-emerald-50/40">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-500">What you get</p>
                        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Inclusions</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {tour.inclusions.map((inclusion, index) => (
                        <li key={index} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-emerald-800 shadow-sm">
                          <span className="mt-1 text-emerald-500">✓</span>
                          <span className="text-sm leading-6">{inclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tour.exclusions && tour.exclusions.length > 0 && (
                  <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm shadow-rose-50/40">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500">Not included</p>
                        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Exclusions</h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {tour.exclusions.map((exclusion, index) => (
                        <li key={index} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-rose-800 shadow-sm">
                          <span className="mt-1 text-rose-500">✕</span>
                          <span className="text-sm leading-6">{exclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Itinerary */}
              {tour.itinerary && tour.itinerary.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm shadow-sky-50/40">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Day-by-day route</p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Itinerary</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">Read this like a real trip plan. Each day is laid out as a stop on the journey, with meals and stay details where available.</p>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm sm:flex">
                      <Route className="h-4 w-4" />
                      {tour.itinerary.length} day route
                    </div>
                  </div>
                  <div className="relative space-y-4 pl-1 before:absolute before:left-[1.15rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-sky-300 before:to-sky-100">
                    {tour.itinerary
                      .slice()
                      .sort((a, b) => Number(a.day) - Number(b.day))
                      .map((day, index) => (
                      <div key={index} className="relative flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-base font-black text-white shadow-lg shadow-sky-200">
                          {day.day}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Day {day.day}</p>
                              <h4 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{day.title}</h4>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Stop {index + 1}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600 text-justify">{day.description}</p>
                          {(day.meals || day.accommodation) && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {day.meals && (
                                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Meals</span>
                                  <span className="mt-1 block leading-6">{day.meals}</span>
                                </div>
                              )}
                              {day.accommodation && (
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-900">
                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-500">Stay</span>
                                  <span className="mt-1 block leading-6">{day.accommodation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-sky-50 sm:rounded-3xl sm:p-6 lg:top-6 lg:p-8">
                <div className="absolute top-0 left-0 h-24 w-24 rounded-full bg-gradient-to-br from-sky-100 to-transparent -translate-x-12 -translate-y-12 sm:h-32 sm:w-32 sm:-translate-x-16 sm:-translate-y-16"></div>
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-gradient-to-bl from-indigo-100 to-transparent translate-x-8 -translate-y-8 sm:h-40 sm:w-40 sm:translate-x-12 sm:-translate-y-12"></div>
                
                <div className="relative z-10">
                  <div className="mb-6 flex items-center sm:mb-8">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 sm:mr-4 sm:h-12 sm:w-12">
                      <CalendarDays className="h-5 w-5 text-sky-600 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Reserve your slot</p>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Booking Form</h2>
                    </div>
                  </div>

                  <div className="mb-6 sm:mb-8 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Total amount</p>
                        <div className="mt-1 text-3xl font-black tracking-tight text-sky-700 sm:text-4xl">
                          ₹{finalPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:block">
                        GST included
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-sky-700">
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">Secure checkout</span>
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">Fast confirmation</span>
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">Razorpay</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                          <User className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>

                    {availableDateWindows.length > 0 && (
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Travel Date</label>
                        <div className="relative">
                          <select
                            value={selectedDateWindowIndex}
                            onChange={(e) => setSelectedDateWindowIndex(e.target.value)}
                            className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-white p-3 text-sm transition-all duration-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                            required
                          >
                            <option value="">Select travel date</option>
                            {availableDateWindows.map((window, index) => (
                              <option key={`${window.startDate}-${window.endDate}-${index}`} value={index}>
                                {(window.label?.trim() ? window.label : `Batch ${index + 1}`) + " - "}
                                {new Date(window.startDate).toLocaleDateString()} to {new Date(window.endDate).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                            <ChevronDown className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                          <User className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Enter your phone number"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                          maxLength={10}
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                          <User className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Departure City</label>
                      <div className="relative">
                        <select
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-white p-3 text-sm transition-all duration-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                          required
                        >
                          <option value="">Select departure city</option>
                          {departureCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                          <MapPin className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Members</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Enter number of members"
                          value={formData.membersCount}
                          onChange={(e) => handleInputChange('membersCount', parseInt(e.target.value) || 1)}
                          className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 sm:p-4 sm:text-base"
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4">
                          <Users className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-sky-500 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Traveler Details ({formData.membersCount} member{formData.membersCount > 1 ? "s" : ""})
                      </label>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {travelerDetails.map((traveler, index) => (
                          <div key={`tour-traveler-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={traveler.name}
                              onChange={(e) => handleTravelerChange(index, "name", e.target.value)}
                              placeholder={`Member ${index + 1} name`}
                              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                              required
                            />
                            <input
                              type="tel"
                              value={traveler.phoneNumber}
                              onChange={(e) => handleTravelerChange(index, "phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                              placeholder={`Member ${index + 1} phone`}
                              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                              maxLength={10}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {formData.city && (
                      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Pricing Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Price per person</span>
                            <span className="font-medium text-slate-900">
                              {(() => {
                                const cityPricing = tour.cityPricing?.find(cp => cp.city === formData.city);
                                if (cityPricing?.discountPrice) {
                                  return (
                                    <>
                                      <span className="mr-2 text-slate-400 line-through">₹{cityPricing.price}</span>
                                      <span className="text-emerald-600">₹{cityPricing.discountPrice}</span>
                                    </>
                                  );
                                }
                                return `₹${cityPricing?.price || 0}`;
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Members</span>
                            <span className="font-medium text-slate-900">{formData.membersCount}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold">
                            <span>Total amount</span>
                            <span className="text-sky-700">₹{finalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingProcessing}
                      className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:from-sky-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg sm:text-base"
                    >
                      {bookingProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <BadgeCheck className="mr-2 h-5 w-5" />
                          Book Now & Pay Securely
                        </div>
                      )}
                    </button>
                    
                    <div className="space-y-1 text-center text-xs text-slate-500">
                      <p>Secure payment gateway</p>
                      <p>Trusted booking flow with instant confirmation</p>
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
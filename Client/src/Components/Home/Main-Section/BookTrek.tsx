import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import DOMPurify from "dompurify";
import { BadgeCheck, CalendarDays, Route, Sparkles, Users, ChevronDown, ChevronUp } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

interface Trek {
  _id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  startDate: string;
  endDate: string;
  dateWindows?: Array<{
    label?: string;
    startDate: string;
    endDate: string;
  }>;
  highlights: string;
  thumbnail: string;
  cityPricing: CityPricing[];
  pickupLocations?: PickupLocation[];
  itinerary?: ItineraryItem[];
}

interface PickupLocation {
  city: string;
  location: string;
  pickupTime: string;
  notes?: string;
}

interface ItineraryItem {
  day: number;
  title: string;
  description: string;
  meals?: string;
  accommodation?: string;
}

interface CityPricing {
  city: string;
  price: number;
  discountPrice: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  pickupLocation: string;
  members: number;
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

const BookTrek = () => {
  const { trekId } = useParams<{ trekId: string }>();
  const [trek, setTrek] = useState<Trek | null>(null);
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
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

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    city: "",
    pickupLocation: "",
    members: 1,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Helper function to remove HTML tags from Quill output
  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);

  // Helper function to check if text is long and needs "Read More"
  const shouldShowReadMore = (text: string, limit: number = 150): boolean => {
    return text.length > limit;
  };

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!trekId) return;
    const fetchTrek = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/treks/${trekId}`);
        const data = await res.json();
        if (data.success) {
          const trekData = data.data as Trek;
          setTrek(trekData);
          setDepartureCities(data.departureCities || []);

          const fallbackWindows = trekData.dateWindows && trekData.dateWindows.length > 0
            ? trekData.dateWindows
            : [{ label: "Primary Schedule", startDate: trekData.startDate, endDate: trekData.endDate }];

          const todayStart = getStartOfToday();
          const futureWindows = fallbackWindows.filter((window) => new Date(window.endDate) >= todayStart);
          setAvailableDateWindows(futureWindows);
          setSelectedDateWindowIndex(futureWindows.length > 0 ? "0" : "");

          if (futureWindows.length === 0) {
            setError("No future booking dates are available for this trek.");
          } else {
            setError("");
          }
          toast.success("Trek details loaded successfully!");
        } else {
          throw new Error(data.message || "Failed to fetch trek");
        }
      } catch (err) {
        console.error("Error fetching trek details:", err);
        setError("Failed to load trek details. Please try again.");
        toast.error("Failed to load trek details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrek();
  }, [trekId, API_BASE]);

  useEffect(() => {
    if (!trek || !formData.city) return;

    const cityObj = trek.cityPricing?.find(
      (cp) => cp.city.toLowerCase() === formData.city.toLowerCase()
    );

    if (!cityObj) return;

    const pricePerMember =
      cityObj.discountPrice > 0 ? cityObj.discountPrice : cityObj.price;
    setFinalPrice(pricePerMember * formData.members);
  }, [formData.city, formData.members, trek]);

  useEffect(() => {
    setTravelerDetails((prev) => {
      const nextCount = Math.max(1, Number(formData.members) || 1);
      if (prev.length === nextCount) return prev;
      if (prev.length > nextCount) return prev.slice(0, nextCount);
      return [
        ...prev,
        ...Array.from({ length: nextCount - prev.length }, () => ({ name: "", phoneNumber: "" })),
      ];
    });
  }, [formData.members]);

  const availablePickupLocations = (trek?.pickupLocations || []).filter(
    (location) => location.city.toLowerCase() === formData.city.toLowerCase()
  );

  const selectedPickupLocation = formData.pickupLocation !== ""
    ? availablePickupLocations[Number(formData.pickupLocation)]
    : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      ...(e.target.name === "city" ? { pickupLocation: "" } : {}),
      [e.target.name]:
        e.target.name === "members"
          ? parseInt(e.target.value)
          : e.target.value,
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

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.city || finalPrice === 0) {
      toast.warning("Please fill all required fields before proceeding to payment");
      return;
    }

    if (!formData.pickupLocation) {
      toast.warning("Please select a pickup location");
      return;
    }

    const selectedDateWindow = selectedDateWindowIndex !== "" ? availableDateWindows[Number(selectedDateWindowIndex)] : undefined;
    if (availableDateWindows.length > 0 && !selectedDateWindow) {
      toast.warning("Please select a trek date");
      return;
    }

    if (availablePickupLocations.length === 0) {
      toast.warning("No pickup locations are available for the selected city");
      return;
    }

    if (!selectedPickupLocation) {
      toast.warning("Please select a pickup location");
      return;
    }

    const incompleteTraveler = travelerDetails.find(
      (traveler) => !traveler.name.trim() || !/^\d{10}$/.test(traveler.phoneNumber.trim())
    );
    if (incompleteTraveler) {
      toast.warning("Please enter valid name and 10-digit phone for each traveler");
      return;
    }

    setBookingProcessing(true);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error("Razorpay SDK failed to load. Please try again.");
      setBookingProcessing(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/bookings/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          city: formData.city,
          pickupLocation: selectedPickupLocation,
          membersCount: formData.members,
          trekId: trekId,
          selectedDateWindow,
          travelerDetails,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const { order, bookingId } = data.data;
      setBookingProcessing(false);
      setPaymentProcessing(true);
      toast.info("Redirecting to payment gateway...");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Infinity Trekkers",
        description: `Booking for ${trek?.name}`,
        order_id: order.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/bookings/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingId: bookingId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success("✅ Payment successful and booking confirmed!");
              // Send confirmation email
              try {
                await fetch(`${API_BASE}/api/bookings/send-confirmation`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    bookingId: bookingId,
                    email: formData.email,
                  }),
                });
                toast.info("Booking confirmation email sent to your email address");
              } catch (emailErr) {
                console.error("Failed to send confirmation email:", emailErr);
                toast.warning("Booking confirmed but failed to send confirmation email");
              }
              
              // Redirect to home page immediately after payment success
              navigate("/");
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error("❌ Payment verification failed. Please contact support.");
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#0284c7" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Booking initiation failed:", err);
      toast.error(err instanceof Error ? err.message : "Booking failed. Please try again.");
      setBookingProcessing(false);
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 mb-2">Loading trek details</h3>
          <p className="text-sm sm:text-base text-slate-600">Preparing your booking experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-sky-100/60 backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <BadgeCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 mb-2">Unable to load trek</h3>
          <p className="text-rose-600 mb-6 text-sm sm:text-base leading-7">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trek) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.20),_transparent_58%)]" />
      <div className="pointer-events-none absolute -left-24 top-44 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
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
      
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 text-white py-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_62%)]" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Trek booking
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3">
              Book Your Trek
            </h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg leading-7 text-sky-100/90" dangerouslySetInnerHTML={{ __html: trek.name }} />
            <div className="mt-6 flex justify-center">
              <div className="h-1 w-24 rounded-full bg-white/90" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            
            {/* Trek Information Card */}
            <div className="order-2 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-sky-100/60 backdrop-blur sm:p-6 lg:order-1 lg:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Trek story</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{trek.difficulty}</span>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Trek details</p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{stripHtmlTags(trek.name)}</h2>
                </div>

                {trek.thumbnail && (
                  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200">
                    <img
                      src={trek.thumbnail}
                      alt={trek.name}
                      className="h-52 w-full object-cover sm:h-60"
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Location</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{stripHtmlTags(trek.location)}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Duration</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{stripHtmlTags(trek.duration)}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Start</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(trek.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">End</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(trek.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Trip overview</p>
                      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Description</h3>
                    </div>
                    <Sparkles className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className={`prose prose-sky max-w-none text-sm leading-7 text-slate-700 ${!isDescriptionExpanded ? 'line-clamp-4 overflow-hidden' : ''}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(trek.description) }} />
                  {shouldShowReadMore(stripHtmlTags(trek.description)) && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-800"
                    >
                      {isDescriptionExpanded ? 'Read less' : 'Read more'}
                      {isDescriptionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Why this trek stands out</p>
                      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Highlights</h3>
                    </div>
                    <Route className="h-5 w-5 text-sky-500" />
                  </div>
                  {(() => {
                    const highlightsArray = String(trek.highlights || "")
                      .split(/[\n,•]/)
                      .map((highlight) => highlight.trim())
                      .filter(Boolean);

                    const visibleHighlights = isHighlightsExpanded ? highlightsArray : highlightsArray.slice(0, 6);

                    return highlightsArray.length > 0 ? (
                      <>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {visibleHighlights.map((highlight, index) => (
                            <li key={`${highlight}-${index}`} className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-700 shadow-sm">
                              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">{index + 1}</span>
                              <span className="text-sm leading-6">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                        {highlightsArray.length > 6 && (
                          <button
                            onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-800"
                          >
                            {isHighlightsExpanded ? 'Show less' : `Show ${highlightsArray.length - 6} more`}
                            {isHighlightsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm leading-7 text-slate-700">{stripHtmlTags(trek.highlights)}</p>
                    );
                  })()}
                </div>

                {trek.itinerary && trek.itinerary.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Day-by-day route</p>
                        <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Itinerary</h3>
                      </div>
                      <div className="hidden items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 sm:flex">
                        <Route className="h-4 w-4" />
                        {trek.itinerary.length} day route
                      </div>
                    </div>
                    <div className="relative space-y-4 pl-1 before:absolute before:left-[1.15rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-sky-300 before:to-sky-100">
                      {trek.itinerary
                        .slice()
                        .sort((a, b) => Number(a.day) - Number(b.day))
                        .map((dayItem, index) => (
                          <div key={`${dayItem.day}-${index}`} className="relative flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                            <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-base font-black text-white shadow-lg shadow-sky-200">
                              {dayItem.day}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Day {dayItem.day}</p>
                                  <h4 className="mt-1 text-sm font-bold tracking-tight text-slate-900 sm:text-base">{dayItem.title}</h4>
                                </div>
                                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">Stop {index + 1}</span>
                              </div>
                              <p className="mt-2 text-sm leading-7 text-slate-600 text-justify">{dayItem.description}</p>
                              {(dayItem.meals || dayItem.accommodation) && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {dayItem.meals && <div className="rounded-2xl bg-sky-50 px-4 py-3 text-xs text-sky-900"><span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Meals</span><span className="mt-1 block leading-6">{dayItem.meals}</span></div>}
                                  {dayItem.accommodation && <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs text-indigo-900"><span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-500">Stay</span><span className="mt-1 block leading-6">{dayItem.accommodation}</span></div>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-500">Pricing</p>
                      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Starting from</h3>
                    </div>
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="grid gap-2">
                    {trek.cityPricing.map((cp) => (
                      <div key={cp.city} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                        <span className="font-medium text-slate-700">{cp.city}</span>
                        <span className="font-semibold text-slate-900">
                          {cp.discountPrice > 0 ? (
                            <>
                              <span className="mr-2 text-slate-400 line-through">₹{cp.price}</span>
                              <span className="text-emerald-600">₹{cp.discountPrice}</span>
                            </>
                          ) : (
                            <span>₹{cp.price}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs font-semibold text-slate-700">Secure</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs font-semibold text-slate-700">Verified</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-xs font-semibold text-slate-700">Expert</p></div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="order-1 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-sky-100/60 backdrop-blur sm:p-6 lg:order-2 lg:p-8">
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

                <div className="mb-6 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-500">Your total</p>
                      <div className="mt-1 text-3xl font-black tracking-tight text-sky-700 sm:text-4xl">₹{finalPrice.toLocaleString()}</div>
                    </div>
                    <div className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:block">GST included</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-sky-700">
                    <span className="rounded-full bg-white px-3 py-2 shadow-sm">Secure checkout</span>
                    <span className="rounded-full bg-white px-3 py-2 shadow-sm">Fast confirmation</span>
                    <span className="rounded-full bg-white px-3 py-2 shadow-sm">Razorpay</span>
                  </div>
                </div>

                <form className="space-y-4 sm:space-y-6" onSubmit={(e) => e.preventDefault()}>
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
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white text-sm sm:text-base"
                      >
                        <option value="">Select Departure City</option>
                        {departureCities.length > 0 ? (
                          departureCities.map((city) => {
                            const cp = trek.cityPricing.find(
                              (item) => item.city.toLowerCase() === city.toLowerCase()
                            );
                            const price = cp && cp.discountPrice !== undefined && cp.discountPrice > 0
                              ? cp.discountPrice
                              : cp?.price;
                            return (
                              <option key={city} value={city}>
                                {city} (₹{price})
                              </option>
                            );
                          })
                        ) : (
                          <option disabled>No cities available</option>
                        )}
                      </select>
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
                    <div className="relative">
                      <select
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white text-sm sm:text-base"
                        required
                        disabled={!formData.city || availablePickupLocations.length === 0}
                      >
                        <option value="">
                          {!formData.city
                            ? "Select departure city first"
                            : availablePickupLocations.length > 0
                              ? "Select pickup location"
                              : "No pickup locations configured for this city"}
                        </option>
                        {availablePickupLocations.map((location, index) => (
                          <option key={`${location.city}-${location.location}-${location.pickupTime}-${index}`} value={index}>
                            {location.location} - {location.pickupTime}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Date Window Selection */}
                  {availableDateWindows.length > 0 && (
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Date</label>
                      <div className="relative">
                        <select
                          value={selectedDateWindowIndex}
                          onChange={(e) => setSelectedDateWindowIndex(e.target.value)}
                          className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white text-sm sm:text-base"
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
                        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                        placeholder="Enter your 10-digit phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Members Count */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Members</label>
                    <div className="relative">
                      <input
                        name="members"
                        type="number"
                        min="1"
                        max="20"
                        placeholder="Number of members"
                        value={formData.members}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-gray-200 p-3 sm:p-4 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Traveler Details ({formData.members} member{formData.members > 1 ? "s" : ""})
                    </label>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {travelerDetails.map((traveler, index) => (
                        <div key={`traveler-${index}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-gray-200 p-3 bg-gray-50">
                          <input
                            type="text"
                            value={traveler.name}
                            onChange={(e) => handleTravelerChange(index, "name", e.target.value)}
                            placeholder={`Member ${index + 1} name`}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                            required
                          />
                          <input
                            type="tel"
                            value={traveler.phoneNumber}
                            onChange={(e) => handleTravelerChange(index, "phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder={`Member ${index + 1} phone`}
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                            maxLength={10}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="bg-gradient-to-r from-sky-50 to-sky-100 p-4 sm:p-6 rounded-2xl border border-sky-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="text-2xl sm:text-3xl font-bold text-sky-600">₹{finalPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formData.members} member{formData.members > 1 ? 's' : ''}
                        </p>
                        {formData.city && (
                          <p className="text-xs sm:text-sm text-gray-600">from {formData.city}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!formData.name || !formData.email || !formData.phone || !formData.city || !formData.pickupLocation || finalPrice === 0 || bookingProcessing || paymentProcessing}
                      
                    className="w-full bg-gradient-to-r from-sky-600 to-sky-700 text-white p-3 sm:p-4 rounded-xl hover:from-sky-700 hover:to-sky-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 sm:space-x-3 font-semibold text-sm sm:text-lg"
                  >
                    {bookingProcessing ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Booking...</span>
                      </>
                    ) : paymentProcessing ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Redirecting to Payment...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="hidden sm:inline">Proceed to Secure Payment</span>
                        <span className="sm:hidden">Secure Payment</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="text-center pt-2 sm:pt-4">
                    <p className="text-xs text-gray-500 flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Your payment is secured with 256-bit SSL encryption
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8 sm:mt-12 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Why Book With Us?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="text-center group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">100% Safe & Secure</h4>
                <p className="text-gray-600 text-xs sm:text-sm text-justify">Your bookings and payments are completely secure with industry-standard encryption.</p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Expert Guides</h4>
                <p className="text-gray-600 text-xs sm:text-sm text-justify">Professional and experienced trek leaders ensure your safety and amazing experience.</p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-xs sm:text-sm text-justify">Round-the-clock customer support for any queries or assistance you need.</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">We accept all major payment methods</p>
            <div className="flex justify-center items-center space-x-4 sm:space-x-6 opacity-70">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">VISA</div>
              <div className="text-lg sm:text-2xl font-bold text-orange-600">RuPay</div>
              <div className="text-sm sm:text-lg font-semibold text-purple-600">UPI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookTrek;
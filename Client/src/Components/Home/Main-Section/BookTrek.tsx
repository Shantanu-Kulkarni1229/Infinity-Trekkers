import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
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
  highlights: string;
  thumbnail: string;
  cityPricing: CityPricing[];
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
  members: number;
}

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
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    city: "",
    members: 1,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Helper function to remove HTML tags from Quill output
  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Helper function to check if text is long and needs "Read More"
  const shouldShowReadMore = (text: string, limit: number = 150): boolean => {
    return text.length > limit;
  };

  // Helper function to truncate text
  const truncateText = (text: string, limit: number = 150): string => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  useEffect(() => {
    if (!trekId) return;
    const fetchTrek = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/treks/${trekId}`);
        const data = await res.json();
        if (data.success) {
          setTrek(data.data);
          setDepartureCities(data.departureCities || []);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.name === "members"
          ? parseInt(e.target.value)
          : e.target.value,
    }));
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
          membersCount: formData.members,
          trekId: trekId,
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
              
              // Redirect to home page after 3 seconds
              setTimeout(() => {
                navigate("/");
              }, 3000);
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

      // @ts-ignore - Razorpay types not included
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-8 h-8 sm:w-12 sm:h-12 border-2 border-transparent border-t-sky-400 rounded-full animate-spin mx-auto mt-2 ml-2"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Loading Trek Details</h3>
          <p className="text-sm sm:text-base text-gray-600">Preparing your booking experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-4 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Unable to Load Trek</h3>
          <p className="text-red-600 mb-6 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-sky-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-sky-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trek) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50">
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
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 bg-opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-6 left-10 w-8 h-8 sm:w-16 sm:h-16 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-6 h-6 sm:w-12 sm:h-12 bg-white bg-opacity-5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-10 left-1/4 w-4 h-4 sm:w-8 sm:h-8 bg-white bg-opacity-10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent">
              Book Your Adventure
            </h1>
            <p 
              className="text-base sm:text-lg md:text-xl text-sky-100 max-w-2xl mx-auto px-4" 
              dangerouslySetInnerHTML={{ __html: trek.name }} 
            />
            <div className="w-20 h-1 bg-white mx-auto rounded-full mt-4"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            
            {/* Trek Information Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 relative overflow-hidden order-2 lg:order-1">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-bl from-sky-100 to-transparent rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 2.5L16 4.5 13.5 7 16 9.5 13.5 12 16 14.5 13.5 17 16 19.5 13.5 22 16 22.5 13.5 20 16 17.5 13.5 15 16 12.5 13.5 10 16 7.5 13.5 5 16 2.5" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Trek Details</h2>
                </div>

                {trek.thumbnail && (
                  <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={trek.thumbnail}
                      alt={trek.name}
                      className="w-full h-40 sm:h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold break-words">{stripHtmlTags(trek.name)}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span><strong>Location:</strong> {stripHtmlTags(trek.location)}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Duration:</strong> {stripHtmlTags(trek.duration)}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span><strong>Difficulty:</strong> {trek.difficulty}</span>
                  </div>

                  <div className="flex items-start text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-sky-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-col space-y-1">
                      <span><strong>Start:</strong> {new Date(trek.startDate).toLocaleDateString()}</span>
                      <span><strong>End:</strong> {new Date(trek.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Description:</h4>
                    <div className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">
                      {shouldShowReadMore(stripHtmlTags(trek.description)) ? (
                        <>
                          {isDescriptionExpanded ? stripHtmlTags(trek.description) : truncateText(stripHtmlTags(trek.description))}
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="ml-2 text-sky-600 hover:text-sky-700 font-medium underline focus:outline-none"
                          >
                            {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        </>
                      ) : (
                        stripHtmlTags(trek.description)
                      )}
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Highlights:</h4>
                    <div className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">
                      {shouldShowReadMore(stripHtmlTags(trek.highlights)) ? (
                        <>
                          {isHighlightsExpanded ? stripHtmlTags(trek.highlights) : truncateText(stripHtmlTags(trek.highlights))}
                          <button
                            onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                            className="ml-2 text-sky-600 hover:text-sky-700 font-medium underline focus:outline-none"
                          >
                            {isHighlightsExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        </>
                      ) : (
                        stripHtmlTags(trek.highlights)
                      )}
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Pricing:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {trek.cityPricing.map((cp) => (
                        <div key={cp.city} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-gray-600">{cp.city}:</span>
                          <span className="font-medium">
                            {cp.discountPrice > 0 ? (
                              <>
                                <span className="text-gray-400 line-through mr-2">₹{cp.price}</span>
                                <span className="text-green-600">₹{cp.discountPrice}</span>
                              </>
                            ) : (
                              <span>₹{cp.price}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Secure</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Verified</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Expert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 relative overflow-hidden order-1 lg:order-2">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-full -translate-y-12 -translate-x-12 sm:-translate-y-16 sm:-translate-x-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Booking Form</h2>
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
                    disabled={!formData.name || !formData.email || !formData.phone || !formData.city || finalPrice === 0 || bookingProcessing || paymentProcessing}
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
                <p className="text-gray-600 text-xs sm:text-sm">Your bookings and payments are completely secure with industry-standard encryption.</p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Expert Guides</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Professional and experienced trek leaders ensure your safety and amazing experience.</p>
              </div>

              <div className="text-center group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Round-the-clock customer support for any queries or assistance you need.</p>
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
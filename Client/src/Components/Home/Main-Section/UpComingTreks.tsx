import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CityPricing {
  city: string;
  price: number;
  discountPrice?: number;
}

interface Trek {
  _id: string;
  name: string;
  description: string;
  highlights: string;
  location: string;
  duration: string;
  difficulty: string;
  startDate: string;
  endDate: string;
  thumbnail: string;
  price?: number;
  cityPricing?: CityPricing[];
}

const UpcomingTreks: React.FC = () => {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchTreks();
  }, []);

  const fetchTreks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/treks`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTreks(data.data);
      } else {
        throw new Error("Unexpected response format from API");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch treks. Please check your backend or network.");
      toast.error("Failed to load treks. Please try again later.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (trek: Trek) => {
    toast.info(`Redirecting to booking for ${trek.name}`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    setTimeout(() => {
      window.location.href = `/book/${trek._id}`;
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderPrice = (price: number, discountPrice?: number) => {
    if (discountPrice) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 line-through text-sm">₹{price}</span>
          <span className="text-sky-600 font-bold text-lg">₹{discountPrice}</span>
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {Math.round(((price - discountPrice) / price) * 100)}% OFF
          </span>
        </div>
      );
    }
    return <span className="text-sky-600 font-bold text-lg">₹{price}</span>;
  };

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower.includes('easy')) return 'bg-green-100 text-green-800 border-green-200';
    if (lower.includes('moderate')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (lower.includes('hard') || lower.includes('difficult')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ToastContainer />
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-14 h-14 border-2 border-transparent border-t-sky-300 rounded-full animate-spin mx-auto mt-3 ml-3"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Discovering Amazing Treks</h3>
          <p className="text-gray-600 text-lg">Loading your next adventure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ToastContainer />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button 
            onClick={() => {
              toast.info("Refreshing treks...", {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
              });
              setTimeout(() => window.location.reload(), 1000);
            }} 
            className="bg-sky-500 text-white px-8 py-3 rounded-xl hover:bg-sky-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (treks.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ToastContainer />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-100">
            <svg className="w-14 h-14 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-3">No Adventures Yet</h3>
          <p className="text-gray-600 mb-6 text-lg">We're preparing amazing treks for you. Check back soon!</p>
          <button
            onClick={() => {
              toast.info("Checking for new treks...", {
                position: "top-center",
                autoClose: 1000,
                hideProgressBar: true,
              });
              setTimeout(() => fetchTreks(), 1000);
            }}
            className="bg-sky-500 text-white px-8 py-3 rounded-xl hover:bg-sky-600 transition-all duration-300 font-semibold"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-sky-50 via-teal-50 to-cyan-50 py-12 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-sky-100 text-sky-800 rounded-full text-sm font-semibold mb-4 md:mb-6 border border-sky-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
            </svg>
            Adventure Awaits
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
            Upcoming <span className="text-sky-600">Treks</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            Embark on extraordinary journeys through breathtaking landscapes. Your next unforgettable adventure starts here.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Expert Guides
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Premium Experience
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Best Prices
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Cards Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {treks.map((trek, index) => {
            const prices = trek.cityPricing?.map(cp => Number(cp.discountPrice || cp.price)) || [];
            const minPrice = prices.length > 0 ? Math.min(...prices) : trek.price || "N/A";
            
            const cityWithDiscount = trek.cityPricing?.find(cp => cp.discountPrice);
            const discountPercentage = cityWithDiscount 
              ? Math.round(((cityWithDiscount.price - cityWithDiscount.discountPrice!) / cityWithDiscount.price) * 100)
              : 0;

            return (
              <div 
                key={trek._id} 
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 overflow-hidden border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image Container with Overlay */}
                <div className="relative overflow-hidden h-60 sm:h-72">
                  {discountPercentage > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {discountPercentage}% OFF
                    </div>
                  )}
                  
                  <img 
                    src={trek.thumbnail || "/default-trek.jpg"} 
                    alt={trek.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    loading="lazy"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(trek.difficulty)}`}>
                      {trek.difficulty}
                    </div>
                    {trek.startDate && (
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                        <p className="text-xs font-semibold text-gray-800">
                          {formatDate(trek.startDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom content overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trek.name) }} />
                    </h2>
                    <div className="flex items-center text-white/90 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {trek.location}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {/* Trek Details Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Duration</div>
                        <div className="font-semibold">{trek.duration}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Dates</div>
                        <div className="font-semibold">{formatDate(trek.startDate)} - {formatDate(trek.endDate)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* City Pricing */}
                  {trek.cityPricing && trek.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 0 && (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        City-wise Pricing
                      </h4>
                      <div className="space-y-2">
                        {trek.cityPricing
                          .filter(cp => cp.price !== null && cp.price !== undefined)
                          .map((cityPrice, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">{cityPrice.city}</span>
                              {renderPrice(cityPrice.price, cityPrice.discountPrice)}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {trek.highlights && (
                    <div className="bg-gradient-to-r from-sky-50 to-teal-50 p-3 sm:p-4 rounded-xl border border-sky-100">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 mr-2 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-semibold text-sky-800">Highlights</span>
                      </div>
                      <div
                        className="text-sm text-sky-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trek.highlights) }}
                      />
                    </div>
                  )}

                  {/* CTA Section */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
                    <div className="w-full sm:w-auto">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Starting from</p>
                      <div className="flex items-baseline gap-2">
                        {discountPercentage > 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">₹{cityWithDiscount?.price}</span>
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{minPrice}</span>
                          </>
                        ) : (
                          <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{minPrice}</span>
                        )}
                        <span className="text-sm text-gray-500 ml-1">onwards</span>
                      </div>
                    </div>
                    
                  <button
  onClick={() => handleBookNow(trek)}
  className="
    w-full sm:w-auto 
    bg-sky-500 hover:bg-sky-600 
    text-white 
    px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 
    text-sm sm:text-base md:text-lg 
    rounded-xl 
    font-semibold 
    transition-all duration-300 
    shadow-lg hover:shadow-xl 
    transform hover:-translate-y-1 
    flex items-center justify-center 
    group
  "
>
  Book Now
  <svg
    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
</button>

                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action Footer */}
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready for Your Next Adventure?</h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of adventurers who have discovered the magic of trekking with us. Book your spot today!
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              100% Safe & Secure
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Instant Confirmation
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              24/7 Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTreks;
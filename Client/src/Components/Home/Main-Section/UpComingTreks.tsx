/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronRight, MapPin, Clock, Calendar, Star, Users, Mountain } from "lucide-react";

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
  const [selectedCity, setSelectedCity] = useState<string>("All");
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const fetchTreks = useCallback(async () => {
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
  }, [API_BASE]);

  useEffect(() => {
    fetchTreks();
  }, [fetchTreks]);

  // Get unique cities from treks
  const getUniqueCities = () => {
    const cities = new Set<string>();
    treks.forEach(trek => {
      if (trek.cityPricing && trek.cityPricing.length > 0) {
        trek.cityPricing.forEach(cp => {
          if (cp.city && cp.city.trim()) {
            cities.add(cp.city.trim());
          }
        });
      }
    });
    return Array.from(cities).sort();
  };

  // Filter treks based on selected city
  const getFilteredTreks = () => {
    if (selectedCity === "All") {
      return treks;
    }
    
    return treks.filter(trek => {
      if (!trek.cityPricing || trek.cityPricing.length === 0) {
        return false;
      }
      return trek.cityPricing.some(cp => cp.city && cp.city.trim() === selectedCity);
    });
  };

  const filteredTreks = getFilteredTreks();
  const uniqueCities = getUniqueCities();

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
          <span className="text-sky-600 font-bold text-base">₹{discountPrice}</span>
          <span className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
            {Math.round(((price - discountPrice) / price) * 100)}% OFF
          </span>
        </div>
      );
    }
    return <span className="text-sky-600 font-bold text-base">₹{price}</span>;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <ToastContainer />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-100 shadow-lg">
            <Mountain className="w-14 h-14 text-gray-400" />
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
            className="bg-sky-500 text-white px-8 py-3 rounded-xl hover:bg-sky-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
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
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-sky-800 rounded-full text-sm font-semibold mb-4 md:mb-6 border border-sky-200 shadow-sm">
            <Mountain className="w-4 h-4 mr-2" />
            Adventure Awaits
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight">
            Upcoming <span className="text-sky-600">Treks</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            Embark on extraordinary journeys through breathtaking landscapes. Your next unforgettable adventure starts here.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-gray-500">
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Expert Guides
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Premium Experience
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-sky-500 rounded-full mr-2"></div>
              Best Prices
            </div>
          </div>
        </div>
      </div>

      {/* City Filter */}
      {uniqueCities.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-blue-100">
              <button
                onClick={() => setSelectedCity("All")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                  selectedCity === "All"
                    ? "bg-sky-600 text-white border-sky-600 shadow-md"
                    : "text-gray-700 hover:bg-sky-50 border-transparent"
                }`}
              >
                All Cities
              </button>
              {uniqueCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    selectedCity === city
                      ? "bg-sky-600 text-white border-sky-600 shadow-md"
                      : "text-gray-700 hover:bg-sky-50 border-transparent"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Cards Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        {filteredTreks.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-100">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-blue-600" />
              </div>
              {selectedCity === "All" ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Treks Available</h3>
                  <p className="text-gray-600 text-lg mb-6">We're preparing some amazing adventures for you!</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Treks in {selectedCity}</h3>
                  <p className="text-gray-600 text-lg mb-6">Try selecting a different city or explore all our treks.</p>
                </>
              )}
              <button
                onClick={() => setSelectedCity("All")}
                className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-all duration-200"
              >
                View All Treks
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTreks.map((trek) => {
              const prices = trek.cityPricing?.map(cp => Number(cp.discountPrice || cp.price)) || [];
              const minPrice = prices.length > 0 ? Math.min(...prices) : trek.price || "N/A";
              
              const cityWithDiscount = trek.cityPricing?.find(cp => cp.discountPrice);
              const discountPercentage = cityWithDiscount 
                ? Math.round(((cityWithDiscount.price - cityWithDiscount.discountPrice!) / cityWithDiscount.price) * 100)
                : 0;

              return (
                <div 
                  key={trek._id} 
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden h-64">
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {discountPercentage}% OFF
                      </div>
                    )}
                    
                    {/* Trek Image */}
                    <img 
                      src={trek.thumbnail || "/default-trek.jpg"} 
                      alt={trek.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>
                    
                    {/* Top Info Bar */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getDifficultyColor(trek.difficulty)} shadow-sm backdrop-blur-sm`}>
                          {trek.difficulty}
                        </div>
                        {trek.startDate && (
                          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                            <p className="text-xs font-bold text-gray-800">
                              {formatDate(trek.startDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-xl font-bold text-white mb-3 leading-tight line-clamp-2">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trek.name) }} />
                      </h3>
                      <div className="flex items-center text-white/90 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate font-medium">{trek.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-5">
                    {/* Trek Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Duration</div>
                          <div className="font-bold text-gray-900 truncate">{trek.duration}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Dates</div>
                          <div className="font-bold text-gray-900 text-xs leading-tight">
                            {formatDate(trek.startDate)} - {formatDate(trek.endDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* City Pricing */}
                    {trek.cityPricing && trek.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 0 && (
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                          City-wise Pricing
                        </h4>
                        <div className="space-y-3">
                          {trek.cityPricing
                            .filter(cp => cp.price !== null && cp.price !== undefined)
                            .slice(0, 3)
                            .map((cityPrice, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800 flex-shrink-0">{cityPrice.city}</span>
                                <div className="flex-shrink-0 text-right">
                                  {renderPrice(cityPrice.price, cityPrice.discountPrice)}
                                </div>
                              </div>
                            ))}
                          {trek.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 3 && (
                            <div className="text-center pt-2">
                              <span className="text-sm text-blue-600 font-semibold">
                                +{trek.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length - 3} more cities
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {trek.highlights && (
                      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-2xl border border-sky-200">
                        <div className="flex items-center mb-3">
                          <Star className="w-4 h-4 mr-2 text-sky-600 flex-shrink-0 fill-current" />
                          <span className="text-sm font-bold text-sky-800">Trek Highlights</span>
                        </div>
                        <div className="text-sm text-sky-800 line-clamp-3 leading-relaxed font-medium">
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trek.highlights) }} />
                        </div>
                      </div>
                    )}

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-3">
                      <div className="text-center sm:text-left">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Starting from</p>
                        <div className="flex items-baseline justify-center sm:justify-start gap-2">
                          {discountPercentage > 0 ? (
                            <>
                              <span className="text-gray-400 line-through text-base">₹{cityWithDiscount?.price}</span>
                              <span className="text-2xl font-bold text-gray-900">₹{minPrice}</span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-gray-900">₹{minPrice}</span>
                          )}
                          <span className="text-sm text-gray-500 font-medium">per person</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBookNow(trek)}
                        className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 min-w-[120px]"
                      >
                        Book Now
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {treks.length > 0 && (
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready for Your Next Adventure?</h3>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of adventurers who have discovered the magic of trekking with us. Book your spot today!
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Star className="w-4 h-4 mr-2 text-yellow-300 fill-current" />
                  100% Safe & Secure
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Users className="w-4 h-4 mr-2 text-yellow-300" />
                  Instant Confirmation
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4 mr-2 text-yellow-300" />
                  24/7 Support
                </div>
              </div>
              <button className="inline-flex items-center gap-3 bg-white text-sky-600 px-10 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Explore All Treks
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingTreks;
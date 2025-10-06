/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronRight, MapPin, Clock, Users, Star, Calendar } from "lucide-react";

interface Tour {
  _id: string;
  name: string;
  location: string;
  duration: string;
  tourType: string;
  difficulty: string;
  thumbnail: string;
  cityPricing: Array<{
    city: string;
    price: number;
    discountPrice?: number;
  }>;
  highlights: string | string[];
  rating: number;
  totalBookings: number;
  maxGroupSize: number;
  isFeatured: boolean;
}

const UpComingTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("All");

  useEffect(() => {
    fetchFeaturedTours();
  }, []);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      
      // Try fallback to regular tours endpoint first since featured might not be implemented yet
      console.log("Fetching tours from API...");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tours`);
      const toursData = response.data.data || response.data || [];
      
      // If we have tours, take the first 6 (can be filtered for featured later)
      const limitedTours = Array.isArray(toursData) ? toursData.slice(0, 6) : [];
      setTours(limitedTours);
      
      console.log(`Successfully fetched ${limitedTours.length} tours`);
    } catch (error) {
      console.error("Error fetching tours:", error);
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (tour: Tour) => {
    toast.info(`Redirecting to booking for ${tour.name}`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    setTimeout(() => {
      window.location.href = `/book-tour/${tour._id}`;
    }, 2000);
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

  // Get unique cities from tours
  const getUniqueCities = () => {
    const cities = new Set<string>();
    tours.forEach(tour => {
      if (tour.cityPricing && tour.cityPricing.length > 0) {
        tour.cityPricing.forEach(cp => {
          if (cp.city && cp.city.trim()) {
            cities.add(cp.city.trim());
          }
        });
      }
    });
    return Array.from(cities).sort();
  };

  // Filter tours based on selected city
  const getFilteredTours = () => {
    if (selectedCity === "All") {
      return tours;
    }
    
    return tours.filter(tour => {
      if (!tour.cityPricing || tour.cityPricing.length === 0) {
        return false;
      }
      return tour.cityPricing.some(cp => cp.city && cp.city.trim() === selectedCity);
    });
  };

  const filteredTours = getFilteredTours();
  const uniqueCities = getUniqueCities();

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower.includes('easy')) return 'bg-green-100 text-green-800 border-green-200';
    if (lower.includes('moderate')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (lower.includes('hard') || lower.includes('difficult')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-blue-100 mb-6">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 ml-2">Upcoming Adventures</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Discover Your Next Journey
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-64 bg-gray-300"></div>
                <div className="p-6 space-y-5">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-sky-100">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-blue-100 mb-6">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 ml-2">Upcoming Adventures</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover Your Next Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Explore breathtaking destinations with our carefully curated tour packages. 
            From cultural explorations to thrilling adventure expeditions.
          </p>
          <Link 
            to="/upcoming-tours"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            View All Tours
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* City Filter */}
        {uniqueCities.length > 0 && (
          <div className="flex justify-center mb-12">
            <div className="flex flex-wrap items-center justify-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-blue-100">
              <button
                onClick={() => setSelectedCity("All")}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                  selectedCity === "All"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "text-gray-700 hover:bg-blue-50 border-transparent"
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
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "text-gray-700 hover:bg-blue-50 border-transparent"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-100">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-blue-600" />
              </div>
              {selectedCity === "All" ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Tours Available</h3>
                  <p className="text-gray-600 text-lg mb-6">We're preparing some amazing adventures for you!</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Tours in {selectedCity}</h3>
                  <p className="text-gray-600 text-lg mb-6">Try selecting a different city or explore all our tours.</p>
                </>
              )}
              <Link 
                to="/upcoming-tours"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                Browse All Tours
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => {
              const prices = tour.cityPricing?.map(cp => Number(cp.discountPrice || cp.price)) || [];
              const minPrice = prices.length > 0 ? Math.min(...prices) : "N/A";
              
              const cityWithDiscount = tour.cityPricing?.find(cp => cp.discountPrice);
              const discountPercentage = cityWithDiscount 
                ? Math.round(((cityWithDiscount.price - cityWithDiscount.discountPrice!) / cityWithDiscount.price) * 100)
                : 0;

              return (
                <div 
                  key={tour._id} 
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 flex flex-col h-full"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden h-64 flex-shrink-0">
                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {discountPercentage}% OFF
                      </div>
                    )}
                    
                    {/* Tour Image */}
                    <img 
                      src={tour.thumbnail || "/default-tour.jpg"} 
                      alt={tour.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80"></div>
                    
                    {/* Top Info Bar */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getDifficultyColor(tour.difficulty)} shadow-sm backdrop-blur-sm`}>
                          {tour.difficulty}
                        </div>
                        {tour.tourType && (
                          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                            <p className="text-xs font-bold text-gray-800">
                              {tour.tourType}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-xl font-bold text-white mb-3 leading-tight line-clamp-2">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tour.name) }} />
                      </h3>
                      <div className="flex items-center text-white/90 text-sm mb-2">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate font-medium">{tour.location}</span>
                      </div>
                      {tour.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
                            <span className="text-xs font-bold text-white">{tour.rating}</span>
                          </div>
                          {tour.totalBookings > 0 && (
                            <span className="text-xs text-white/80">
                              {tour.totalBookings}+ bookings
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-5 flex-1 flex flex-col">
                    {/* Tour Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Duration</div>
                          <div className="font-bold text-gray-900 truncate">{tour.duration}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Group Size</div>
                          <div className="font-bold text-gray-900 truncate">Max {tour.maxGroupSize || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* City Pricing */}
                    {tour.cityPricing && tour.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 0 && (
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                          City-wise Pricing
                        </h4>
                        <div className="space-y-3">
                          {tour.cityPricing
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
                          {tour.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 3 && (
                            <div className="text-center pt-2">
                              <span className="text-sm text-blue-600 font-semibold">
                                +{tour.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length - 3} more cities
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {tour.highlights && tour.highlights.length > 0 && (
                      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-2xl border border-sky-200 flex-1">
                        <div className="flex items-center mb-3">
                          <Star className="w-4 h-4 mr-2 text-sky-600 flex-shrink-0 fill-current" />
                          <span className="text-sm font-bold text-sky-800">Tour Highlights</span>
                        </div>
                        <div className="text-sm text-sky-800 space-y-2">
                          {(() => {
                            const highlightsArray = Array.isArray(tour.highlights) 
                              ? tour.highlights 
                              : tour.highlights.split(',');
                            return highlightsArray.slice(0, 3).map((highlight: string, idx: number) => (
                              <div key={idx} className="flex items-start">
                                <span className="text-sky-500 mr-3 mt-0.5 flex-shrink-0">•</span>
                                <span 
                                  className="line-clamp-2 leading-relaxed font-medium"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlight.trim()) }} 
                                />
                              </div>
                            ));
                          })()}
                          {(() => {
                            const highlightsArray = Array.isArray(tour.highlights) 
                              ? tour.highlights 
                              : tour.highlights.split(',');
                            return highlightsArray.length > 3 && (
                              <div className="text-center pt-2">
                                <span className="text-sm text-sky-600 font-semibold">
                                  +{highlightsArray.length - 3} more highlights
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-3 mt-auto">
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
                        onClick={() => handleBookNow(tour)}
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
        {tours.length > 0 && (
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready for Your Next Adventure?</h3>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Explore our complete collection of tours and find the perfect journey for you.
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
              <Link 
                to="/upcoming-tours"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Explore All Tours
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpComingTours;
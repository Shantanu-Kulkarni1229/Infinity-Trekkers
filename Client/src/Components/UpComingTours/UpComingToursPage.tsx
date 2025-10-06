import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Filter, Search, ChevronDown } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Tour {
  _id: string;
  name: string;
  location: string;
  description: string;
  duration: string;
  tourType: string;
  difficulty: string;
  thumbnail: string;
  cityPricing: Array<{
    city: string;
    price: number;
    discountPrice?: number;
  }>;
  highlights: string[] | string; // Fixed: can be array or string
  rating: number;
  totalBookings: number;
  maxGroupSize: number;
  isFeatured: boolean;
  tags: string[];
  priceRange: string;
  createdAt?: string;
}

const UpComingToursPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);

  const tourTypes = ['Adventure', 'Cultural', 'Wildlife', 'Spiritual', 'Heritage', 'Beach', 'Hill Station', 'Desert', 'Backwater', 'Photography'];
  const difficulties = ['Easy', 'Moderate', 'Hard'];

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tours?active=true&sortBy=${sortBy}&limit=50`);
      
      // Handle different possible response structures safely
      let toursData: Tour[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          toursData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          toursData = response.data.data;
        } else if (response.data.data && response.data.data.tours && Array.isArray(response.data.data.tours)) {
          toursData = response.data.data.tours;
        } else if (response.data.tours && Array.isArray(response.data.tours)) {
          toursData = response.data.tours;
        }
      }
      
      // Normalize highlights data to ensure consistent format
      const normalizedTours = toursData.map(tour => ({
        ...tour,
        highlights: normalizeHighlights(tour.highlights)
      }));
      
      setTours(normalizedTours);
      
      if (toursData.length === 0) {
        console.log("No tours found in response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Error fetching tours");
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  // Helper function to normalize highlights data
  const normalizeHighlights = (highlights: string[] | string | undefined): string => {
    if (!highlights) return '';
    
    if (Array.isArray(highlights)) {
      return highlights.join(', ');
    }
    
    if (typeof highlights === 'string') {
      return highlights;
    }
    
    return String(highlights);
  };

  const filterTours = useCallback(() => {
    if (!Array.isArray(tours) || tours.length === 0) {
      setFilteredTours([]);
      return;
    }

    let filtered = tours.filter((tour): tour is Tour => 
      tour && typeof tour === 'object' && typeof tour._id === 'string' && typeof tour.name === 'string'
    );

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(tour =>
        tour.name?.toLowerCase().includes(term) ||
        tour.location?.toLowerCase().includes(term) ||
        tour.description?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter(tour => tour.tourType === selectedType);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(tour => tour.difficulty === selectedDifficulty);
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(tour => {
        if (!Array.isArray(tour.cityPricing) || tour.cityPricing.length === 0) {
          return false;
        }
        return tour.cityPricing.some(cp => cp.city === selectedCity);
      });
    }

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(tour => {
        if (!Array.isArray(tour.cityPricing) || tour.cityPricing.length === 0) {
          return false;
        }
        
        const validPrices = tour.cityPricing
          .map(cp => cp.discountPrice ?? cp.price)
          .filter((price): price is number => typeof price === 'number' && !isNaN(price));
        
        if (validPrices.length === 0) return false;
        
        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);
        
        const min = priceRange.min ? parseInt(priceRange.min) : 0;
        const max = priceRange.max ? parseInt(priceRange.max) : Infinity;
        
        if (isNaN(min) || isNaN(max)) return true;
        
        return minPrice >= min && maxPrice <= max;
      });
    }

    // Sort tours
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        
        case 'price': {
          const aPrices = Array.isArray(a.cityPricing) 
            ? a.cityPricing.map(cp => cp.discountPrice ?? cp.price).filter((p): p is number => typeof p === 'number' && !isNaN(p))
            : [];
          const bPrices = Array.isArray(b.cityPricing) 
            ? b.cityPricing.map(cp => cp.discountPrice ?? cp.price).filter((p): p is number => typeof p === 'number' && !isNaN(p))
            : [];
          
          const aMinPrice = aPrices.length > 0 ? Math.min(...aPrices) : Infinity;
          const bMinPrice = bPrices.length > 0 ? Math.min(...bPrices) : Infinity;
          
          return aMinPrice - bMinPrice;
        }
        
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        
        case 'popularity':
          return (b.totalBookings || 0) - (a.totalBookings || 0);
        
        default: {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        }
      }
    });

    setFilteredTours(filtered);
  }, [tours, searchTerm, selectedType, selectedDifficulty, selectedCity, priceRange, sortBy]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  useEffect(() => {
    filterTours();
  }, [filterTours]);

  // Get unique cities from all tours
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

  const availableCities = getUniqueCities();

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedDifficulty("");
    setSelectedCity("");
    setPriceRange({ min: "", max: "" });
    setSortBy("createdAt");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Adventure': 'text-orange-600 bg-orange-50',
      'Cultural': 'text-purple-600 bg-purple-50',
      'Wildlife': 'text-green-600 bg-green-50',
      'Spiritual': 'text-blue-600 bg-blue-50',
      'Heritage': 'text-amber-600 bg-amber-50',
      'Beach': 'text-cyan-600 bg-cyan-50',
      'Hill Station': 'text-emerald-600 bg-emerald-50',
      'Desert': 'text-yellow-600 bg-yellow-50',
      'Backwater': 'text-teal-600 bg-teal-50',
      'Photography': 'text-pink-600 bg-pink-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  // Safe price calculation

  // Render price function (same as trek card)
  const renderPrice = (price: number, discountPrice?: number) => {
    if (discountPrice) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 line-through text-sm">₹{price}</span>
          <span className="text-sky-600 font-bold text-lg">₹{discountPrice}</span>
        </div>
      );
    }
    return <span className="text-sky-600 font-bold text-lg">₹{price}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading amazing tours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Amazing Tours
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            Explore incredible destinations with our carefully curated tour packages
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {tourTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price Low to High</option>
                <option value="rating">Highest Rated</option>
                <option value="popularity">Most Popular</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors col-span-full md:col-span-1"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTours.length} of {tours.length} tours
          </p>
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tours found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour, index) => {
              const prices = tour.cityPricing?.map(cp => Number(cp.discountPrice || cp.price)) || [];
              const minPrice = prices.length > 0 ? Math.min(...prices) : "N/A";
              
              return (
                <div 
                  key={tour._id} 
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 overflow-hidden border border-gray-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image Container with Overlay */}
                  <div className="relative overflow-hidden h-60 sm:h-72">
                    {tour.isFeatured && (
                      <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        ⭐ Featured
                      </div>
                    )}
                    
                    <img 
                      src={tour.thumbnail || "/api/placeholder/400/300"}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    
                    {/* Top badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTypeColor(tour.tourType)}`}>
                        {tour.tourType}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(tour.difficulty)}`}>
                        {tour.difficulty}
                      </span>
                    </div>

                    {/* Bottom content overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">
                        {tour.name}
                      </h2>
                      <div className="flex items-center text-white/90 text-xs sm:text-sm">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tour.location}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Tour Details Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Duration</div>
                          <div className="font-semibold">{tour.duration}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Max Group</div>
                          <div className="font-semibold">{tour.maxGroupSize || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* City Pricing */}
                    {tour.cityPricing && tour.cityPricing.filter(cp => cp.price !== null && cp.price !== undefined).length > 0 && (
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          City-wise Pricing
                        </h4>
                        <div className="space-y-2">
                          {tour.cityPricing
                            .filter(cp => cp.price !== null && cp.price !== undefined)
                            .map((cityPrice, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="font-medium text-gray-700">{cityPrice.city}</span>
                                {renderPrice(cityPrice.price, cityPrice.discountPrice)}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Highlights */}
                    {tour.highlights && (
                      <div className="bg-gradient-to-r from-sky-50 to-teal-50 p-3 sm:p-4 rounded-xl border border-sky-100">
                        <div className="flex items-center mb-2">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs sm:text-sm font-semibold text-sky-800">Highlights</span>
                        </div>
                        <div className="text-xs sm:text-sm text-sky-700 max-w-none">
                          {Array.isArray(tour.highlights) 
                            ? tour.highlights.slice(0, 3).join(', ')
                            : typeof tour.highlights === 'string' 
                              ? tour.highlights.split(',').slice(0, 3).join(', ')
                              : tour.highlights
                          }
                        </div>
                      </div>
                    )}

                    {/* CTA Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
                      <div className="w-full sm:w-auto">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide font-semibold">Starting from</p>
                        <div className="flex items-baseline gap-2">
                          {minPrice !== "N/A" ? (
                            <>
                              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">₹{minPrice}</span>
                              <span className="text-xs sm:text-sm text-gray-500 ml-1">onwards</span>
                            </>
                          ) : (
                            <span className="text-lg sm:text-xl font-bold text-gray-500">Price on request</span>
                          )}
                        </div>
                      </div>
                      
                      <Link
                        to={`/book-tour/${tour._id}`}
                        className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center group"
                      >
                        Book Now
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpComingToursPage;
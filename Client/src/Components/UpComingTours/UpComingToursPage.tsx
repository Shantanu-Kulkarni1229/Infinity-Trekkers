import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { MapPin, Users, Clock, Star, Filter, Search, ChevronDown } from "lucide-react";
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
  highlights: string;
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
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);

  const tourTypes = ['Adventure', 'Cultural', 'Wildlife', 'Spiritual', 'Heritage', 'Beach', 'Hill Station', 'Desert', 'Backwater', 'Photography'];
  const difficulties = ['Easy', 'Moderate', 'Hard'];

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tours?active=true&sortBy=${sortBy}&limit=50`);
      
      if (response.data.success) {
        setTours(response.data.data.tours);
      } else {
        toast.error("Failed to fetch tours");
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Error fetching tours");
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const filterTours = useCallback(() => {
    let filtered = [...tours];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tour =>
        tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Price range filter
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(tour => {
        const minPrice = Math.min(...tour.cityPricing.map(cp => cp.discountPrice || cp.price));
        const maxPrice = Math.max(...tour.cityPricing.map(cp => cp.discountPrice || cp.price));
        
        const min = priceRange.min ? parseInt(priceRange.min) : 0;
        const max = priceRange.max ? parseInt(priceRange.max) : Infinity;
        
        return minPrice >= min && maxPrice <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price': {
          const aPrice = Math.min(...a.cityPricing.map(cp => cp.discountPrice || cp.price));
          const bPrice = Math.min(...b.cityPricing.map(cp => cp.discountPrice || cp.price));
          return aPrice - bPrice;
        }
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return b.totalBookings - a.totalBookings;
        default: {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        }
      }
    });

    setFilteredTours(filtered);
  }, [tours, searchTerm, selectedType, selectedDifficulty, priceRange, sortBy]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  useEffect(() => {
    filterTours();
  }, [filterTours]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedDifficulty("");
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
    const colors: { [key: string]: string } = {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
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

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
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
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
            {filteredTours.map((tour) => (
              <div key={tour._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={tour.thumbnail || "/api/placeholder/400/250"}
                    alt={tour.name}
                    className="w-full h-48 object-cover"
                  />
                  {tour.isFeatured && (
                    <span className="absolute top-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                      Featured
                    </span>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(tour.tourType)}`}>
                      {tour.tourType}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(tour.difficulty)}`}>
                      {tour.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{tour.location}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {tour.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Max {tour.maxGroupSize}
                    </div>
                    {tour.rating > 0 && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        {tour.rating}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tour.description}
                  </p>

                  {tour.highlights && tour.highlights.trim() && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm text-gray-800 mb-2">Highlights:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {tour.highlights
                          .split(',')
                          .slice(0, 3)
                          .map((highlight: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              {highlight.trim()}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{Math.min(...tour.cityPricing.map(cp => cp.discountPrice || cp.price)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">per person</p>
                    </div>
                    {tour.totalBookings > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{tour.totalBookings} bookings</p>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/book-tour/${tour._id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center block font-semibold"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpComingToursPage;
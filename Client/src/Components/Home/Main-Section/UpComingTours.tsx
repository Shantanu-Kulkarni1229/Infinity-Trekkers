import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { MapPin, Clock, Users, Star, ChevronRight } from "lucide-react";

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
  highlights: string;
  rating: number;
  totalBookings: number;
  maxGroupSize: number;
  isFeatured: boolean;
}

const UpComingTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTours();
  }, []);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tours/featured?limit=6`);
      
      if (response.data.success) {
        setTours(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching featured tours:", error);
    } finally {
      setLoading(false);
    }
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
      <section className="py-16 bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upcoming Tours
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upcoming Tours
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Discover amazing destinations with our carefully curated tour packages. From cultural explorations to adventure expeditions.
          </p>
          <Link 
            to="/upcoming-tours"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
          >
            View All Tours
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tours Grid */}
        {tours.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No featured tours available at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon for exciting tour packages!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <div key={tour._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{tour.name}</h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{tour.location}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
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

                  {tour.highlights && tour.highlights.length > 0 && (
                    <div className="mb-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        {tour.highlights
                          .split(',')
                          .slice(0, 2)
                          .map((highlight: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              <span className="line-clamp-1">{highlight.trim()}</span>
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

        {/* Call to Action */}
        {tours.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              to="/upcoming-tours"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold shadow-md border border-blue-200"
            >
              Explore More Tours
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpComingTours;
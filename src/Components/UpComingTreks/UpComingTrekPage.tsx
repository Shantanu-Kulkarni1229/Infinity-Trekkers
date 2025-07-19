import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  IndianRupee,
  Calendar,
  Users,
  Mountain,
  Star,
  Heart,
  Thermometer,
  Compass,
  Camera,
  BookOpen,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react';


// Define TypeScript interfaces
export interface Trek {
  id: number;
  name: string;
  location: string;
  duration: string;
  fees: string;
  elevation: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  nextDate: string;
  highlights: string[];
  description: string;
  image: string;
  rating: number;
  reviews: number;
  badge: string;
  groupSize: string;
  temperature: string;
  bestTime: string;
  trekDistance: string;
  included: string[];
  thingsToCarry: string[];
  bookingLink: string;
}

import enhancedTrekData from '../../Data/treks.json';
import { Link } from 'react-router-dom';
const UpComingTrekPage: React.FC = () => {
  const [likedTreks, setLikedTreks] = useState<Set<number>>(new Set());
  const [selectedTrek, setSelectedTrek] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  // Filter treks based on search and difficulty
  const filteredTreks = enhancedTrekData.filter(trek => {
    const matchesSearch = trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trek.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || trek.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const toggleLike = (trekId: number): void => {
    const newLiked = new Set(likedTreks);
    if (newLiked.has(trekId)) {
      newLiked.delete(trekId);
    } else {
      newLiked.add(trekId);
    }
    setLikedTreks(newLiked);
  };

  const toggleDetails = (trekId: number): void => {
    setSelectedTrek(selectedTrek === trekId ? null : trekId);
  };

  const handleBackToHome = (): void => {
    console.log('Navigate to / route');
  };


  const handleTrekAlbum = (trekId: number): void => {
    console.log(`Navigate to trek ${trekId} photo album`);
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'bg-blue-100 text-blue-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeColor = (badge: string): string => {
    switch (badge) {
      case 'Popular': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Adventure': return 'bg-gradient-to-r from-red-500 to-orange-500';
      case 'Seasonal': return 'bg-gradient-to-r from-blue-500 to-teal-500';
      case 'Monsoon Special': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'Family Friendly': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Link
              to='/'
              onClick={handleBackToHome}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-300 font-medium"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </Link>

            {/* Title */}
            <div className="text-center flex-1 mx-2 sm:mx-4 lg:mx-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                All Treks
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                Discover {enhancedTrekData.length} amazing adventures
              </p>
            </div>

            {/* Stats */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm">
              <div className="text-center">
                <div className="text-xl xl:text-2xl font-bold text-blue-500">{filteredTreks.length}</div>
                <div className="text-gray-500 text-xs">Available</div>
              </div>
              <div className="text-center">
                <div className="text-xl xl:text-2xl font-bold text-blue-600">{likedTreks.size}</div>
                <div className="text-gray-500 text-xs">Liked</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search treks by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg text-sm sm:text-base"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="relative sm:min-w-[160px] lg:min-w-[180px]">
            <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-8 py-3 sm:py-4 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-lg appearance-none cursor-pointer text-sm sm:text-base"
            >
              <option value="All">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Challenging">Challenging</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <p className="text-gray-600 text-sm">
            Showing <span className="font-semibold text-blue-500">{filteredTreks.length}</span> of <span className="font-semibold">{enhancedTrekData.length}</span> treks
          </p>
          <div className="flex flex-wrap gap-2">
            {['Easy', 'Moderate', 'Challenging'].map(diff => (
              <span key={diff} className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(diff)}`}>
                {enhancedTrekData.filter(t => t.difficulty === diff).length} {diff}
              </span>
            ))}
          </div>
        </div>

        {/* Treks Grid */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTreks.map((trek) => (
            <div
              key={trek.id}
              className="group relative bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1 sm:hover:-translate-y-2 flex flex-col border border-white/20"
            >
              {/* Badge - Only show when details are not open */}
              {selectedTrek !== trek.id && (
                <div className={`absolute top-3 sm:top-4 left-3 sm:left-4 z-10 px-2 sm:px-3 py-1 rounded-full text-white text-xs sm:text-sm font-semibold ${getBadgeColor(trek.badge)} shadow-lg`}>
                  {trek.badge}
                </div>
              )}

              {/* Like Button - Only show when details are not open */}
              {selectedTrek !== trek.id && (
                <button
                  onClick={() => toggleLike(trek.id)}
                  className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 shadow-lg"
                >
                  <Heart
                    size={16}
                    className={`${likedTreks.has(trek.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      } transition-colors duration-300`}
                  />
                </button>
              )}

              {/* Conditional rendering based on selectedTrek */}
              {selectedTrek === trek.id ? (
                // Details View
                <div className="p-4 sm:p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg sm:text-xl text-blue-600 flex-1 pr-2">{trek.name}</h4>
                    <button
                      onClick={() => toggleDetails(trek.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                      <span className="text-gray-500 text-xl">✕</span>
                    </button>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500 flex-shrink-0" />
                        <span>Group: {trek.groupSize}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer size={16} className="text-red-500 flex-shrink-0" />
                        <span>Temp: {trek.temperature}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass size={16} className="text-purple-500 flex-shrink-0" />
                        <span>Best: {trek.bestTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500 flex-shrink-0" />
                        <span>Distance: {trek.trekDistance}</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">Included:</p>
                      <div className="flex flex-wrap gap-1">
                        {trek.included.map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">Highlights:</p>
                      <div className="flex flex-wrap gap-1">
                        {trek.highlights.map((highlight, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">Things to Carry:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {trek.thingsToCarry.slice(0, 4).map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Additional buttons in details view */}
                    <div className="space-y-3 pt-4 border-t">
                      <Link
                        to='/trek-history'
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm sm:text-base"
                      >
                        <BookOpen size={16} />
                        Trek History
                      </Link>
                      <button
                        onClick={() => handleTrekAlbum(trek.id)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-sm sm:text-base"
                      >
                        <Camera size={16} />
                        Our Album
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={trek.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
                        Join Trek
                      </button>
                    </a>
                  </div>
                </div>
              ) : (
                // Card View
                <>
                  {/* Image */}
                  <div className="relative overflow-hidden h-48 sm:h-56">
                    <img
                      src={trek.image}
                      alt={trek.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Rating */}
                    <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs sm:text-sm font-semibold">{trek.rating}</span>
                      <span className="text-xs text-gray-600">({trek.reviews})</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-500 transition-colors min-h-[2.5rem] sm:min-h-[3.5rem] flex items-center">
                      {trek.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{trek.description}</p>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="truncate">{trek.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{trek.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IndianRupee size={14} className="text-blue-500 flex-shrink-0" />
                        <span className="font-semibold">₹{trek.fees}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mountain size={14} className="text-purple-500 flex-shrink-0" />
                        <span>{trek.elevation}</span>
                      </div>
                    </div>

                    {/* Difficulty & Next Date */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(trek.difficulty)}`}>
                        {trek.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar size={12} />
                        <span className="text-xs sm:text-sm">{new Date(trek.nextDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="mb-4 sm:mb-6 flex-1">
                      <div className="flex flex-wrap gap-1">
                        {trek.highlights.slice(0, 2).map((highlight, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                        {trek.highlights.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{trek.highlights.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Always at bottom */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto">
                      <a
                        href={trek.bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base">
                          Join Trek
                        </button>
                      </a>

                      <button
                        onClick={() => toggleDetails(trek.id)}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-blue-600 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-medium text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredTreks.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <Mountain size={48} className="mx-auto text-gray-300 mb-4 sm:w-16 sm:h-16" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No treks found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpComingTrekPage;
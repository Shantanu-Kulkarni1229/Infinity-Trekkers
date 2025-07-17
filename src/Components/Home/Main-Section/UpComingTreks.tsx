import { useState } from 'react';
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
  Camera} from 'lucide-react';
import { Link } from 'react-router-dom';

import enhancedTrekData from '../../../Data/treks.json';

const UpcomingTreks = () => {
  const [likedTreks, setLikedTreks] = useState(new Set());
  const [selectedTrek, setSelectedTrek] = useState(null);

  // Only show first 4 treks 
  const displayedTreks = enhancedTrekData.slice(0, 4);

  const toggleLike = (trekId : string) => {
    const newLiked = new Set(likedTreks);
    if (newLiked.has(trekId)) {
      newLiked.delete(trekId);
    } else {
      newLiked.add(trekId);
    }
    setLikedTreks(newLiked);
  };

  const toggleDetails = (trekId: unknown) => {
    setSelectedTrek(prev => prev === trekId ? null : trekId as unknown as null);
  };



  const handleTrekAlbum = (trekId: string) => {
    // This will be connected to trek photo album
    console.log(`Navigate to trek ${trekId} photo album`);
  };

  const getDifficultyColor = (difficulty:string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-blue-100 text-blue-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeColor = (badge : string) => {
    switch (badge) {
      case 'Popular': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Adventure': return 'bg-gradient-to-r from-red-500 to-orange-500';
      case 'Seasonal': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'Monsoon Special': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'Family Friendly': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent py-6">
          Upcoming Treks
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Discover breathtaking adventures and create unforgettable memories with our carefully curated trekking experiences
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        {displayedTreks.map((trek) => (
          <div
            key={trek.id}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 flex flex-col"
          >
            {/* Badge - Only show when details are not open */}
            {selectedTrek !== trek.id && (
              <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-white text-sm font-semibold ${getBadgeColor(trek.badge)}`}>
                {trek.badge}
              </div>
            )}

            {/* Like Button - Only show when details are not open */}
            {selectedTrek !== trek.id && (
              <button
                onClick={() => toggleLike(trek.id.toString())}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300"
              >
                <Heart
                  size={20}
                  className={`${likedTreks.has(trek.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    } transition-colors duration-300`}
                />
              </button>
            )}

            {/* Conditional rendering based on selectedTrek */}
            {selectedTrek === trek.id ? (
              // Details View
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl text-blue-700">{trek.name}</h4>
                  <button
                    onClick={() => toggleDetails(trek.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      <span>Group: {trek.groupSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-red-500" />
                      <span>Temp: {trek.temperature}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Compass size={16} className="text-purple-500" />
                      <span>Best: {trek.bestTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <span>Distance: {trek.trekDistance}</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-blue-700 mb-2">Included:</p>
                    <div className="flex flex-wrap gap-1">
                      {trek.included.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-blue-700 mb-2">Highlights:</p>
                    <div className="flex flex-wrap gap-1">
                      {trek.highlights.map((highlight, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-blue-700 mb-2">Things to Carry:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {trek.thingsToCarry.slice(0, 4).map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Additional buttons in details view */}
                  <div className="space-y-3 pt-4 border-t">
                    <Link
                      to='/gallery'
                      onClick={() => {
                        handleTrekAlbum(trek.id.toString());
                        window.scrollTo(0, 0); // Scrolls to top
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
                    >
                      <Camera size={18} />
                      Our Album
                    </Link>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div>
                    <a
                      href={trek.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        Join Trek
                      </button></a></div>
                </div>
              </div>
            ) : (
              // Card View
              <>
                {/* Image */}
                <div className="relative overflow-hidden h-56">
                  <img
                    src={trek.image}
                    alt={trek.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Rating */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">{trek.rating}</span>
                    <span className="text-xs text-gray-600">({trek.reviews})</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem] flex items-center">
                    {trek.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{trek.description}</p>

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                      <a
                        href={trek.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-blue-600 hover:underline transition-colors"
                      >
                        {trek.location}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-blue-500 flex-shrink-0" />
                      <span>{trek.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IndianRupee size={16} className="text-blue-500 flex-shrink-0" />
                      <span className="font-semibold">₹{trek.fees}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mountain size={16} className="text-purple-500 flex-shrink-0" />
                      <span>{trek.elevation}</span>
                    </div>
                  </div>

                  {/* Difficulty & Next Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(trek.difficulty)}`}>
                      {trek.difficulty}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>{new Date(trek.nextDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short'
                      })}</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-6 flex-1">
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
                  <div className="flex gap-3 mt-auto">
                    <div>
                      <a
                        href={trek.bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                          Join Trek
                        </button></a></div>
                    <button
                      onClick={() => toggleDetails(trek.id)}
                      className="px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* All Treks Button */}
      <div className="flex justify-center mt-16 w-full">
        <Link
          to="/upcoming-trek"
          onClick={() => {
                        
                        window.scrollTo(0, 0); // Scrolls to top
                      }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3"
        >
          All Treks
        </Link>
      </div>
    </section>
  );
};

export default UpcomingTreks;
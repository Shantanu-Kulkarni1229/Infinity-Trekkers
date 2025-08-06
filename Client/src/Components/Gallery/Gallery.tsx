import { useState, useEffect } from 'react';
import { Search, Filter, X, Heart, Calendar, MapPin, ArrowLeft, ArrowRight, Download, Share2, Eye, Grid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Added missing imports
import galleryData from '../../Data/Gallery.json';
import { Link } from 'react-router-dom';
interface GalleryItem {
  id: string;
  trek: string;
  location: string;
  date: string;
  image: string;
}

const Gallery = () => {
  const [selectedTrek, setSelectedTrek] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'trek' | 'location'>('date');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);




  // Get unique trek names for filter
  const trekOptions = ['All', ...new Set(galleryData.map(item => item.trek))];

  // Filter and search images
  const filteredImages = galleryData
    .filter(item => {
      const matchesTrek = selectedTrek === 'All' || item.trek === selectedTrek;
      const matchesSearch = item.trek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTrek && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'trek') return a.trek.localeCompare(b.trek);
      if (sortBy === 'location') return a.location.localeCompare(b.location);
      return 0;
    });

  // Format date
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Toggle favorite
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop event from bubbling up
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  // Share image function
  const shareImage = async (image: GalleryItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${image.trek} - ${image.location}`,
          text: `Check out this amazing photo from ${image.trek} at ${image.location}!`,
          url: image.image
        });
      } else {
        await navigator.clipboard.writeText(image.image);
        alert('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(image.image);
        alert('Image URL copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Unable to share image. Please try again.');
      }
    }
  };

  // Download image function
  const downloadImage = async (image: GalleryItem) => {
    setIsDownloading(true);
    try {
      const response = await fetch(image.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.trek}_${image.location}_${image.date}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Navigate through images in modal
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;

    const currentIndex = filteredImages.findIndex(img => img.id.toString() === selectedImage.id.toString());
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filteredImages.length;
      setSelectedImage({ ...filteredImages[nextIndex], id: filteredImages[nextIndex].id.toString() });
    } else {
      const prevIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1;
      setSelectedImage({ ...filteredImages[prevIndex], id: filteredImages[prevIndex].id.toString() });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === 'ArrowRight') navigateImage('next');
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'Escape') setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, filteredImages]);

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = galleryData.map(item => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = item.image;
          img.onload = () => resolve(null);
          img.onerror = () => reject();
        });
      });

      try {
        await Promise.all(imagePromises);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading images", error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 mb-6">
              Trek Memories
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mb-6 rounded-full"></div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Journey through breathtaking landscapes and relive unforgettable adventures
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex justify-center gap-4 sm:gap-8 mt-8 flex-wrap"
          >
            <div className="text-center px-2">
              <div className="text-2xl font-bold text-blue-500">{galleryData.length}</div>
              <div className="text-sm text-gray-500">Photos</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl font-bold text-blue-600">{trekOptions.length - 1}</div>
              <div className="text-sm text-gray-500">Treks</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl font-bold text-purple-600">{favorites.size}</div>
              <div className="text-sm text-gray-500">Favorites</div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12"
        >
          <div className="max-w-6xl mx-auto">
            {/* Search and Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search treks or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all duration-300"
                />
              </div>

              {/* View Controls */}
              <div className="flex gap-2 justify-center lg:justify-start">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-gray-100'
                    }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${viewMode === 'list'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-gray-100'
                    }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="p-3 bg-white/80 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                  aria-label="Toggle filters"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200 mb-6 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Trek Filter */}
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Trek</label>
                      <div className="flex flex-wrap gap-2">
                        {trekOptions.map(trek => (
                          <button
                            key={trek}
                            onClick={() => setSelectedTrek(trek)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base ${selectedTrek === trek
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {trek}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div className="md:w-48 flex-shrink-0">
                      <div className='flex items-center justify-between mb-3'>
                        <label htmlFor="sort-select" className="block text-sm font-semibold text-gray-700">
                          Sort by
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          id="sort-select"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'date' | 'trek' | 'location')}
                          onFocus={() => setIsOpen(true)}
                          onBlur={() => setIsOpen(false)}
                          className="w-full appearance-none p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base pr-10"
                        >
                          <option value="date">Date</option>
                          <option value="trek">Trek Name</option>
                          <option value="location">Location</option>
                        </select>

                        {/* Dynamic Arrow */}
                        <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {isOpen ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>



                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Gallery Grid/List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading amazing memories...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">No images found matching your criteria</div>
            <button
              onClick={() => {
                setSelectedTrek('All');
                setSearchTerm('');
              }}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className={`max-w-7xl mx-auto ${viewMode === 'grid'
              ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8'
              : 'space-y-4 sm:space-y-6'
              }`}
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${viewMode === 'list' ? 'flex flex-col sm:flex-row gap-4 p-4 sm:p-6' : ''
                    }`}
                  onClick={() => setSelectedImage({ ...item, id: item.id.toString() })}
                >
                  {/* Image Container */}
                  <div className={`relative overflow-hidden ${viewMode === 'list' ? 'sm:w-48 h-48 sm:h-32 flex-shrink-0' : 'aspect-[4/3]'
                    }`}>
                    <img
                      src={item.image}
                      alt={`Trek photo from ${item.location}`}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Favorite Button */}
                    {/* In the gallery item */}
                    





                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-3 sm:p-4 text-white w-full">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>View Details</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`p-4 sm:p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-blue-500 transition-colors duration-300 line-clamp-1">
                        {item.trek}
                      </h3>
                    </div>

                    <div className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm">{formatDate(item.date)}</span>
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <div className="mt-3 sm:mt-4 flex gap-2 flex-wrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage({ ...item, id: item.id.toString() });
                          }}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs sm:text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareImage({ ...item, id: item.id.toString() });
                          }}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-xs sm:text-sm"
                        >
                          Share
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Enhanced Modal */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <div className="fixed inset-0 flex flex-col pt-16 pb-4 px-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-full h-full max-w-7xl mx-auto bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex-shrink-0 bg-gradient-to-r from-black/80 to-black/60 p-4 md:p-6 text-white relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{selectedImage.trek}</h2>
                        <p className="text-blue-300 text-sm md:text-base truncate">{selectedImage.location}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => toggleFavorite(e, selectedImage.id)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                          aria-label={favorites.has(selectedImage.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.has(selectedImage.id) ? 'text-red-400 fill-red-400' : 'text-white'}`} />
                        </button>
                        <button
                          onClick={() => shareImage(selectedImage)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                          aria-label="Share image"
                        >
                          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => downloadImage(selectedImage)}
                          disabled={isDownloading}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 disabled:opacity-50"
                          aria-label="Download image"
                        >
                          <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${isDownloading ? 'animate-bounce' : ''}`} />
                        </button>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                          aria-label="Close modal"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image Container */}
                  <div className="flex-1 relative bg-black flex items-center justify-center min-h-0 overflow-hidden">
                    {/* Navigation Buttons */}
                    {filteredImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateImage('prev');
                          }}
                          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 text-white"
                          aria-label="Previous image"
                        >
                          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateImage('next');
                          }}
                          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 text-white"
                          aria-label="Next image"
                        >
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </>
                    )}

                    {/* Image */}
                    <img
                      src={selectedImage.image}
                      alt={`Trek photo from ${selectedImage.location}`}
                      className="max-w-full max-h-full object-contain"
                      style={{ maxHeight: 'calc(100vh - 180px)' }}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="flex-shrink-0 p-4 md:p-6 bg-gray-50 border-t">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <span className="text-sm md:text-base">{formatDate(selectedImage.date)}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                          {selectedImage.trek}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-16 sm:mt-20 md:mt-24 text-center relative"
        >
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 mx-auto max-w-4xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                Ready for Your Next Adventure?
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of adventurers and create memories that will last a lifetime
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  className="bg-white text-gray-800 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                  aria-label="Book your trek now"
                >
                  Book Your Trek Now
                </button>
                <Link
                  to="/upcoming-trek"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="border-2 border-white text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-xl sm:rounded-2xl hover:bg-white hover:text-gray-800 transition-all duration-300 text-sm sm:text-base"
                  aria-label="View all treks"
                >
                  View All Treks
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Gallery;
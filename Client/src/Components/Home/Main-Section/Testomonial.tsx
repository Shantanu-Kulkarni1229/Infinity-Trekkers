import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface Feedback {
  _id: string;
  name: string;
  trek: { _id: string; name: string };
  date: string;
  photo?: string;
  feedback: string;
  starRating: number;
  isVisible: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const TestimonialSection = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [treks, setTreks] = useState<{ _id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    trekId: "",
    date: "",
    starRating: 0,
    feedback: "",
    photo: null as File | string | null,
  });
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [, setHoveredCard] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Toast functions
  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    const newToast = { id, type, message };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 2000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Helper function to strip HTML tags from Quill content
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Get text content without HTML tags
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Fetch feedbacks and treks
  useEffect(() => {
    fetchFeedbacks();
    fetchTreks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/feedback`);
      const visible = res.data.data.filter((f: Feedback) => f.isVisible);
      setFeedbacks(visible);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
      addToast('error', 'Failed to load testimonials. Please try again later.');
    }
  };

  const fetchTreks = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/treks`);
      setTreks(res.data.data);
    } catch (error) {
      console.error("Failed to fetch treks:", error);
      addToast('error', 'Failed to load trek options. Please refresh the page.');
    }
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('warning', 'Please select an image smaller than 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast('warning', 'Please select a valid image file.');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
        addToast('success', 'Image uploaded successfully!');
      };
      reader.onerror = () => {
        addToast('error', 'Failed to upload image. Please try again.');
      };
    }
  };

  const handleRating = (rating: number) => {
    setFormData({ ...formData, starRating: rating });
  };

  const handleFeedbackChange = (value: string) => {
    setFormData({ ...formData, feedback: value });
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name.trim()) {
      addToast('warning', 'Please enter your name.');
      return;
    }
    if (!formData.trekId) {
      addToast('warning', 'Please select a trek.');
      return;
    }
    if (!formData.date) {
      addToast('warning', 'Please select your trek date.');
      return;
    }
    if (formData.starRating === 0) {
      addToast('warning', 'Please rate your experience.');
      return;
    }
    if (!formData.feedback.trim()) {
      addToast('warning', 'Please share your feedback.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${baseUrl}/api/feedback/create`, {
        name: formData.name,
        trekId: formData.trekId,
        date: formData.date,
        starRating: formData.starRating,
        feedback: formData.feedback,
        photo: formData.photo,
      });

      setFormData({
        name: "",
        trekId: "",
        date: "",
        starRating: 0,
        feedback: "",
        photo: null,
      });
      fetchFeedbacks();
      setIsFormVisible(false);
      addToast('success', 'Your testimonial has been submitted successfully! Thank you for sharing your experience.');
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      const errorMessage = error.response?.data?.message || 'Failed to submit testimonial. Please try again.';
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Duplicate feedbacks for infinite scroll effect
  const duplicatedFeedbacks = feedbacks.length > 0 ? [...feedbacks, ...feedbacks, ...feedbacks] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Toast Component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              flex items-center p-4 rounded-lg shadow-lg backdrop-blur-md border min-w-[320px] max-w-md
              ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-50/90 border-yellow-200 text-yellow-800' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <ToastContainer />
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative min-h-screen bg-white overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-sky-100/50 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 md:w-80 h-40 sm:h-60 md:h-80 bg-blue-100/50 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 md:w-[600px] h-80 sm:h-96 md:h-[600px] bg-sky-50/50 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-sky-300/30 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  Adventure Stories
                </h2>
                <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-sky-200/30 via-sky-300/30 to-blue-200/30 blur-2xl rounded-full -z-10"></div>
              </div>
            </motion.div>
            
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
            >
              Immerse yourself in the breathtaking tales of our adventurers who conquered peaks, crossed valleys, and discovered themselves along the way
            </motion.p>
            
            <motion.div
              variants={itemVariants}
              className="flex justify-center mt-6 sm:mt-8"
            >
              <div className="flex space-x-1 sm:space-x-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Infinite Scroll Testimonials */}
          {duplicatedFeedbacks.length > 0 && (
            <motion.div 
              variants={itemVariants}
              className="relative mb-16 sm:mb-20 lg:mb-24 h-80 sm:h-88 lg:h-80"
            >
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl">
                <motion.div
                  className="flex space-x-4 sm:space-x-6 lg:space-x-8"
                  animate={{
                    x: [0, -100 * feedbacks.length + "%"]
                  }}
                  transition={{
                    x: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: feedbacks.length * 100,
                      ease: "linear",
                    },
                  }}
                  style={{ 
                    width: `${duplicatedFeedbacks.length * (window.innerWidth < 768 ? 300 : 420)}px`
                  }}
                >
                  {duplicatedFeedbacks.map((fb, idx) => (
                    <motion.div
                      key={`${fb._id}-${idx}`}
                      className="flex-shrink-0 w-72 sm:w-80 lg:w-96 group"
                      onHoverStart={() => setHoveredCard(`${fb._id}-${idx}`)}
                      onHoverEnd={() => setHoveredCard(null)}
                    >
                      <div className="relative h-72 sm:h-76 lg:h-80 bg-gradient-to-br from-sky-50/80 to-blue-50/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-sky-200/50 p-4 sm:p-6 lg:p-8 transition-all duration-500 group-hover:scale-105 group-hover:bg-sky-100/70 group-hover:shadow-2xl group-hover:shadow-sky-200/50 overflow-hidden">
                        {/* Glass morphism effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Glowing border effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-300/20 via-blue-300/20 to-sky-400/20 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                        
                        <div className="relative z-10">
                          {/* Enhanced User Info */}
                          <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                            <div className="relative">
                              {fb.photo ? (
                                <img
                                  src={fb.photo}
                                  alt={fb.name}
                                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-cyan-400/50 shadow-2xl"
                                />
                              ) : (
                                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center rounded-full text-white text-lg sm:text-xl font-bold shadow-2xl border-2 border-sky-200">
                                  {fb.name.charAt(0)}
                                </div>
                              )}
                              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 truncate">{fb.name}</h4>
                              <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-300/50 rounded-full">
                                <span className="text-xs sm:text-sm font-medium text-sky-700 truncate max-w-32 sm:max-w-40">{fb.trek?.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Star Rating */}
                          <div className="flex justify-center mb-4 sm:mb-6 space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <motion.span 
                                key={star}
                                className={`text-xl sm:text-2xl ${star <= fb.starRating ? "text-yellow-400" : "text-slate-600"}`}
                                whileHover={{ scale: 1.2, rotate: 180 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                ★
                              </motion.span>
                            ))}
                          </div>

                          {/* Enhanced Feedback Content - Using stripHtmlTags */}
                          <div className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-4 font-light">
                            {stripHtmlTags(fb.feedback)}
                          </div>

                          {/* Enhanced Date */}
                          <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-sky-200/50">
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(fb.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            <motion.div 
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full flex items-center justify-center"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <span className="text-white text-xs">✓</span>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              
              {/* Enhanced Gradient Overlays */}
              <div className="absolute left-0 top-0 w-20 sm:w-32 lg:w-40 h-full bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-20"></div>
              <div className="absolute right-0 top-0 w-20 sm:w-32 lg:w-40 h-full bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-20"></div>
            </motion.div>
          )}

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.button
              onClick={() => setIsFormVisible(!isFormVisible)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base sm:text-lg rounded-full shadow-2xl hover:shadow-sky-500/25 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center space-x-2 sm:space-x-3">
                <span>{isFormVisible ? "Hide Form" : "Share Your Story"}</span>
                <motion.span
                  animate={{ rotate: isFormVisible ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ▼
                </motion.span>
              </span>
            </motion.button>
          </motion.div>

          {/* Enhanced Feedback Form */}
          <AnimatePresence>
            {isFormVisible && (
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="max-w-5xl mx-auto"
              >
                <div className="relative bg-gradient-to-br from-sky-50/90 to-blue-50/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-sky-200/50 p-6 sm:p-8 lg:p-12 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-transparent to-blue-100/20"></div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-8 sm:mb-10">
                      <motion.h3 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"
                      >
                        Create Your Legacy
                      </motion.h3>
                      <p className="text-gray-600 text-base sm:text-lg">Transform your adventure into inspiration for future explorers</p>
                    </div>
                    
                    <form onSubmit={submitFeedback} className="space-y-6 sm:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        <motion.div 
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="space-y-3"
                        >
                          <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <span>👤</span>
                            <span>Your Name</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter your adventurer name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-3 sm:p-4 bg-white/90 border border-sky-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all outline-none backdrop-blur-sm text-sm sm:text-base"
                            required
                          />
                        </motion.div>
                        
                        <motion.div 
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-3"
                        >
                          <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <span>🏔️</span>
                            <span>Trek Experience</span>
                          </label>
                          <select
                            name="trekId"
                            value={formData.trekId}
                            onChange={handleChange}
                            className="w-full p-3 sm:p-4 bg-white/90 border border-sky-200 rounded-xl text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all outline-none backdrop-blur-sm text-sm sm:text-base"
                            required
                          >
                            <option value="" className="bg-white">Select your adventure</option>
                            {treks.map((trek) => (
                              <option key={trek._id} value={trek._id} className="bg-white">
                                {trek.name}
                              </option>
                            ))}
                          </select>
                        </motion.div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <span>📅</span>
                          <span>Adventure Date</span>
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full p-3 sm:p-4 bg-white/90 border border-sky-200 rounded-xl text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all outline-none backdrop-blur-sm text-sm sm:text-base"
                          required
                        />
                      </motion.div>

                      {/* Spectacular Star Rating */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <span>⭐</span>
                          <span>Rate Your Epic Journey</span>
                        </label>
                        <div className="flex justify-center space-x-2 sm:space-x-4 p-6 sm:p-8 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200/50">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <motion.span
                              key={star}
                              onClick={() => handleRating(star)}
                              whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                              whileTap={{ scale: 0.9 }}
                              className={`cursor-pointer text-3xl sm:text-4xl lg:text-5xl transition-all duration-300 ${
                                star <= formData.starRating 
                                  ? "text-yellow-400 filter drop-shadow-lg" 
                                  : "text-gray-300 hover:text-yellow-200"
                              }`}
                            >
                              ★
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>

                      {/* Enhanced Quill Editor */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <span>✍️</span>
                          <span>Your Epic Tale</span>
                        </label>
                        <div className="border-2 border-sky-200 rounded-xl overflow-hidden bg-white backdrop-blur-sm">
                          <ReactQuill
                            value={formData.feedback}
                            onChange={handleFeedbackChange}
                            placeholder="Paint the picture of your incredible adventure..."
                            className="text-gray-800 [&_.ql-editor]:text-gray-800 [&_.ql-editor]:min-h-[120px] sm:[&_.ql-editor]:min-h-[150px]"
                            theme="snow"
                          />
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3"
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <span>📸</span>
                          <span>Capture the Memory</span>
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full p-3 sm:p-4 bg-white/90 border-2 border-dashed border-sky-200 rounded-xl text-gray-800 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all outline-none file:mr-4 file:py-2 file:px-4 sm:file:px-6 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-sky-500 file:to-blue-600 file:text-white hover:file:from-sky-600 hover:file:to-blue-700 file:cursor-pointer file:text-xs sm:file:text-sm text-xs sm:text-base"
                          />
                          {formData.photo && (
                            <div className="mt-3">
                              <img 
                                src={formData.photo as string} 
                                alt="Preview" 
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-sky-200"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(14, 165, 233, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl font-bold text-base sm:text-lg lg:text-xl shadow-2xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10">
                          {loading ? (
                            <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                              <motion.div
                                className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              <span>Crafting Your Legacy...</span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                              <span>🚀</span>
                              <span className="text-sm sm:text-base lg:text-lg">Launch Your Story Into The World</span>
                              <span>🌟</span>
                            </span>
                          )}
                        </span>
                      </motion.button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </>
  );
};

export default TestimonialSection;
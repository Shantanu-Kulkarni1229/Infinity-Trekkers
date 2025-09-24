import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Color theme constants
const COLOR_THEME = {
  primary: {
    gradient: "from-sky-600 to-blue-700",
    light: "from-sky-50 to-blue-50",
    medium: "from-sky-400 to-blue-500"
  },
  secondary: {
    gradient: "from-emerald-500 to-teal-600",
    light: "from-emerald-50 to-teal-50"
  },
  accent: {
    gradient: "from-orange-400 to-amber-500",
    light: "from-orange-50 to-amber-50"
  }
};

const OurServices: React.FC = () => {
  const [formData, setFormData] = useState({
    destination: "",
    phoneNumber: "",
    email: "",
    name: "",
    serviceNeeded: "",
    preferredDate: "",
    groupSize: "",
    duration: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/enquiries`, formData);
      toast.success(res.data.message || "Service enquiry submitted successfully!");
      setFormData({
        destination: "",
        phoneNumber: "",
        email: "",
        name: "",
        serviceNeeded: "",
        preferredDate: "",
        groupSize: "",
        duration: "",
        message: ""
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || "Failed to submit enquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Trekking and Tourism Services
  const services = [
    {
      title: "Cab & Taxi Services",
      description: "Comfortable and reliable cab services for local transportation, airport transfers, and city tours.",
      icon: "🚗",
      gradient: "from-blue-400 to-cyan-400",
      features: ["AC & Non-AC Cabs", "24/7 Availability", "Local Drivers", "Multiple Destinations"]
    },
    {
      title: "Mini Bus Booking",
      description: "Perfect for small groups and families with spacious and comfortable mini buses for longer journeys.",
      icon: "🚐",
      gradient: "from-green-400 to-emerald-400",
      features: ["12-20 Seater", "Luggage Space", "Experienced Drivers", "Hill Station Ready"]
    },
    {
      title: "Big Bus Booking",
      description: "Ideal for large groups, corporate tours, and pilgrimage trips with luxury bus services.",
      icon: "🚌",
      gradient: "from-purple-400 to-indigo-400",
      features: ["30-50 Seater", "Luxury Coaches", "Sleeper Buses", "Entertainment Systems"]
    },
    {
      title: "Professional Guides",
      description: "Certified local guides with extensive knowledge of trekking routes, history, and culture.",
      icon: "🧭",
      gradient: "from-orange-400 to-amber-400",
      features: ["Multi-lingual", "First Aid Certified", "Local Expertise", "Cultural Knowledge"]
    },
    {
      title: "Personal Trek Planning",
      description: "Customized trekking itineraries tailored to your fitness level, preferences, and timeframe.",
      icon: "🥾",
      gradient: "from-red-400 to-pink-400",
      features: ["Custom Routes", "Fitness Assessment", "Gear Recommendations", "Safety Planning"]
    },
    {
      title: "Adventure Gear Rental",
      description: "High-quality trekking gear and equipment rental for all your adventure needs.",
      icon: "🎒",
      gradient: "from-teal-400 to-cyan-400",
      features: ["Trekking Poles", "Sleeping Bags", "Backpacks", "Safety Equipment"]
    },
    {
      title: "Camping Services",
      description: "Complete camping solutions including tents, bonfire arrangements, and camping equipment.",
      icon: "⛺",
      gradient: "from-yellow-400 to-orange-400",
      features: ["Tent Setup", "Camping Gear", "Bonfire Arrangements", "Food Services"]
    },
    {
      title: "Mountain Expeditions",
      description: "Professional mountaineering expeditions with experienced guides and support staff.",
      icon: "🏔️",
      gradient: "from-gray-400 to-blue-400",
      features: ["High Altitude", "Technical Climbing", "Expedition Planning", "Safety Protocols"]
    },
    {
      title: "Wildlife Safari Tours",
      description: "Guided wildlife safaris in national parks and wildlife sanctuaries across India.",
      icon: "🐅",
      gradient: "from-brown-400 to-green-400",
      features: ["Jeep Safaris", "Bird Watching", "Nature Walks", "Photography Tours"]
    },
    {
      title: "Cultural Heritage Tours",
      description: "Explore rich cultural heritage with guided tours to historical sites and local villages.",
      icon: "🏛️",
      gradient: "from-amber-400 to-yellow-400",
      features: ["Historical Sites", "Local Villages", "Cultural Shows", "Traditional Food"]
    },
    {
      title: "River Rafting Adventures",
      description: "Thrilling white water rafting experiences with safety equipment and professional guides.",
      icon: "🚣",
      gradient: "from-cyan-400 to-blue-400",
      features: ["Grade II-IV Rapids", "Safety Gear", "Professional Guides", "Photography"]
    },
    {
      title: "Corporate Team Building",
      description: "Adventure-based team building activities for corporate groups and organizations.",
      icon: "🤝",
      gradient: "from-indigo-400 to-purple-400",
      features: ["Team Challenges", "Leadership Activities", "Outdoor Games", "Professional Facilitation"]
    }
  ];

  // Service categories for better organization
  const serviceCategories = [
    {
      name: "Transportation",
      services: ["Cab & Taxi Services", "Mini Bus Booking", "Big Bus Booking"],
      icon: "🚗"
    },
    {
      name: "Guiding Services",
      services: ["Professional Guides", "Personal Trek Planning", "Cultural Heritage Tours"],
      icon: "🧭"
    },
    {
      name: "Adventure Activities",
      services: ["Mountain Expeditions", "River Rafting Adventures", "Wildlife Safari Tours"],
      icon: "🏔️"
    },
    {
      name: "Support Services",
      services: ["Adventure Gear Rental", "Camping Services", "Corporate Team Building"],
      icon: "🎒"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${COLOR_THEME.primary.light}`}>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Hero Section */}
      <div className={`relative bg-gradient-to-r ${COLOR_THEME.primary.gradient} text-white py-20 overflow-hidden`}>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/3 w-12 h-12 bg-white bg-opacity-10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 right-10 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Our Trekking & Tourism Services
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Complete end-to-end solutions for your travel adventures - from transportation to guided experiences
            </p>
            <div className="w-24 h-1 bg-white mx-auto rounded-full mb-8"></div>
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
              <span className="bg-white bg-opacity-20  text-blue-900 font-bold px-4 py-2 rounded-full backdrop-blur-sm">🚗 Transportation</span>
              <span className="bg-white bg-opacity-20  text-blue-900 font-bold  px-4 py-2 rounded-full backdrop-blur-sm">🧭 Guided Tours</span>
              <span className="bg-white bg-opacity-20  text-blue-900 font-bold  px-4 py-2 rounded-full backdrop-blur-sm">🏔️ Adventure</span>
              <span className="bg-white bg-opacity-20  text-blue-900 font-bold px-4 py-2 rounded-full backdrop-blur-sm">🎒 Gear Rental</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Comprehensive Service Categories
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We offer a wide range of services to make your trekking and tourism experience seamless and memorable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {serviceCategories.map((category, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${COLOR_THEME.primary.light} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{category.name}</h3>
              <ul className="space-y-2">
                {category.services.map((service, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* All Services Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            All Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Detailed overview of each service we offer to make your adventure perfect
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
            >
              <div className={`h-2 bg-gradient-to-r ${service.gradient}`}></div>
              
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${service.gradient} rounded-xl flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                      {service.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {service.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wide">Includes:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-xs text-gray-600">
                        <div className={`w-1.5 h-1.5 bg-gradient-to-r ${service.gradient} rounded-full mr-2 flex-shrink-0`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className={`bg-gradient-to-r ${COLOR_THEME.primary.gradient} rounded-3xl p-8 md:p-12 text-white mb-20 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mt-20 -mr-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-5 rounded-full -mb-16 -ml-16"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Infinity Trekkers?</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
                <div className="text-sm md:text-base text-blue-100">Happy Travelers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">200+</div>
                <div className="text-sm md:text-base text-blue-100">Destinations Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">15+</div>
                <div className="text-sm md:text-base text-blue-100">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
                <div className="text-sm md:text-base text-blue-100">Customer Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enquiry Form Section */}
        <div id="service-enquiry" className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200 rounded-full -mt-16 -mr-16 opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-300 rounded-full -mb-12 -ml-12 opacity-20"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Get Your Customized Package
              </h2>
              <p className="text-lg text-gray-600">
                Tell us about your travel plans and we'll create a perfect package for you
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Destination */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Destination *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                    placeholder="Where do you want to go?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Needed */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Service Needed *
                  </label>
                  <select
                    name="serviceNeeded"
                    value={formData.serviceNeeded}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white"
                  >
                    <option value="">Select a service</option>
                    {services.map((service, index) => (
                      <option key={index} value={service.title}>{service.title}</option>
                    ))}
                    <option value="Multiple Services">Multiple Services</option>
                    <option value="Custom Package">Custom Package</option>
                  </select>
                </div>

                {/* Group Size */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Group Size
                  </label>
                  <select
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white"
                  >
                    <option value="">Select group size</option>
                    <option value="1-2">1-2 People</option>
                    <option value="3-5">3-5 People</option>
                    <option value="6-10">6-10 People</option>
                    <option value="11-20">11-20 People</option>
                    <option value="20+">20+ People</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                    placeholder="Your phone number"
                  />
                </div>

                {/* Email */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferred Date */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                  />
                </div>

                {/* Duration */}
                <div className="group">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">
                    Trip Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300 appearance-none bg-white"
                  >
                    <option value="">Select duration</option>
                    <option value="1-3 days">1-3 Days</option>
                    <option value="4-7 days">4-7 Days</option>
                    <option value="8-14 days">8-14 Days</option>
                    <option value="15+ days">15+ Days</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="group">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Additional Requirements
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-300"
                  placeholder="Any specific requirements or special requests..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-gradient-to-r ${COLOR_THEME.primary.gradient} text-white px-12 py-4 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting Request...
                    </span>
                  ) : (
                    "Get Your Custom Quote"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Need Immediate Assistance?</h3>
          <p className="text-gray-600 mb-6">Our travel experts are available 24/7 to help you plan your perfect adventure</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-gradient-to-r ${COLOR_THEME.secondary.gradient} rounded-full flex items-center justify-center mr-3`}>
                <span className="text-white font-bold">📞</span>
              </div>
              <span className="text-gray-700 font-medium">+91 98765 43210</span>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-gradient-to-r ${COLOR_THEME.accent.gradient} rounded-full flex items-center justify-center mr-3`}>
                <span className="text-white font-bold">✉️</span>
              </div>
              <span className="text-gray-700 font-medium">info@infinitytrekkers.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurServices;
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { MapPin, Clock, Users, Calendar, Star, ChevronDown, ChevronUp, Phone, User } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

interface Tour {
  _id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  tourType: string;
  highlights: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  thumbnail: string;
  images: string[];
  cityPricing: CityPricing[];
  maxGroupSize: number;
  rating: number;
  totalBookings: number;
  cancellationPolicy: string;
  bestTimeToVisit: string;
}

interface CityPricing {
  city: string;
  price: number;
  discountPrice?: number;
}

interface BookingFormData {
  // Personal Details
  personalDetails: {
    name: string;
    email: string;
    phone: string;
    age: number;
    gender: string;
    occupation: string;
  };
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  // Emergency Contact
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Booking Details
  bookingDetails: {
    tourDate: string;
    departureCity: string;
    specialRequests: string;
    medicalConditions: string;
    experienceLevel: string;
  };
  // Additional Members
  additionalMembers: Array<{
    name: string;
    age: number;
    gender: string;
    relation: string;
  }>;
}

const BookTour = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingProcessing, setBookingProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState<boolean>(false);
  const [showAdditionalMembers, setShowAdditionalMembers] = useState<boolean>(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BookingFormData>({
    personalDetails: {
      name: "",
      email: "",
      phone: "",
      age: 0,
      gender: "",
      occupation: ""
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: ""
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    bookingDetails: {
      tourDate: "",
      departureCity: "",
      specialRequests: "",
      medicalConditions: "",
      experienceLevel: ""
    },
    additionalMembers: []
  });

  // Fetch tour details
  useEffect(() => {
    const fetchTourDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tours/${tourId}`);
        const data = await response.json();

        if (data.success) {
          setTour(data.data.tour);
          setDepartureCities(data.data.departureCities || []);
          
          // Set initial price if cities available
          if (data.data.tour.cityPricing.length > 0) {
            const firstCity = data.data.tour.cityPricing[0];
            setFinalPrice(firstCity.discountPrice || firstCity.price);
          }
        } else {
          setError("Tour not found");
          toast.error("Tour not found");
        }
      } catch (error) {
        console.error("Error fetching tour:", error);
        setError("Failed to load tour details");
        toast.error("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };

    if (tourId) {
      fetchTourDetails();
    }
  }, [tourId]);

  // Calculate price when departure city changes
  useEffect(() => {
    if (tour && formData.bookingDetails.departureCity) {
      const cityPricing = tour.cityPricing.find(cp => cp.city === formData.bookingDetails.departureCity);
      if (cityPricing) {
        const pricePerPerson = cityPricing.discountPrice || cityPricing.price;
        const totalMembers = 1 + formData.additionalMembers.length;
        const baseAmount = pricePerPerson * totalMembers;
        const gstAmount = baseAmount * 0.18; // 18% GST
        setFinalPrice(baseAmount + gstAmount);
      }
    }
  }, [formData.bookingDetails.departureCity, formData.additionalMembers, tour]);

  const handleInputChange = (
    section: keyof BookingFormData,  
    field: string, 
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addAdditionalMember = () => {
    if (formData.additionalMembers.length < 9) { // Max 10 total including primary
      setFormData(prev => ({
        ...prev,
        additionalMembers: [
          ...prev.additionalMembers,
          { name: "", age: 0, gender: "", relation: "" }
        ]
      }));
    }
  };

  const removeAdditionalMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalMembers: prev.additionalMembers.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalMember = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      additionalMembers: prev.additionalMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const validateForm = (): boolean => {
    const { personalDetails, address, emergencyContact, bookingDetails } = formData;

    // Personal Details validation
    if (!personalDetails.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!personalDetails.email.trim() || !personalDetails.email.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (!personalDetails.phone.trim() || personalDetails.phone.length !== 10) {
      toast.error("Valid 10-digit phone number is required");
      return false;
    }
    if (!personalDetails.age || personalDetails.age < 5 || personalDetails.age > 100) {
      toast.error("Age must be between 5 and 100");
      return false;
    }
    if (!personalDetails.gender) {
      toast.error("Gender is required");
      return false;
    }

    // Address validation
    if (!address.street.trim()) {
      toast.error("Street address is required");
      return false;
    }
    if (!address.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!address.state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!address.pincode.trim() || address.pincode.length !== 6) {
      toast.error("Valid 6-digit pincode is required");
      return false;
    }

    // Emergency Contact validation
    if (!emergencyContact.name.trim()) {
      toast.error("Emergency contact name is required");
      return false;
    }
    if (!emergencyContact.phone.trim() || emergencyContact.phone.length !== 10) {
      toast.error("Valid emergency contact phone is required");
      return false;
    }
    if (!emergencyContact.relationship.trim()) {
      toast.error("Emergency contact relationship is required");
      return false;
    }

    // Booking Details validation
    if (!bookingDetails.tourDate) {
      toast.error("Tour date is required");
      return false;
    }
    
    const tourDate = new Date(bookingDetails.tourDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    
    if (tourDate < minDate) {
      toast.error("Tour must be booked at least 3 days in advance");
      return false;
    }

    if (!bookingDetails.departureCity) {
      toast.error("Departure city is required");
      return false;
    }

    // Additional members validation
    for (let i = 0; i < formData.additionalMembers.length; i++) {
      const member = formData.additionalMembers[i];
      if (!member.name.trim()) {
        toast.error(`Additional member ${i + 1} name is required`);
        return false;
      }
      if (!member.age || member.age < 5 || member.age > 100) {
        toast.error(`Additional member ${i + 1} age must be between 5 and 100`);
        return false;
      }
      if (!member.gender) {
        toast.error(`Additional member ${i + 1} gender is required`);
        return false;
      }
      if (!member.relation.trim()) {
        toast.error(`Additional member ${i + 1} relation is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!tour) {
      toast.error("Tour information not available");
      return;
    }

    setBookingProcessing(true);

    try {
      const bookingData = {
        tourId: tour._id,
        ...formData
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tours/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tour booking submitted successfully! You will receive confirmation emails shortly.");
        
        // Redirect to booking confirmation page or home
        setTimeout(() => {
          navigate(`/booking-confirmation/${data.data.bookingReference}`);
        }, 2000);
      } else {
        toast.error(data.message || "Failed to submit booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setBookingProcessing(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Adventure': 'text-orange-600 bg-orange-50 border-orange-200',
      'Cultural': 'text-purple-600 bg-purple-50 border-purple-200',
      'Wildlife': 'text-green-600 bg-green-50 border-green-200',
      'Spiritual': 'text-blue-600 bg-blue-50 border-blue-200',
      'Heritage': 'text-amber-600 bg-amber-50 border-amber-200',
      'Beach': 'text-cyan-600 bg-cyan-50 border-cyan-200',
      'Hill Station': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Desert': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Backwater': 'text-teal-600 bg-teal-50 border-teal-200',
      'Photography': 'text-pink-600 bg-pink-50 border-pink-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading tour details...</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tour Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/upcoming-tours")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 py-8">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Tour Header */}
          <div className="relative">
            <img
              src={tour.thumbnail || "/api/placeholder/1200/400"}
              alt={tour.name}
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <div className="flex gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(tour.tourType)}`}>
                    {tour.tourType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(tour.difficulty)}`}>
                    {tour.difficulty}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{tour.name}</h1>
                <div className="flex items-center gap-6 text-lg">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {tour.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    {tour.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Max {tour.maxGroupSize}
                  </div>
                  {tour.rating > 0 && (
                    <div className="flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-400" />
                      {tour.rating}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
            {/* Tour Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">About This Tour</h3>
                <div className={`text-gray-700 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {tour.description}
                </div>
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                  {isDescriptionExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>
              </div>

              {/* Highlights */}
              {tour.highlights && tour.highlights.trim() && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-blue-800">Tour Highlights</h3>
                  <ul className="space-y-2">
                    {(isHighlightsExpanded 
                      ? tour.highlights.split(',') 
                      : tour.highlights.split(',').slice(0, 4)
                    ).map((highlight: string, index: number) => (
                      <li key={index} className="flex items-start text-blue-700">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        {highlight.trim()}
                      </li>
                    ))}
                  </ul>
                  {tour.highlights.split(',').length > 4 && (
                    <button
                      onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      {isHighlightsExpanded ? 'Show Less' : `Show ${tour.highlights.split(',').length - 4} More`}
                      {isHighlightsExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                  )}
                </div>
              )}

              {/* Inclusions/Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tour.inclusions && tour.inclusions.length > 0 && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-green-800">Inclusions</h3>
                    <ul className="space-y-2">
                      {tour.inclusions.map((inclusion, index) => (
                        <li key={index} className="flex items-start text-green-700">
                          <span className="text-green-500 mr-2 mt-1">✓</span>
                          {inclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {tour.exclusions && tour.exclusions.length > 0 && (
                  <div className="bg-red-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-red-800">Exclusions</h3>
                    <ul className="space-y-2">
                      {tour.exclusions.map((exclusion, index) => (
                        <li key={index} className="flex items-start text-red-700">
                          <span className="text-red-500 mr-2 mt-1">✗</span>
                          {exclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Itinerary */}
              {tour.itinerary && tour.itinerary.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Itinerary</h3>
                  <div className="space-y-4">
                    {tour.itinerary.map((day, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800">Day {day.day}: {day.title}</h4>
                        <p className="text-gray-600 mt-1">{day.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-100 sticky top-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₹{finalPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Total amount (including GST)
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Details */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Personal Details
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={formData.personalDetails.name}
                        onChange={(e) => handleInputChange('personalDetails', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={formData.personalDetails.email}
                        onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={formData.personalDetails.phone}
                        onChange={(e) => handleInputChange('personalDetails', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={10}
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Age *"
                          value={formData.personalDetails.age || ''}
                          onChange={(e) => handleInputChange('personalDetails', 'age', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="5"
                          max="100"
                          required
                        />
                        <select
                          value={formData.personalDetails.gender}
                          onChange={(e) => handleInputChange('personalDetails', 'gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Gender *</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Occupation (Optional)"
                        value={formData.personalDetails.occupation}
                        onChange={(e) => handleInputChange('personalDetails', 'occupation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Address
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Street Address *"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="City *"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          placeholder="State *"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Pincode *"
                        value={formData.address.pincode}
                        onChange={(e) => handleInputChange('address', 'pincode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Emergency Contact
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Emergency Contact Name *"
                        value={formData.emergencyContact.name}
                        onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="tel"
                          placeholder="Phone Number *"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={10}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Relationship *"
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking Details
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="date"
                        value={formData.bookingDetails.tourDate}
                        onChange={(e) => handleInputChange('bookingDetails', 'tourDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        required
                      />
                      <select
                        value={formData.bookingDetails.departureCity}
                        onChange={(e) => handleInputChange('bookingDetails', 'departureCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Departure City *</option>
                        {departureCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <select
                        value={formData.bookingDetails.experienceLevel}
                        onChange={(e) => handleInputChange('bookingDetails', 'experienceLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Experience Level (Optional)</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <textarea
                        placeholder="Medical Conditions (Optional)"
                        value={formData.bookingDetails.medicalConditions}
                        onChange={(e) => handleInputChange('bookingDetails', 'medicalConditions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        maxLength={500}
                      />
                      <textarea
                        placeholder="Special Requests (Optional)"
                        value={formData.bookingDetails.specialRequests}
                        onChange={(e) => handleInputChange('bookingDetails', 'specialRequests', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </div>

                  {/* Additional Members */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-800 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Additional Members ({formData.additionalMembers.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAdditionalMembers(!showAdditionalMembers)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showAdditionalMembers ? 'Hide' : 'Add Members'}
                      </button>
                    </div>
                    
                    {showAdditionalMembers && (
                      <div className="space-y-4">
                        {formData.additionalMembers.map((member, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">Member {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeAdditionalMember(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Name *"
                                value={member.name}
                                onChange={(e) => updateAdditionalMember(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="number"
                                  placeholder="Age *"
                                  value={member.age || ''}
                                  onChange={(e) => updateAdditionalMember(index, 'age', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  min="5"
                                  max="100"
                                  required
                                />
                                <select
                                  value={member.gender}
                                  onChange={(e) => updateAdditionalMember(index, 'gender', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  required
                                >
                                  <option value="">Gender *</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Relation *"
                                  value={member.relation}
                                  onChange={(e) => updateAdditionalMember(index, 'relation', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {formData.additionalMembers.length < 9 && (
                          <button
                            type="button"
                            onClick={addAdditionalMember}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                          >
                            + Add Another Member
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <span>{1 + formData.additionalMembers.length}</span>
                      </div>
                      {formData.bookingDetails.departureCity && (
                        <>
                          <div className="flex justify-between">
                            <span>Price per person:</span>
                            <span>₹{tour.cityPricing.find(cp => cp.city === formData.bookingDetails.departureCity)?.discountPrice || tour.cityPricing.find(cp => cp.city === formData.bookingDetails.departureCity)?.price || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base amount:</span>
                            <span>₹{Math.round(finalPrice / 1.18).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST (18%):</span>
                            <span>₹{Math.round(finalPrice - (finalPrice / 1.18)).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total Amount:</span>
                        <span>₹{finalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={bookingProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingProcessing ? "Processing..." : "Submit Booking Request"}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    * This is a booking request. Our team will contact you for confirmation and payment details.
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookTour;
import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import axios, { type AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type ItemForm = {
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  specialType: string;
  highlights: string[];
};

type CityPricing = {
  city: string;
  price: string;
  discountPrice: string;
};

type MemberDiscountRule = {
  label: string;
  minMembers: string;
  discountType: "percentage" | "perPerson";
  discountValue: string;
};

type ItineraryItem = {
  day: string;
  title: string;
  description: string;
  meals: string;
  accommodation: string;
};

type CarryItem = {
  item: string;
  details: string;
  required: boolean;
};

type PickupLocation = {
  city: string;
  location: string;
  pickupTime: string;
  notes: string;
};

type DateWindow = {
  label: string;
  startDate: string;
  endDate: string;
};

const cities = ["Chh. Sambhajinagar", "Pune", "Mumbai"] as const;
const difficulties = ["Easy", "Moderate", "Hard"] as const;
const specialTypes = [
  "Pre Monsoon Special",
  "Fireflies Festival Special",
  "Technical Treks",
  "Waterfall Treks",
  "Jungle Treks",
  "Outdoor Camping",
  "One Day Treks",
] as const;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "align",
  "list",
  "link",
];

const AddTrek = () => {
  const [form, setForm] = useState<ItemForm>({
    name: "",
    description: "",
    location: "",
    duration: "",
    difficulty: "Moderate",
    specialType: "Technical Treks",
    highlights: [],
  });

  const [itemType, setItemType] = useState<"trek" | "tour">("trek");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [cityPricing, setCityPricing] = useState<CityPricing[]>(
    cities.map((city) => ({ city, price: "", discountPrice: "" }))
  );
  const [memberDiscountRules, setMemberDiscountRules] = useState<MemberDiscountRule[]>([
    { label: "", minMembers: "", discountType: "percentage", discountValue: "" },
  ]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { day: "1", title: "", description: "", meals: "", accommodation: "" },
  ]);
  const [thingsToCarry, setThingsToCarry] = useState<CarryItem[]>([
    { item: "", details: "", required: true },
  ]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([
    { city: "Chh. Sambhajinagar", location: "", pickupTime: "", notes: "" },
  ]);
  const [dateWindows, setDateWindows] = useState<DateWindow[]>([
    { label: "Batch 1", startDate: "", endDate: "" },
  ]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentStep] = useState<number>(1);
  const navigate = useNavigate();

  const descriptionModules = useMemo(() => quillModules, []);
  const itineraryModules = useMemo(() => quillModules, []);

  const handlePricingChange = (
    index: number,
    field: keyof CityPricing,
    value: string
  ) => {
    const updated = [...cityPricing];
    updated[index] = { ...updated[index], [field]: value };
    setCityPricing(updated);
  };

  const handleMemberDiscountChange = (
    index: number,
    field: keyof MemberDiscountRule,
    value: string
  ) => {
    const updated = [...memberDiscountRules];
    updated[index] = { ...updated[index], [field]: value };
    setMemberDiscountRules(updated);
  };

  const handleItineraryChange = (
    index: number,
    field: keyof ItineraryItem,
    value: string
  ) => {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  };

  const handleCarryChange = (
    index: number,
    field: keyof CarryItem,
    value: string | boolean
  ) => {
    const updated = [...thingsToCarry];
    updated[index] = { ...updated[index], [field]: value } as CarryItem;
    setThingsToCarry(updated);
  };

  const handlePickupChange = (
    index: number,
    field: keyof PickupLocation,
    value: string
  ) => {
    const updated = [...pickupLocations];
    updated[index] = { ...updated[index], [field]: value };
    setPickupLocations(updated);
  };

  const handleDateWindowChange = (
    index: number,
    field: keyof DateWindow,
    value: string
  ) => {
    const updated = [...dateWindows];
    updated[index] = { ...updated[index], [field]: value };
    setDateWindows(updated);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!thumbnail) {
      setError("Thumbnail is required");
      setIsSubmitting(false);
      return;
    }

    // Validate that at least one date window is provided
    const validDateWindows = dateWindows.filter(dw => dw.startDate && dw.endDate);
    if (validDateWindows.length === 0) {
      setError("At least one date window with start and end date is required");
      setIsSubmitting(false);
      return;
    }

    // Validate that at least one city has pricing
    const citiesWithPricing = cityPricing.filter(cp => cp.price && cp.price !== "" && parseFloat(cp.price) > 0);
    if (citiesWithPricing.length === 0) {
      setError(`At least one city must have confirmed pricing for the ${itemType} to be available`);
      setIsSubmitting(false);
      return;
    }

    const sanitizedMemberDiscountRules = memberDiscountRules
      .map((rule) => ({
        label: rule.label.trim(),
        minMembers: parseInt(rule.minMembers) || 0,
        discountType: rule.discountType,
        discountValue: parseFloat(rule.discountValue) || 0,
      }))
      .filter((rule) => rule.minMembers > 0 && rule.discountValue > 0)
      .filter((rule, index, array) => array.findIndex((item) => item.minMembers === rule.minMembers) === index)
      .sort((left, right) => left.minMembers - right.minMembers)
      ;

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("location", form.location);
      fd.append("duration", form.duration);
      fd.append("difficulty", form.difficulty);
      fd.append("specialType", form.specialType);
      // Use the first valid date window as startDate and endDate
      fd.append("startDate", validDateWindows[0].startDate);
      fd.append("endDate", validDateWindows[validDateWindows.length - 1].endDate);
      fd.append("highlights", JSON.stringify(form.highlights.filter(h => h.trim())));
      fd.append("cityPricing", JSON.stringify(cityPricing));
      fd.append("memberDiscountRules", JSON.stringify(sanitizedMemberDiscountRules));
      fd.append("dateWindows", JSON.stringify(validDateWindows));
      fd.append("itinerary", JSON.stringify(itinerary));
      fd.append("thingsToCarry", JSON.stringify(thingsToCarry));
      fd.append("pickupLocations", JSON.stringify(pickupLocations));
      fd.append("thumbnail", thumbnail);

      const endpoint = itemType === "trek" ? "treks" : "tours";
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/${endpoint}/add`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-admin-key": localStorage.getItem("adminKey") || "",
          },
        }
      );

      // Success feedback
      setError("");
      alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added successfully!`);
      navigate("/admin/dashboard/manage");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setThumbnailPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview("");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200";
      case "Moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const steps = [
    { id: 1, name: "Basic Info", icon: "📝" },
    { id: 2, name: "Details", icon: "🏔️" },
    { id: 3, name: "Pricing", icon: "💰" },
    { id: 4, name: "Media", icon: "📸" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</h1>
              <p className="text-gray-600 mt-1">Create an amazing {itemType} experience for adventurers</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${currentStep >= step.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}
                `}>
                  <span className="text-lg">{step.icon}</span>
                  <span className="hidden sm:inline">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-blue-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-5 h-5 text-red-500 mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Basic Information Section */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Item Type Selection */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="relative">
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value as "trek" | "tour")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    >
                      <option value="trek">🏔️ Trek</option>
                      <option value="tour">🚌 Tour</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Item Name */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Title *
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter ${itemType} title`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter ${itemType} location`}
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 2 Days 1 Night"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <div className="relative">
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none ${getDifficultyColor(form.difficulty)}`}
                    >
                      {difficulties.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Special Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <span>✨</span>
                      Special Type *
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.specialType}
                      onChange={(e) => setForm({ ...form, specialType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    >
                      {specialTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Dates */}
              </div>
            </div>

            {/* Description Section */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{itemType === "trek" ? "🏔️" : "🚌"}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{itemType.charAt(0).toUpperCase() + itemType.slice(1)} Details</h2>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Description *
                  </label>
                  <div className="overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
                    <ReactQuill
                      theme="snow"
                      value={form.description}
                      onChange={(value) => setForm({ ...form, description: value })}
                      modules={descriptionModules}
                      formats={quillFormats}
                      placeholder={`Describe the ${itemType} experience, route, and what makes it special...`}
                      className="bg-white"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Use bold, italic, lists, and alignment to format the trek details.
                  </p>
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Highlights *
                  </label>
                  <div className="space-y-3">
                    {form.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xl text-blue-600 flex-shrink-0">•</span>
                        <input
                          type="text"
                          placeholder={`Highlight ${index + 1}`}
                          value={highlight}
                          onChange={(e) => {
                            const updated = [...form.highlights];
                            updated[index] = e.target.value;
                            setForm({ ...form, highlights: updated });
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.highlights.filter((_, i) => i !== index);
                            setForm({ ...form, highlights: updated });
                          }}
                          className="px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium text-sm flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, highlights: [...form.highlights, ""] });
                      }}
                      className="w-full px-4 py-3 border-2 border-dashed border-blue-400 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Highlight
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Add each highlight as a separate bullet point. Fill all fields before submitting.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Date Windows</h2>
                  <p className="text-sm text-gray-600 mt-1">Add all available date batches for this {itemType}</p>
                </div>
              </div>

              <div className="space-y-4">
                {dateWindows.map((window, index) => (
                  <div key={`date-window-${index}`} className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-gray-900">Batch {index + 1}</h3>
                      </div>
                      {dateWindows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDateWindows(dateWindows.filter((_, itemIndex) => itemIndex !== index))}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="e.g. Batch 1, Batch 2, etc."
                        value={window.label}
                        onChange={(event) => handleDateWindowChange(index, "label", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">📍</span>
                        </div>
                        <input
                          type="date"
                          value={window.startDate}
                          onChange={(event) => handleDateWindowChange(index, "startDate", event.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">📍</span>
                        </div>
                        <input
                          type="date"
                          value={window.endDate}
                          onChange={(event) => handleDateWindowChange(index, "endDate", event.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setDateWindows([
                    ...dateWindows,
                    { label: `Batch ${dateWindows.length + 1}`, startDate: "", endDate: "" },
                  ])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-sm font-medium hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
                >
                  + Add Date Window
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-b border-gray-100 bg-slate-50/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Day Wise Itinerary</h2>
                  <p className="text-sm text-gray-600 mt-1">Add multiple days with descriptions, meals, and stay details</p>
                </div>
              </div>

              <div className="space-y-4">
                {itinerary.map((day, index) => (
                  <div key={`itinerary-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-gray-900">Day {index + 1}</h3>
                      </div>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItinerary(itinerary.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        min="1"
                        placeholder="Day number"
                        value={day.day}
                        onChange={(event) => handleItineraryChange(index, "day", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Day title"
                        value={day.title}
                        onChange={(event) => handleItineraryChange(index, "title", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Day description</label>
                        <ReactQuill
                          theme="snow"
                          value={day.description}
                          onChange={(value) => handleItineraryChange(index, "description", value)}
                          modules={itineraryModules}
                          formats={quillFormats}
                          className="bg-white rounded-lg"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Meals included"
                        value={day.meals}
                        onChange={(event) => handleItineraryChange(index, "meals", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Accommodation"
                        value={day.accommodation}
                        onChange={(event) => handleItineraryChange(index, "accommodation", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setItinerary([
                    ...itinerary,
                    { day: String(itinerary.length + 1), title: "", description: "", meals: "", accommodation: "" },
                  ])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100"
                >
                  + Add Day
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎒</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Things to Carry</h2>
                  <p className="text-sm text-gray-600 mt-1">Add a detailed packing checklist</p>
                </div>
              </div>

              <div className="space-y-4">
                {thingsToCarry.map((carry, index) => (
                  <div key={`carry-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                      </div>
                      {thingsToCarry.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setThingsToCarry(thingsToCarry.filter((_, itemIndex) => itemIndex !== index))}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={carry.item}
                        onChange={(event) => handleCarryChange(index, "item", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <label className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={carry.required}
                          onChange={(event) => handleCarryChange(index, "required", event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">✅ Required item</span>
                      </label>
                      <textarea
                        placeholder="Details or instructions"
                        value={carry.details}
                        onChange={(event) => handleCarryChange(index, "details", event.target.value)}
                        className="w-full md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setThingsToCarry([...thingsToCarry, { item: "", details: "", required: true }])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-all duration-200"
                >
                  + Add Carry Item
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-b border-gray-100 bg-slate-50/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🚌</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Pickup Locations</h2>
                  <p className="text-sm text-gray-600 mt-1">Add multiple pickup points with timing details for each city</p>
                </div>
              </div>

              <div className="space-y-4">
                {pickupLocations.map((pickup, index) => (
                  <div key={`pickup-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                          {index + 1}
                        </div>
                        <h3 className="font-medium text-gray-900">Pickup {index + 1}</h3>
                      </div>
                      {pickupLocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPickupLocations(pickupLocations.filter((_, itemIndex) => itemIndex !== index))}
                          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={pickup.city}
                        onChange={(event) => handlePickupChange(index, "city", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Pickup location"
                        value={pickup.location}
                        onChange={(event) => handlePickupChange(index, "location", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Pickup time e.g. 06:30 AM"
                        value={pickup.pickupTime}
                        onChange={(event) => handlePickupChange(index, "pickupTime", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Optional notes"
                        value={pickup.notes}
                        onChange={(event) => handlePickupChange(index, "notes", event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setPickupLocations([
                    ...pickupLocations,
                    { city: "Chh. Sambhajinagar", location: "", pickupTime: "", notes: "" },
                  ])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-all duration-200"
                >
                  + Add Pickup Location
                </button>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Departure Cities & Pricing</h2>
                  <p className="text-sm text-gray-600 mt-1">Only cities with confirmed prices will be available for booking</p>
                  <p className="text-xs text-amber-600 mt-1">⚠️ Leave empty if {itemType} doesn't operate from that city</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityPricing.map((cp, index) => (
                  <div key={cp.city} className={`rounded-xl p-4 border transition-all duration-200 ${
                    cp.price && cp.price !== "" ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        cp.price && cp.price !== "" ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`text-xs font-bold ${
                          cp.price && cp.price !== "" ? 'text-green-600' : 'text-red-600'
                        }`}>{cp.city[0]}</span>
                      </div>
                      <h3 className="font-medium text-gray-900">{cp.city}</h3>
                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                        cp.price && cp.price !== "" 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {cp.price && cp.price !== "" ? '✓ Active' : '✗ Disabled'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Regular Price 
                          <span className="text-xs text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                          <input
                            type="number"
                            placeholder="Enter price to enable this city"
                            value={cp.price}
                            onChange={(e) =>
                              handlePricingChange(index, "price", e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        {!cp.price || cp.price === "" ? (
                          <p className="text-xs text-gray-500 mt-1">This city will not be available for booking</p>
                        ) : (
                          <p className="text-xs text-green-600 mt-1">✓ Available for booking</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount Price
                          <span className="text-xs text-gray-400 ml-1">(Optional)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                          <input
                            type="number"
                            placeholder="Leave empty for no discount"
                            value={cp.discountPrice}
                            onChange={(e) =>
                              handlePricingChange(index, "discountPrice", e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Discount Section */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Member Discount Rules</h2>
                  <p className="text-sm text-gray-600 mt-1">Add multiple tiers like 5+ members = 10% off or 10+ members = ₹100 off per person</p>
                </div>
              </div>

              <div className="space-y-4">
                {memberDiscountRules.map((rule, index) => (
                  <div key={index} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium text-emerald-900">Tier {index + 1}</h3>
                      {memberDiscountRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMemberDiscountRules((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-sm font-medium text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Label e.g. 5+ members"
                        value={rule.label}
                        onChange={(e) => handleMemberDiscountChange(index, "label", e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Min members"
                        value={rule.minMembers}
                        onChange={(e) => handleMemberDiscountChange(index, "minMembers", e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <select
                        value={rule.discountType}
                        onChange={(e) => handleMemberDiscountChange(index, "discountType", e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        <option value="percentage">Percentage off</option>
                        <option value="perPerson">₹ off per person</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder={rule.discountType === "percentage" ? "10" : "100"}
                        value={rule.discountValue}
                        onChange={(e) => handleMemberDiscountChange(index, "discountValue", e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <p className="text-xs text-emerald-700">
                      Example: {rule.minMembers || "5"}+ members gets {rule.discountValue || "10"}{rule.discountType === "percentage" ? "%" : "₹"} off
                    </p>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setMemberDiscountRules((prev) => ([...prev, { label: "", minMembers: "", discountType: "percentage", discountValue: "" }]))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-all duration-200"
                >
                  + Add Discount Tier
                </button>
              </div>
            </div>

            {/* Media Section */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📸</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Media Upload</h2>
                  <p className="text-sm text-gray-600 mt-1">Upload a stunning thumbnail image for your {itemType}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Thumbnail *
                </label>
                
                {!thumbnailPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    <div className="mt-4 flex justify-center">
                      <label className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                        📷 Choose Image
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="sr-only"
                          required
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-64 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">✨ Ready to publish?</span> Make sure all required fields are filled.
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-8 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2
                ${isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Adding {itemType.charAt(0).toUpperCase() + itemType.slice(1)}...
                </>
              ) : (
                <>
                  🚀 Add {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrek;
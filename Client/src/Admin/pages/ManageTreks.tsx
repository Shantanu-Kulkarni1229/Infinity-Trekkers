import  { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type CityPricing = {
  city: string;
  price: number;
  discountPrice?: number;
};

type DateWindow = {
  label: string;
  startDate: string;
  endDate: string;
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

type Item = {
  _id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  specialType?: string;
  startDate: string;
  endDate: string;
  highlights?: string[];
  dateWindows?: Array<{
    label?: string;
    startDate: string;
    endDate: string;
  }>;
  isActive: boolean;
  thumbnail: string;
  cityPricing?: CityPricing[];
  itinerary?: ItineraryItem[];
  thingsToCarry?: CarryItem[];
  pickupLocations?: PickupLocation[];
  type?: "trek" | "tour"; // Add type field for frontend identification
};

type EditForm = {
  name: string;
  description: string;
  location: string;
  duration: string;
  difficulty: string;
  specialType: string;
  highlights: string[];
  thumbnail: string;
  isActive: boolean;
  cityPricing: CityPricing[];
  itinerary: ItineraryItem[];
  thingsToCarry: CarryItem[];
  pickupLocations: PickupLocation[];
  dateWindows: DateWindow[];
};

const normalizeDifficulty = (value: string): "Easy" | "Moderate" | "Hard" | "" => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "moderate") return "Moderate";
  if (normalized === "hard") return "Hard";
  return "";
};

const stripHtmlTags = (html: string): string => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const allowedCities = ["Chh. Sambhajinagar", "Pune", "Mumbai"] as const;

const ManageTreks = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string>("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const specialTypes = [
    "Pre Monsoon Special",
    "Fireflies Festival Special",
    "Technical Treks",
    "Waterfall Treks",
    "Jungle Treks",
    "Outdoor Camping",
    "One Day Treks",
  ];

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  }), []);
  const quillFormats = useMemo(() => [
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
  ], []);
  const headers = useMemo(() => ({
    "x-admin-key": localStorage.getItem("adminKey") || "",
  }), []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both treks and tours
      const [treksRes, toursRes] = await Promise.all([
        axios.get(`${API_BASE}/api/treks`, { headers }),
        axios.get(`${API_BASE}/api/tours`, { headers })
      ]);

      const treksData = treksRes.data.data || treksRes.data || [];
      const toursData = toursRes.data.data || toursRes.data || [];

      // Add type field to distinguish between treks and tours
      const treksWithType = treksData.map((trek: Item) => ({ ...trek, type: "trek" as const }));
      const toursWithType = toursData.map((tour: Item) => ({ ...tour, type: "tour" as const }));

      // Combine both arrays
      const allItems = [...treksWithType, ...toursWithType];
      setItems(allItems);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch treks and tours. Please check your backend or network.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, headers]);

  const handleDelete = async (id: string, type: "trek" | "tour") => {
    try {
      setActionLoading(id);
      const endpoint = type === "trek" ? "treks" : "tours";
      await axios.delete(`${API_BASE}/api/${endpoint}/${id}`, { headers });
      setItems((prev) => prev.filter((item) => item._id !== id));
      setDeleteConfirmId("");
    } catch (err) {
      console.error("Delete error:", err);
      alert(`Failed to delete ${type}.`);
    } finally {
      setActionLoading("");
    }
  };

  const handleToggleStatus = async (id: string, type: "trek" | "tour") => {
    try {
      setActionLoading(id);
      const endpoint = type === "trek" ? "treks" : "tours";
      await axios.patch(
        `${API_BASE}/api/${endpoint}/toggle-status/${id}`,
        {},
        { headers }
      );
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Failed to toggle status.");
    } finally {
      setActionLoading("");
    }
  };

  const handleEdit = (item: Item) => {
    // Get all date windows from the item
    const allDateWindows = item.dateWindows && item.dateWindows.length > 0
      ? item.dateWindows
      : [{ label: "Batch 1", startDate: item.startDate, endDate: item.endDate }];

    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description || "",
      location: item.location,
      duration: item.duration,
      difficulty: normalizeDifficulty(item.difficulty) || "Moderate",
      specialType: item.specialType || "Technical Treks",
      highlights: item.highlights || [],
      thumbnail: item.thumbnail,
      isActive: item.isActive,
      cityPricing: item.cityPricing || [],
      itinerary: item.itinerary || [],
      thingsToCarry: item.thingsToCarry || [],
      pickupLocations: item.pickupLocations || [],
      dateWindows: allDateWindows.map((window) => ({
        label: window.label || "",
        startDate: new Date(window.startDate).toISOString().split("T")[0],
        endDate: new Date(window.endDate).toISOString().split("T")[0],
      }))
    });
  };

  const handleEditSubmit = async () => {
    if (!editingItem || !editForm) return;
    
    const itemType = editingItem.type;
    const itemName = itemType === "trek" ? "Trek" : "Tour";
    
    // Basic validation
    if (!editForm.name.trim()) {
      alert(`${itemName} name is required`);
      return;
    }
    
    if (!editForm.location.trim()) {
      alert("Location is required");
      return;
    }

    if (!editForm.description.trim()) {
      alert(`${itemName} description is required`);
      return;
    }

    const descriptionTextLength = stripHtmlTags(editForm.description).length;
    if (descriptionTextLength < 20) {
      alert(`${itemName} description must be at least 20 characters`);
      return;
    }
    
    if (!editForm.duration.trim()) {
      alert("Duration is required");
      return;
    }
    
    const normalizedDifficulty = normalizeDifficulty(editForm.difficulty);
    if (!normalizedDifficulty) {
      alert("Difficulty level is required");
      return;
    }

    if (!editForm.specialType) {
      alert("Special type is required");
      return;
    }

    // Validate date windows
    const validDateWindows = editForm.dateWindows.filter(dw => dw.startDate && dw.endDate);
    if (validDateWindows.length === 0) {
      alert("At least one date window with start and end date is required");
      return;
    }

    if (validDateWindows.some((window) => new Date(window.startDate) >= new Date(window.endDate))) {
      alert("Each date window must have a valid start and end date");
      return;
    }
    
    try {
      setActionLoading(editingItem._id);
      const endpoint = itemType === "trek" ? "treks" : "tours";
      const firstDateWindow = validDateWindows[0];

      const uniqueDateWindows = Array.from(
        new Map(
          validDateWindows.map((window) => [
            `${new Date(window.startDate).toISOString()}|${new Date(window.endDate).toISOString()}`,
            {
              label: window.label?.trim() || "",
              startDate: window.startDate,
              endDate: window.endDate,
            },
          ])
        ).values()
      );

      const sanitizedItinerary = editForm.itinerary
        .map((item, index) => ({
          day: Number(item.day) > 0 ? Number(item.day) : index + 1,
          title: item.title.trim(),
          description: item.description.trim(),
          meals: item.meals.trim(),
          accommodation: item.accommodation.trim(),
        }))
        .filter((item) => item.title && item.description);

      const sanitizedThingsToCarry = editForm.thingsToCarry
        .map((item) => ({
          item: item.item.trim(),
          details: item.details.trim(),
          required: Boolean(item.required),
        }))
        .filter((item) => item.item);

      const sanitizedPickupLocations = editForm.pickupLocations
        .map((item) => ({
          city: item.city.trim(),
          location: item.location.trim(),
          pickupTime: item.pickupTime.trim(),
          notes: item.notes.trim(),
        }))
        .filter((item) =>
          item.city &&
          item.location &&
          item.pickupTime &&
          allowedCities.includes(item.city as (typeof allowedCities)[number])
        );

      const sanitizedCityPricing = Array.from(
        new Map(
          editForm.cityPricing
            .filter((item) => item.city && allowedCities.includes(item.city as (typeof allowedCities)[number]))
            .map((item) => [
              item.city,
              {
                city: item.city,
                price: Number(item.price) || 0,
                discountPrice: Number(item.discountPrice) || 0,
              },
            ])
        ).values()
      );

      const payload = {
        ...editForm,
        difficulty: normalizedDifficulty,
        highlights: editForm.highlights.filter(h => h.trim()),
        cityPricing: sanitizedCityPricing,
        itinerary: sanitizedItinerary,
        thingsToCarry: sanitizedThingsToCarry,
        pickupLocations: sanitizedPickupLocations,
        startDate: firstDateWindow.startDate,
        endDate: uniqueDateWindows[uniqueDateWindows.length - 1].endDate,
        dateWindows: uniqueDateWindows,
      };
      
      await axios.put(`${API_BASE}/api/${endpoint}/${editingItem._id}`, payload, { headers });
      
      // Update the item in the local state
      setItems((prev) =>
        prev.map((item) =>
          item._id === editingItem._id
            ? {
                ...item,
                ...payload,
                itinerary: payload.itinerary?.map((day) => ({
                  ...day,
                  day: String(day.day),
                })),
              }
            : item
        )
      );
      
      setEditingItem(null);
      setEditForm(null);
      alert(`${itemName} updated successfully!`);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (() => {
            const responseData = err.response?.data;
            if (responseData?.errors && typeof responseData.errors === "object") {
              const firstValidationError = Object.values(responseData.errors)[0] as { message?: string } | undefined;
              if (firstValidationError?.message) {
                return firstValidationError.message;
              }
            }
            return responseData?.message || err.message;
          })()
        : "Unknown error";
      console.error("Update error:", err);
      alert(`Failed to update ${itemName.toLowerCase()}: ${message}`);
    } finally {
      setActionLoading("");
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const updateEditForm = (updater: (prev: EditForm) => EditForm) => {
    setEditForm((prev) => (prev ? updater(prev) : prev));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-800 border-green-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "🟢";
      case "moderate": return "🟡";
      case "hard": return "🔴";
      default: return "⚪";
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && item.isActive) ||
                         (filterStatus === "inactive" && !item.isActive);
    const matchesDifficulty = filterDifficulty === "all" || 
                             item.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
    const matchesType = filterType === "all" || item.type === filterType;
    
    return matchesSearch && matchesStatus && matchesDifficulty && matchesType;
  });

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading treks...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Items</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchItems}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Treks</h1>
              <p className="text-gray-600 mt-1">View, edit, and manage all your trek listings</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">{items.length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-semibold text-gray-900">All Listings</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">{items.filter(t => t.isActive).length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Items</p>
                  <p className="font-semibold text-gray-900">Live Listings</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">{items.filter(t => !t.isActive).length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inactive Items</p>
                  <p className="font-semibold text-gray-900">Draft Listings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search treks & tours..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>

                {/* Difficulty Filter */}
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>

                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as "all" | "trek" | "tour")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Types</option>
                  <option value="trek">Treks Only</option>
                  <option value="tour">Tours Only</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredItems.length}</span> of <span className="font-medium">{items.length}</span> items
              </p>
            </div>
          </div>
        </div>

        {/* Trek Listings */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No treks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all" || filterDifficulty !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first trek"}
            </p>
            {(searchTerm || filterStatus !== "all" || filterDifficulty !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterDifficulty("all");
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredItems.map((item) => (
              <div key={item._id} className={`
                bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group
                ${viewMode === "list" ? "flex items-center" : ""}
              `}>
                {/* Thumbnail */}
                <div className={`relative overflow-hidden ${
                  viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "h-48"
                }`}>
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTAwIDgwQzEwNi42MjcgODAgMTEyIDg1LjM3MyAxMTIgOTJDMTEyIDk4LjYyNyAxMDYuNjI3IDEwNCAxMDAgMTA0Qzk5LjM3MyAxMDQgODggOTguNjI3IDg4IDkyQzg4IDg1LjM3MyA5My4zNzMgODAgMTAwIDgwWiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNjggMTIwSDMyVjE2MEgxNjhWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==";
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                      ${item.isActive 
                        ? 'bg-green-100/90 text-green-800 border border-green-200/50' 
                        : 'bg-red-100/90 text-red-800 border border-red-200/50'
                      }
                    `}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
                      ${getDifficultyColor(item.difficulty)}
                    `}>
                      {getDifficultyIcon(item.difficulty)} {item.difficulty}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className={viewMode === "list" ? "flex items-start justify-between" : ""}>
                    <div className={viewMode === "list" ? "flex-1 pr-6" : ""}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2" 
                          dangerouslySetInnerHTML={{ __html: item.name }}>
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">{item.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">{item.duration}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
                          </svg>
                          <span className="text-sm">
                            {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex gap-2 ${viewMode === "list" ? "flex-col" : ""}`}>
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 border border-blue-200 font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(item._id, item.type!)}
                        disabled={actionLoading === item._id}
                        className={`
                          px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                          ${item.isActive 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                          }
                          ${actionLoading === item._id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                        `}
                      >
                        {actionLoading === item._id ? (
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                      
                      {deleteConfirmId === item._id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(item._id, item.type!)}
                            disabled={actionLoading === item._id}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-all duration-200 flex items-center gap-1"
                          >
                            {actionLoading === item._id ? (
                              <svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : "✓"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId("")}
                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-all duration-200"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 border border-red-200 font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit {editingItem.type === "trek" ? "Trek" : "Tour"}</h2>
                <button
                  onClick={handleEditCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Trek Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trek Name</label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={(e) => updateEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter trek name"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location || ""}
                  onChange={(e) => updateEditForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
                  <ReactQuill
                    theme="snow"
                    value={editForm.description}
                    onChange={(value) => setEditForm(prev => prev ? ({ ...prev, description: value }) : prev)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Describe the trek or tour experience..."
                    className="bg-white"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Format the description with bold, italic, lists, and alignment.
                </p>
              </div>

              {/* Duration and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={editForm.duration || ""}
                    onChange={(e) => updateEditForm((prev) => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5 days"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={editForm.difficulty || ""}
                    onChange={(e) => updateEditForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Special Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">✨ Special Type</label>
                <select
                  value={editForm.specialType || ""}
                  onChange={(e) => updateEditForm((prev) => ({ ...prev, specialType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select special type</option>
                  {specialTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">⭐ Highlights</label>
                <div className="space-y-3">
                  {editForm.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xl text-blue-600 flex-shrink-0">•</span>
                      <input
                        type="text"
                        placeholder={`Highlight ${index + 1}`}
                        value={highlight}
                        onChange={(e) => {
                          const updated = [...editForm.highlights];
                          updated[index] = e.target.value;
                          setEditForm(prev => prev ? { ...prev, highlights: updated } : prev);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editForm.highlights.filter((_, i) => i !== index);
                          setEditForm(prev => prev ? { ...prev, highlights: updated } : prev);
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
                      setEditForm(prev => prev ? { ...prev, highlights: [...prev.highlights, ""] } : prev);
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-blue-400 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Highlight
                  </button>
                </div>
              </div>

              {/* Date Windows */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date Windows</label>
                <div className="space-y-3">
                  {editForm.dateWindows.map((window, index) => (
                    <div key={`edit-date-window-${index}`} className="p-4 border border-blue-200 rounded-lg space-y-3 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">{index + 1}</span>
                          Batch {index + 1}
                        </span>
                        {editForm.dateWindows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => prev ? ({
                              ...prev,
                              dateWindows: prev.dateWindows.filter((_, itemIndex) => itemIndex !== index),
                            }) : prev)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={window.label}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            dateWindows: prev.dateWindows.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Batch 1, Batch 2"
                        />
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">📍</div>
                          <input
                            type="date"
                            value={window.startDate}
                            onChange={(e) => setEditForm(prev => prev ? ({
                              ...prev,
                              dateWindows: prev.dateWindows.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: e.target.value } : item),
                            }) : prev)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">📍</div>
                          <input
                            type="date"
                            value={window.endDate}
                            onChange={(e) => setEditForm(prev => prev ? ({
                              ...prev,
                              dateWindows: prev.dateWindows.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: e.target.value } : item),
                            }) : prev)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({
                      ...prev,
                      dateWindows: [...prev.dateWindows, { label: `Batch ${prev.dateWindows.length + 1}`, startDate: "", endDate: "" }],
                    }) : prev)}
                    className="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
                  >
                    + Add Date Window
                  </button>
                </div>
              </div>

              {/* Day Wise Itinerary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day Wise Itinerary</label>
                <div className="space-y-3">
                  {editForm.itinerary.map((day, index) => (
                    <div key={`edit-itinerary-${index}`} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">Day {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.filter((_, itemIndex) => itemIndex !== index),
                          }) : prev)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="number"
                          min="1"
                          value={day.day}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, day: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Day"
                        />
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Title"
                        />
                        <textarea
                          value={day.description}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, description: e.target.value } : item),
                          }) : prev)}
                          className="w-full md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24"
                          placeholder="Description"
                        />
                        <input
                          type="text"
                          value={day.meals}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, meals: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Meals"
                        />
                        <input
                          type="text"
                          value={day.accommodation}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            itinerary: prev.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, accommodation: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Accommodation"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({
                      ...prev,
                      itinerary: [...prev.itinerary, { day: String(prev.itinerary.length + 1), title: "", description: "", meals: "", accommodation: "" }],
                    }) : prev)}
                    className="w-full px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors duration-200"
                  >
                    + Add Day
                  </button>
                </div>
              </div>

              {/* Things to Carry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Things to Carry</label>
                <div className="space-y-3">
                  {editForm.thingsToCarry.map((carry, index) => (
                    <div key={`edit-carry-${index}`} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => prev ? ({
                            ...prev,
                            thingsToCarry: prev.thingsToCarry.filter((_, itemIndex) => itemIndex !== index),
                          }) : prev)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={carry.item}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            thingsToCarry: prev.thingsToCarry.map((item, itemIndex) => itemIndex === index ? { ...item, item: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Item"
                        />
                        <label className="flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                          <input
                            type="checkbox"
                            checked={carry.required}
                            onChange={(e) => setEditForm(prev => prev ? ({
                              ...prev,
                              thingsToCarry: prev.thingsToCarry.map((item, itemIndex) => itemIndex === index ? { ...item, required: e.target.checked } : item),
                            }) : prev)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Required item</span>
                        </label>
                        <textarea
                          value={carry.details}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            thingsToCarry: prev.thingsToCarry.map((item, itemIndex) => itemIndex === index ? { ...item, details: e.target.value } : item),
                          }) : prev)}
                          className="w-full md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-24"
                          placeholder="Details"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({
                      ...prev,
                      thingsToCarry: [...prev.thingsToCarry, { item: "", details: "", required: true }],
                    }) : prev)}
                    className="w-full px-4 py-2 border-2 border-dashed border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors duration-200"
                  >
                    + Add Carry Item
                  </button>
                </div>
              </div>

              {/* Pickup Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Locations</label>
                <div className="space-y-3">
                  {editForm.pickupLocations.map((pickup, index) => (
                    <div key={`edit-pickup-${index}`} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">Pickup {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => prev ? ({
                            ...prev,
                            pickupLocations: prev.pickupLocations.filter((_, itemIndex) => itemIndex !== index),
                          }) : prev)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={pickup.city}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            pickupLocations: prev.pickupLocations.map((item, itemIndex) => itemIndex === index ? { ...item, city: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={pickup.location}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            pickupLocations: prev.pickupLocations.map((item, itemIndex) => itemIndex === index ? { ...item, location: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Pickup location"
                        />
                        <input
                          type="text"
                          value={pickup.pickupTime}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            pickupLocations: prev.pickupLocations.map((item, itemIndex) => itemIndex === index ? { ...item, pickupTime: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Pickup time"
                        />
                        <input
                          type="text"
                          value={pickup.notes}
                          onChange={(e) => setEditForm(prev => prev ? ({
                            ...prev,
                            pickupLocations: prev.pickupLocations.map((item, itemIndex) => itemIndex === index ? { ...item, notes: e.target.value } : item),
                          }) : prev)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Notes"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => prev ? ({
                      ...prev,
                      pickupLocations: [...prev.pickupLocations, { city: "", location: "", pickupTime: "", notes: "" }],
                    }) : prev)}
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors duration-200"
                  >
                    + Add Pickup Location
                  </button>
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={editForm.thumbnail || ""}
                  onChange={(e) => updateEditForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter image URL"
                />
                {editForm.thumbnail && (
                  <div className="mt-2">
                    <img
                      src={editForm.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isActive || false}
                    onChange={(e) => updateEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Trek</span>
                </label>
              </div>

              {/* City Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City Pricing</label>
                <div className="space-y-3">
                  {editForm.cityPricing && editForm.cityPricing.length > 0 ? (
                    editForm.cityPricing.map((cityPrice, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={cityPrice.city}
                            onChange={(e) => {
                              const newCityPricing = [...(editForm.cityPricing || [])];
                              newCityPricing[index] = { ...newCityPricing[index], city: e.target.value };
                              updateEditForm((prev) => ({ ...prev, cityPricing: newCityPricing }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="City name"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={cityPrice.price}
                            onChange={(e) => {
                              const newCityPricing = [...(editForm.cityPricing || [])];
                              newCityPricing[index] = { ...newCityPricing[index], price: parseInt(e.target.value) || 0 };
                              updateEditForm((prev) => ({ ...prev, cityPricing: newCityPricing }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Price"
                            min="0"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={cityPrice.discountPrice || ""}
                            onChange={(e) => {
                              const newCityPricing = [...(editForm.cityPricing || [])];
                              newCityPricing[index] = { ...newCityPricing[index], discountPrice: e.target.value ? parseInt(e.target.value) : undefined };
                              updateEditForm((prev) => ({ ...prev, cityPricing: newCityPricing }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Discount price"
                            min="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCityPricing = editForm.cityPricing?.filter((_, i) => i !== index) || [];
                            updateEditForm((prev) => ({ ...prev, cityPricing: newCityPricing }));
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No city pricing data available</div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newCityPricing = [...(editForm.cityPricing || []), { city: "", price: 0, discountPrice: undefined }];
                      updateEditForm((prev) => ({ ...prev, cityPricing: newCityPricing }));
                    }}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add City Pricing
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={handleEditCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={actionLoading === editingItem._id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                {actionLoading === editingItem._id ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Trek
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTreks;
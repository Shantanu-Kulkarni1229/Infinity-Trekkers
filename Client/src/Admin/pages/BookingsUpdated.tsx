/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";

type Item = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBookings: number;
  totalRevenue: number;
  isActive: boolean;
  type: "trek" | "tour";
};

type Booking = {
  id: string;
  name: string;
  city: string;
  phone: string;
  members: number;
  status: string;
  bookedOn?: string;
  itemType?: "trek" | "tour";
};

type ItemDetails = {
  id?: string;
  name?: string;
  totalMembers?: number;
  totalRevenue?: number;
  isActive?: boolean;
  endDate?: string;
  type?: "trek" | "tour";
};

// Helper component to render HTML content safely
const RenderHTML = ({ html }: { html?: string }) => {
  if (!html) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const Bookings = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<ItemDetails>({});
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "trek" | "tour">("all");
  const [sortBy, setSortBy] = useState<"name" | "members" | "date">("date");
  const [clearingBookings, setClearingBookings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
  const headers = useMemo(() => ({
    "x-admin-key": localStorage.getItem("adminKey") || "",
  }), []);

  // Fetch overview of all treks and tours
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch both treks and tours
      const [treksRes, toursRes] = await Promise.all([
        axios.get(`${API_BASE}/api/treks`, { headers }),
        axios.get(`${API_BASE}/api/tours`, { headers }).catch(() => ({ data: [] }))
      ]);

      const treksData = (treksRes.data.data || treksRes.data || []).map((trek: any) => ({ 
        ...trek, 
        type: "trek" as const,
        totalBookings: 0, // Will be populated when booking system is updated
        totalRevenue: 0
      }));
      
      const toursData = (toursRes.data.data || toursRes.data || []).map((tour: any) => ({ 
        ...tour, 
        type: "tour" as const,
        totalBookings: 0, // Will be populated when booking system is updated
        totalRevenue: 0
      }));

      const allActiveItems = [...treksData, ...toursData].filter((item: Item) => item.isActive);
      setItems(allActiveItems);
    } catch (err) {
      console.error("Failed to fetch overview:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, headers]);

  // Fetch bookings for selected item (trek or tour)
  const fetchBookings = useCallback(async (itemId: string, itemType: "trek" | "tour") => {
    if (!itemId) {
      console.error("Item ID is undefined.");
      return;
    }

    setBookingsLoading(true);
    try {
      // Use appropriate endpoint based on item type
      const endpoint = itemType === "trek" 
        ? `${API_BASE}/api/admin/trek-users/${itemId}`
        : `${API_BASE}/api/admin/tour-users/${itemId}`;
        
      const res = await axios.get(endpoint, { headers });
      console.log("Bookings API Response:", res.data);

      const bookingsData: Booking[] =
        res.data.data?.bookings ||
        res.data.bookings ||
        res.data.users ||
        [];
      const itemDetails: ItemDetails =
        res.data.data?.trekDetails || 
        res.data.data?.tourDetails || 
        res.data.trekDetails || 
        res.data.tourDetails || 
        {};

      // Add item type to each booking
      const bookingsWithType = bookingsData.map(booking => ({
        ...booking,
        itemType
      }));

      setBookings(bookingsWithType);
      setSummary({ ...itemDetails, type: itemType });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      // If tour endpoint doesn't exist yet, show empty results
      if (itemType === "tour") {
        setBookings([]);
        setSummary({});
      }
    } finally {
      setBookingsLoading(false);
    }
  }, [API_BASE, headers]);

  const handleClearBookings = async (
    itemId: string | undefined,
    isActive: boolean | undefined,
    endDate: string | undefined,
    itemType: "trek" | "tour" = "trek"
  ) => {
    if (!itemId) {
      console.error("Item ID is missing");
      return;
    }

    if (isActive) {
      alert(`${itemType === "trek" ? "Trek" : "Tour"} is still active. Deactivate before clearing.`);
      return;
    }

    if (endDate && new Date(endDate) > new Date()) {
      alert(`${itemType === "trek" ? "Trek" : "Tour"} hasn't ended yet.`);
      return;
    }

    setClearingBookings(true);
    try {
      const endpoint = itemType === "trek" 
        ? `${API_BASE}/api/admin/clear-bookings/${itemId}`
        : `${API_BASE}/api/admin/clear-tour-bookings/${itemId}`;
        
      const res = await axios.delete(endpoint, { headers });
      alert(res.data.message);
      setBookings([]);
      setSummary({});
      setSelectedItem(null);

      setShowClearConfirm(false);
      fetchOverview(); // Refresh overview
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(error);
      alert(error.response?.data?.message || "Failed to clear bookings.");
    } finally {
      setClearingBookings(false);
    }
  };

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "members":
          return b.members - a.members;
        case "date":
          if (a.bookedOn && b.bookedOn) {
            return new Date(b.bookedOn).getTime() - new Date(a.bookedOn).getTime();
          }
          return 0;
        default:
          return 0;
      }
    });

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesType;
  });

  const totalStats = {
    totalBookings: items.reduce((sum, item) => sum + item.totalBookings, 0),
    totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
    activeItems: items.filter(t => t.isActive).length,
    activeTreks: items.filter(t => t.isActive && t.type === "trek").length,
    activeTours: items.filter(t => t.isActive && t.type === "tour").length
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading bookings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
            <p className="text-gray-600 mt-1">View and manage trek and tour bookings</p>
          </div>
          
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "trek" | "tour")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="trek">Treks Only</option>
              <option value="tour">Tours Only</option>
            </select>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.activeItems}</p>
                <p className="text-xs text-gray-500">{totalStats.activeTreks} treks, {totalStats.activeTours} tours</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Items Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Select Trek or Tour to View Bookings</h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Items</h3>
              <p className="text-gray-600">No active {typeFilter === "all" ? "treks or tours" : typeFilter + "s"} found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`
                    border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group
                    ${selectedItem === item.id 
                      ? "bg-blue-50 border-blue-300 shadow-md" 
                      : "bg-white border-gray-200 hover:border-blue-200"
                    }
                  `}
                  onClick={() => {
                    if (!item.id) {
                      console.error("Item ID missing:", item);
                      return;
                    }
                    setSelectedItem(item.id);

                    fetchBookings(item.id, item.type);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.type === "trek" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium border
                          ${item.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        `}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                        <RenderHTML html={item.name} />
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
                      </svg>
                      <span className="text-sm">
                        {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center text-gray-500 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs">Bookings</span>
                      </div>
                      <p className="font-semibold text-gray-900">{item.totalBookings}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center text-gray-500 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-xs">Revenue</span>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedItem === item.id && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Selected - View bookings below</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Detail Section */}
        {selectedItem && summary?.name && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    <RenderHTML html={summary.name} /> Bookings
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      summary.type === "trek" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {summary.type?.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clear Bookings Button */}
              {summary.totalMembers !== undefined && summary.totalMembers > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 border border-red-200 font-medium text-sm transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Bookings
                </button>
              )}
            </div>

            {/* Booking Controls */}
            {bookings.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "members" | "date")}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="members">Sort by Members</option>
                </select>
              </div>
            )}

            {/* Bookings List */}
            {bookingsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "No bookings match your current filters." 
                    : "No bookings have been made for this item yet."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Members</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Booked On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, index) => (
                      <tr key={booking.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.name}</p>
                            <p className="text-sm text-gray-600">{booking.city}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900">{booking.phone}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {booking.members} {booking.members === 1 ? 'person' : 'people'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {booking.bookedOn ? new Date(booking.bookedOn).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Clear All Bookings</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear all bookings for this {summary.type}? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleClearBookings(summary.id, summary.isActive, summary.endDate, summary.type as "trek" | "tour")}
                  disabled={clearingBookings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                >
                  {clearingBookings ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clearing...
                    </>
                  ) : (
                    'Clear Bookings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
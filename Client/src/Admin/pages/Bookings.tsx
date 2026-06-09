/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
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
  amount?: number;
  paymentMode?: string;
  advancePaidAmount?: number;
  remainingAmount?: number;
  travelerDetails?: Array<{ name: string; phoneNumber: string }>;
  selectedDateWindow?: { label?: string; startDate: string; endDate: string };
  pickupLocation?: {
    city: string;
    location: string;
    pickupTime: string;
    notes?: string;
  };
};

type BatchSummary = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  totalBookings: number;
  totalMembers: number;
  totalRevenue: number;
  paidBookings: number;
  pendingBookings: number;
  failedBookings: number;
};

type ItemDetails = {
  id?: string;
  name?: string;
  totalMembers?: number;
  totalRevenue?: number;
  isActive?: boolean;
  endDate?: string;
  type?: "trek" | "tour";
  dateWindows?: Array<{ label?: string; startDate: string; endDate: string }>;
  batchSummary?: BatchSummary[];
};

const RenderHTML = ({ html }: { html?: string }) => {
  if (!html) return null;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "N/A";
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

const formatDateDDMMYYYY = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getWindowLabel = (window?: Booking["selectedDateWindow"]) => {
  if (!window) return "Primary Schedule";
  return window.label?.trim() || "Primary Schedule";
};

const getWindowKey = (booking: Booking) => {
  const label = getWindowLabel(booking.selectedDateWindow);
  const startDate = booking.selectedDateWindow?.startDate || "";
  const endDate = booking.selectedDateWindow?.endDate || "";
  return `${label}|${startDate}|${endDate}`;
};

const formatPaymentMethod = (booking: Booking) => {
  if (booking.paymentMode === "cash") return "Cash";
  if (booking.paymentMode === "online") return booking.status.toLowerCase() === "paid" ? "Online" : "Online (Pending)";
  if (booking.status.toLowerCase() === "paid") return "Online";
  if (booking.status.toLowerCase() === "pending") return "Online (Pending)";
  return booking.status.toLowerCase() === "paid" ? "Paid" : "Pending";
};

const getStatusTone = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return {
        card: "bg-green-50 border-green-200",
        badge: "bg-green-100 text-green-800 border-green-200",
        accent: "text-green-700",
      };
    case "pending":
      return {
        card: "bg-yellow-50 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
        accent: "text-yellow-700",
      };
    case "failed":
      return {
        card: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800 border-red-200",
        accent: "text-red-700",
      };
    default:
      return {
        card: "bg-gray-50 border-gray-200",
        badge: "bg-gray-100 text-gray-800 border-gray-200",
        accent: "text-gray-700",
      };
  }
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
  const [sortBy, setSortBy] = useState<"name" | "members" | "date">("date");
  const [clearingBookings, setClearingBookings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
  const headers = useMemo(() => ({ "x-admin-key": localStorage.getItem("adminKey") || "" }), []);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/admin/unified-overview`, { headers });

      const itemsData = (response.data.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        startDate: item.startDate,
        endDate: item.endDate,
        isActive: item.isActive,
        type: item.type,
        totalBookings: item.totalBookings || 0,
        totalRevenue: item.totalRevenue || 0,
      }));

      setItems(itemsData);
    } catch (err) {
      console.error("Failed to fetch overview:", err);
      try {
        const [treksRes, toursRes] = await Promise.all([
          axios.get(`${API_BASE}/api/treks`, { headers }),
          axios.get(`${API_BASE}/api/tours`, { headers }).catch(() => ({ data: [] })),
        ]);

        const treksData = (treksRes.data.data || treksRes.data || []).map((trek: any) => ({
          ...trek,
          type: "trek" as const,
          totalBookings: 0,
          totalRevenue: 0,
        }));

        const toursData = (toursRes.data.data || toursRes.data || []).map((tour: any) => ({
          ...tour,
          type: "tour" as const,
          totalBookings: 0,
          totalRevenue: 0,
        }));

        setItems([...treksData, ...toursData].filter((item: Item) => item.isActive));
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE, headers]);

  const fetchBookings = useCallback(async (itemId: string, itemType: "trek" | "tour") => {
    if (!itemId) {
      console.error("Item ID is undefined.");
      return;
    }

    setBookingsLoading(true);
    setExpandedBookingId(null);
    try {
      const endpoint = itemType === "trek"
        ? `${API_BASE}/api/admin/trek-users/${itemId}`
        : `${API_BASE}/api/admin/tour-users/${itemId}`;

      const res = await axios.get(endpoint, { headers });

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

      setBookings(bookingsData.map((booking) => ({ ...booking, itemType })));
      setSummary({ ...itemDetails, type: itemType, batchSummary: res.data.data?.batchSummary || [] });
    } catch (err) {
      console.error("Error fetching bookings:", err);
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
      setExpandedBookingId(null);
      setShowClearConfirm(false);
      fetchOverview();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(error);
      alert(error.response?.data?.message || "Failed to clear bookings.");
    } finally {
      setClearingBookings(false);
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (!window.confirm(`Delete booking for ${booking.name}? This cannot be undone.`)) {
      return;
    }

    setDeletingBookingId(booking.id);
    try {
      await axios.delete(`${API_BASE}/api/admin/bookings/${booking.id}`, { headers });
      await fetchBookings(selectedItem || "", summary.type || booking.itemType || "trek");
      await fetchOverview();
      alert("Booking deleted successfully.");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete booking.");
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleMarkAsPaid = async (booking: Booking) => {
    if (!window.confirm(`Mark ${booking.name}'s booking as paid?`)) {
      return;
    }

    try {
      await axios.patch(
        `${API_BASE}/api/admin/bookings/${booking.id}/status`,
        { paymentStatus: "paid" },
        { headers }
      );

      if (selectedItem) {
        await fetchBookings(selectedItem, summary.type || booking.itemType || "trek");
      }
      await fetchOverview();
      alert("Booking marked as paid.");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(error);
      alert(error.response?.data?.message || "Failed to update booking status.");
    }
  };

  const handleDownloadBatchPdf = async (group: { label: string; startDate: string; endDate: string }) => {
    if (!summary.id || !summary.type) {
      alert("Select a trek or tour first.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/bookings/${summary.type}/${summary.id}/batch-report`,
        {
          headers,
          responseType: "blob",
          params: {
            label: group.label,
            startDate: group.startDate,
            endDate: group.endDate,
          },
        }
      );

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = `${(summary.name || "batch-report").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${(group.label || "batch").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(error);
      alert(error.response?.data?.message || "Failed to download batch report.");
    }
  };

  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm) ||
        booking.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pickupLocation?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pickupLocation?.pickupTime?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWindowLabel(booking.selectedDateWindow).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      switch (sortBy) {
        case "name":
          return left.name.localeCompare(right.name);
        case "members":
          return right.members - left.members;
        case "date":
          return new Date(right.bookedOn || right.selectedDateWindow?.startDate || 0).getTime() - new Date(left.bookedOn || left.selectedDateWindow?.startDate || 0).getTime();
        default:
          return 0;
      }
    });

  const groupedBookings = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; startDate: string; endDate: string; bookings: Booking[] }>();

    filteredBookings.forEach((booking) => {
      const label = getWindowLabel(booking.selectedDateWindow);
      const startDate = booking.selectedDateWindow?.startDate || "";
      const endDate = booking.selectedDateWindow?.endDate || "";
      const key = getWindowKey(booking);
      const current = groups.get(key) || { key, label, startDate, endDate, bookings: [] };
      current.bookings.push(booking);
      groups.set(key, current);
    });

    return [...groups.values()].sort((left, right) => {
      const leftDate = new Date(left.startDate || left.endDate || 0).getTime();
      const rightDate = new Date(right.startDate || right.endDate || 0).getTime();
      return leftDate - rightDate;
    });
  }, [filteredBookings]);

  const totalStats = {
    totalBookings: items.reduce((sum, item) => sum + item.totalBookings, 0),
    totalRevenue: items.reduce((sum, item) => sum + item.totalRevenue, 0),
    activeItems: items.filter((item) => item.isActive).length,
    activeTraks: items.filter((item) => item.isActive && item.type === "trek").length,
    activeTours: items.filter((item) => item.isActive && item.type === "tour").length,
  };

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading bookings data...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor and manage trek and tour bookings by batch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                  <p className="text-xs text-gray-500">{totalStats.activeTraks} treks, {totalStats.activeTours} tours</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Select Trek or Tour to View Batch Bookings</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Items</h3>
              <p className="text-gray-600">No active treks or tours found. Create some to see bookings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                    selectedItem === item.id ? "bg-blue-50 border-blue-300 shadow-md" : "bg-white border-gray-200 hover:border-blue-200"
                  }`}
                  onClick={() => {
                    if (!item.id) {
                      console.error("Item ID missing:", item);
                      return;
                    }
                    setSelectedItem(item.id);
                    setShowClearConfirm(false);
                    fetchBookings(item.id, item.type);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      <RenderHTML html={item.name} />
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${item.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
                      </svg>
                      <span className="text-sm">
                        {formatDate(item.startDate)} → {formatDate(item.endDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bookings</p>
                          <p className="font-semibold text-gray-900">{item.totalBookings}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="font-semibold text-gray-900">₹{item.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedItem === item.id && (
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex items-center gap-2 text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium">View Details Below</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedItem && summary?.name && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    <RenderHTML html={summary.name} /> Bookings
                  </h3>
                  <div className="flex flex-wrap gap-6 text-blue-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Total Members: {summary.totalMembers ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span>Total Revenue: ₹{(summary.totalRevenue ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Batches: {summary.batchSummary?.length ?? groupedBookings.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {showClearConfirm ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClearBookings(summary.id, summary.isActive, summary.endDate, summary.type)}
                        disabled={clearingBookings}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                      >
                        {clearingBookings ? (
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Bookings
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bookings...</p>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                  <p className="text-gray-600">This trek or tour doesn't have any bookings yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search bookings or batch name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
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

                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings across <span className="font-medium">{groupedBookings.length}</span> batch groups
                    </p>
                    <p className="text-sm text-gray-500">
                      Green = paid, Yellow = pending
                    </p>
                  </div>

                  {groupedBookings.length > 0 ? (
                    <div className="mt-8 space-y-5">
                      {groupedBookings.map((group) => {
                        const groupSummary = group.bookings.reduce(
                          (acc, booking) => {
                            acc.totalMembers += booking.members;
                            if (booking.status.toLowerCase() === "paid") {
                              acc.totalRevenue += booking.amount || 0;
                              acc.paidCount += 1;
                            } else if (booking.status.toLowerCase() === "pending") {
                              acc.pendingCount += 1;
                            }
                            return acc;
                          },
                          { totalMembers: 0, totalRevenue: 0, paidCount: 0, pendingCount: 0 }
                        );

                        return (
                          <section key={group.key} className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
                            <div className="flex flex-col gap-3 border-b border-gray-200 bg-slate-50/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{group.label}</h4>
                                <p className="text-sm text-gray-600">{formatDateRange(group.startDate, group.endDate)}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
                                  {group.bookings.length} bookings
                                </span>
                                <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
                                  ₹{groupSummary.totalRevenue.toLocaleString()} revenue
                                </span>
                                <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-800">
                                  {groupSummary.pendingCount} pending
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                  {groupSummary.totalMembers} members
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadBatchPdf(group)}
                                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-1 font-medium text-white transition-colors hover:bg-sky-700"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  PDF
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 p-4">
                              {group.bookings.map((booking) => {
                                const tone = getStatusTone(booking.status);
                                const isExpanded = expandedBookingId === booking.id;

                                return (
                                  <div
                                    key={booking.id}
                                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                    className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${tone.card} ${isExpanded ? "shadow-lg" : "hover:shadow-md"}`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex min-w-0 flex-1 items-start gap-4">
                                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white font-bold ${tone.accent}`}>
                                          {booking.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="truncate font-semibold text-gray-900">
                                              <RenderHTML html={booking.name} />
                                            </h4>
                                            <span className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${tone.badge}`}>
                                              {booking.status}
                                            </span>
                                          </div>

                                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                            <span>{booking.phone}</span>
                                            <span>•</span>
                                            <span>{booking.city}</span>
                                            <span>•</span>
                                            <span>{booking.members} members</span>
                                          </div>

                                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Batch: {getWindowLabel(booking.selectedDateWindow)}
                                            </span>
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Booked on: {formatDate(booking.bookedOn)}
                                            </span>
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Amount: ₹{(booking.amount || 0).toLocaleString()}
                                            </span>
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Given: ₹{Number(booking.advancePaidAmount || 0).toLocaleString()}
                                            </span>
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Remaining: ₹{Number(booking.remainingAmount ?? Math.max((booking.amount || 0) - Number(booking.advancePaidAmount || 0), 0)).toLocaleString()}
                                            </span>
                                            <span className="rounded-full bg-white/80 px-2 py-1">
                                              Method: {formatPaymentMethod(booking)}
                                            </span>
                                          </div>

                                          {booking.pickupLocation && (
                                            <p className="mt-2 text-xs font-medium text-blue-700">
                                              Pickup: {booking.pickupLocation.location} • {booking.pickupLocation.pickupTime}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex flex-shrink-0 items-center gap-2">
                                        {booking.status.toLowerCase() === "pending" && (
                                          <button
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleMarkAsPaid(booking);
                                            }}
                                            className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
                                          >
                                            Mark Paid
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeleteBooking(booking);
                                          }}
                                          disabled={deletingBookingId === booking.id}
                                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {deletingBookingId === booking.id ? "Deleting..." : "Delete"}
                                        </button>
                                        <svg
                                          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                          <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Status</p>
                                            <p className={`text-sm font-semibold ${tone.accent}`}>{booking.status}</p>
                                          </div>
                                          <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Batch Dates</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDateDDMMYYYY(booking.selectedDateWindow?.startDate)} - {formatDateDDMMYYYY(booking.selectedDateWindow?.endDate)}</p>
                                          </div>
                                          <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Booked On</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(booking.bookedOn)}</p>
                                          </div>
                                          <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Amount</p>
                                            <p className="text-sm font-bold text-green-600">₹{(booking.amount || 0).toLocaleString()}</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                                            <p className="mb-1 text-xs uppercase tracking-wide text-sky-600">Payment Method</p>
                                            <p className="text-sm font-semibold text-slate-900">{formatPaymentMethod(booking)}</p>
                                          </div>
                                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                            <p className="mb-1 text-xs uppercase tracking-wide text-emerald-600">Given Amount</p>
                                            <p className="text-sm font-semibold text-slate-900">₹{Number(booking.advancePaidAmount || 0).toLocaleString()}</p>
                                          </div>
                                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <p className="mb-1 text-xs uppercase tracking-wide text-amber-600">Remaining Amount</p>
                                            <p className="text-sm font-semibold text-slate-900">₹{Number(booking.remainingAmount ?? Math.max((booking.amount || 0) - Number(booking.advancePaidAmount || 0), 0)).toLocaleString()}</p>
                                          </div>
                                        </div>

                                        {booking.pickupLocation && (
                                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <p className="mb-1 text-xs uppercase tracking-wide text-blue-600">Pickup Location</p>
                                            <p className="font-semibold text-gray-900">{booking.pickupLocation.location}</p>
                                            <p className="text-sm text-gray-700 mt-1">
                                              {booking.pickupLocation.city} • {booking.pickupLocation.pickupTime}
                                            </p>
                                            {booking.pickupLocation.notes && (
                                              <p className="text-xs text-gray-600 mt-2">{booking.pickupLocation.notes}</p>
                                            )}
                                          </div>
                                        )}

                                        <div>
                                          <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                                            <span>Members</span>
                                            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">{booking.members}</span>
                                          </h5>
                                          <div className="max-h-40 space-y-2 overflow-y-auto">
                                            {booking.travelerDetails && booking.travelerDetails.length > 0 ? (
                                              booking.travelerDetails.map((traveler, index) => (
                                                <div key={index} className="flex items-start gap-3 rounded border border-gray-200 bg-white p-2">
                                                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                                                    {index + 1}
                                                  </span>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{traveler.name}</p>
                                                    <p className="text-xs text-gray-600">{traveler.phoneNumber}</p>
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-sm text-gray-600">No member details available</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                        className="px-4 py-2 font-medium text-blue-600 hover:text-blue-700"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
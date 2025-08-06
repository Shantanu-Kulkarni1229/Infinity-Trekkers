import  { useEffect, useState } from "react";
import axios from "axios";

type Trek = {
  _id: string;
  name: string;
  location: string;
  duration: string;
  difficulty: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  thumbnail: string;
};

const ManageTreks = () => {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string>("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
  const headers = {
    "x-admin-key": localStorage.getItem("adminKey") || "",
  };

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/treks`, { headers });
      const data = res.data;

      if (Array.isArray(data)) {
        setTreks(data);
      } else if (Array.isArray(data.treks)) {
        setTreks(data.treks);
      } else if (Array.isArray(data.data)) {
        setTreks(data.data);
      } else {
        throw new Error("Unexpected response format from API");
      }
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch treks. Please check your backend or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await axios.delete(`${API_BASE}/api/treks/${id}`, { headers });
      setTreks((prev) => prev.filter((trek) => trek._id !== id));
      setDeleteConfirmId("");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete trek.");
    } finally {
      setActionLoading("");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setActionLoading(id);
      await axios.patch(
        `${API_BASE}/api/treks/toggle-status/${id}`,
        {},
        { headers }
      );
      setTreks((prev) =>
        prev.map((trek) =>
          trek._id === id ? { ...trek, isActive: !trek.isActive } : trek
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Failed to toggle status.");
    } finally {
      setActionLoading("");
    }
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

  const filteredTreks = treks.filter((trek) => {
    const matchesSearch = trek.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trek.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && trek.isActive) ||
                         (filterStatus === "inactive" && !trek.isActive);
    const matchesDifficulty = filterDifficulty === "all" || 
                             trek.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  useEffect(() => {
    fetchTreks();
  }, []);

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
            <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Treks</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTreks}
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
                  <span className="text-blue-600 font-bold text-lg">{treks.length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Treks</p>
                  <p className="font-semibold text-gray-900">All Listings</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">{treks.filter(t => t.isActive).length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Treks</p>
                  <p className="font-semibold text-gray-900">Live Listings</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-lg">{treks.filter(t => !t.isActive).length}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inactive Treks</p>
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
                    placeholder="Search treks..."
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
                Showing <span className="font-medium">{filteredTreks.length}</span> of <span className="font-medium">{treks.length}</span> treks
              </p>
            </div>
          </div>
        </div>

        {/* Trek Listings */}
        {filteredTreks.length === 0 ? (
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
            {filteredTreks.map((trek) => (
              <div key={trek._id} className={`
                bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group
                ${viewMode === "list" ? "flex items-center" : ""}
              `}>
                {/* Thumbnail */}
                <div className={`relative overflow-hidden ${
                  viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "h-48"
                }`}>
                  <img
                    src={trek.thumbnail}
                    alt={trek.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTAwIDgwQzEwNi42MjcgODAgMTEyIDg1LjM3MyAxMTIgOTJDMTEyIDk4LjYyNyAxMDYuNjI3IDEwNCAxMDAgMTA0Qzk5LjM3MyAxMDQgODggOTguNjI3IDg4IDkyQzg4IDg1LjM3MyA5My4zNzMgODAgMTAwIDgwWiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNjggMTIwSDMyVjE2MEgxNjhWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==";
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                      ${trek.isActive 
                        ? 'bg-green-100/90 text-green-800 border border-green-200/50' 
                        : 'bg-red-100/90 text-red-800 border border-red-200/50'
                      }
                    `}>
                      {trek.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
                      ${getDifficultyColor(trek.difficulty)}
                    `}>
                      {getDifficultyIcon(trek.difficulty)} {trek.difficulty}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                  <div className={viewMode === "list" ? "flex items-start justify-between" : ""}>
                    <div className={viewMode === "list" ? "flex-1 pr-6" : ""}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2" 
                          dangerouslySetInnerHTML={{ __html: trek.name }}>
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">{trek.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">{trek.duration}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
                          </svg>
                          <span className="text-sm">
                            {new Date(trek.startDate).toLocaleDateString()} → {new Date(trek.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex gap-2 ${viewMode === "list" ? "flex-col" : ""}`}>
                      <button
                        onClick={() => handleToggleStatus(trek._id)}
                        disabled={actionLoading === trek._id}
                        className={`
                          px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                          ${trek.isActive 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                          }
                          ${actionLoading === trek._id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                        `}
                      >
                        {actionLoading === trek._id ? (
                          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                        {trek.isActive ? "Deactivate" : "Activate"}
                      </button>
                      
                      {deleteConfirmId === trek._id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(trek._id)}
                            disabled={actionLoading === trek._id}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-all duration-200 flex items-center gap-1"
                          >
                            {actionLoading === trek._id ? (
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
                          onClick={() => setDeleteConfirmId(trek._id)}
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
    </div>
  );
};

export default ManageTreks;
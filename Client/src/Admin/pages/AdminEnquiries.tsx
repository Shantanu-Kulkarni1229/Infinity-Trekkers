import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiSearch, 
  FiFilter, 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiPhone, 
  FiMail, 
  FiUser, 
  FiMapPin, 
  FiRefreshCw 
} from "react-icons/fi";

interface Enquiry {
  _id: string;
  destination: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  message?: string;
  preferredDate?: string;
  status: "new" | "contacted" | "followup" | "converted" | "rejected";
  createdAt: string;
}

const statusColors = {
  new: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  contacted: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  followup: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  converted: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
} as const;

const getStatusColors = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || statusColors.new;
};

const AdminEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const limit = 10;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    fetchEnquiries();
  }, [page, statusFilter, search]);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (search.trim()) {
        params.destination = search.trim();
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await axios.get(`${API_BASE}/api/enquiries`, { params });

      if (res.data.success) {
        setEnquiries(res.data.data.enquiries || []);
        setTotalPages(res.data.data.meta?.pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err: any) {
      console.error("Error fetching enquiries:", err);
      setError(err.response?.data?.message || "Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await axios.put(`${API_BASE}/api/enquiries/${id}`, { status: newStatus });
      await fetchEnquiries(); // Refresh the list
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const handleStatusChange = (enquiryId: string, newStatus: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    updateStatus(enquiryId, newStatus);
  };

  const handleModalStatusChange = (newStatus: string) => {
    if (selectedEnquiry) {
      updateStatus(selectedEnquiry._id, newStatus);
      setSelectedEnquiry({ ...selectedEnquiry, status: newStatus as Enquiry["status"] });
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            page === i
              ? 'z-10 bg-sky-50 border-sky-500 text-sky-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Enquiries Dashboard</h1>
              <p className="text-sky-100">Manage and track customer enquiries</p>
            </div>
            <button 
              onClick={fetchEnquiries}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition bg-white"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="followup">Follow-up</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading enquiries...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No enquiries found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enquiries.map((enquiry) => (
                      <tr 
                        key={enquiry._id} 
                        className="hover:bg-sky-50 cursor-pointer transition"
                        onClick={() => setSelectedEnquiry(enquiry)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                              <FiMapPin className="text-sky-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{enquiry.destination}</div>
                              {enquiry.preferredDate && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <FiCalendar className="mr-1" />
                                  Pref: {formatDate(enquiry.preferredDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{enquiry.name || "N/A"}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <FiPhone className="mr-1" />
                            {enquiry.phoneNumber}
                          </div>
                          {enquiry.email && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <FiMail className="mr-1" />
                              {enquiry.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(enquiry.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColors(enquiry.status).bg} ${getStatusColors(enquiry.status).text}`}>
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={enquiry.status}
                            onChange={(e) => handleStatusChange(enquiry._id, e.target.value, e as any)}
                            onClick={(e) => e.stopPropagation()}
                            className={`block w-full pl-3 pr-10 py-2 text-base border ${getStatusColors(enquiry.status).border} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md bg-white`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="followup">Follow-up</option>
                            <option value="converted">Converted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {enquiries.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * limit, enquiries.length + (page - 1) * limit)}</span> of{' '}
                    <span className="font-medium">{totalPages * limit}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {renderPaginationButtons()}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Enquiry Details</h3>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md p-1"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Destination</h4>
                  <p className="text-lg font-medium text-gray-900 flex items-center">
                    <FiMapPin className="mr-2 text-sky-600" />
                    {selectedEnquiry.destination}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColors(selectedEnquiry.status).bg} ${getStatusColors(selectedEnquiry.status).text}`}>
                    {selectedEnquiry.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
                  <p className="text-gray-900 flex items-center">
                    <FiUser className="mr-2 text-sky-600" />
                    {selectedEnquiry.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                  <p className="text-gray-900 flex items-center">
                    <FiPhone className="mr-2 text-sky-600" />
                    {selectedEnquiry.phoneNumber}
                  </p>
                </div>
                {selectedEnquiry.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                    <p className="text-gray-900 flex items-center">
                      <FiMail className="mr-2 text-sky-600" />
                      {selectedEnquiry.email}
                    </p>
                  </div>
                )}
                {selectedEnquiry.preferredDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Preferred Date</h4>
                    <p className="text-gray-900 flex items-center">
                      <FiCalendar className="mr-2 text-sky-600" />
                      {formatDate(selectedEnquiry.preferredDate)}
                    </p>
                  </div>
                )}
                <div className={selectedEnquiry.email ? "md:col-span-1" : "md:col-span-2"}>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Enquiry Date</h4>
                  <p className="text-gray-900">{formatDate(selectedEnquiry.createdAt)}</p>
                </div>
                {selectedEnquiry.message && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Message</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">{selectedEnquiry.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <select
                value={selectedEnquiry.status}
                onChange={(e) => handleModalStatusChange(e.target.value)}
                className={`block pl-3 pr-10 py-2 text-base border ${getStatusColors(selectedEnquiry.status).border} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md bg-white`}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="followup">Follow-up</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnquiries;
import React, { useEffect, useState } from "react";

interface Trek {
  _id: string;
  name: string;
  thumbnail?: string;
}

interface Feedback {
  _id: string;
  name: string;
  trek: Trek;
  date: string;
  photo?: string;
  feedback: string;
  starRating: number;
  isVisible: boolean;
}

const AdminFeedbackDashboard: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

  // Fetch all feedbacks
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/feedback`);
      if (!response.ok) throw new Error("Failed to fetch feedbacks");
      const data = await response.json();
      setFeedbacks(data.data || []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError("Failed to load feedbacks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [refresh]);

  // Toggle visibility
  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isVisible: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to update visibility");

      setFeedbacks((prev) =>
        prev.map((f) =>
          f._id === id ? { ...f, isVisible: !currentStatus } : f
        )
      );
    } catch (err) {
      console.error("Error updating visibility:", err);
      setError("Failed to update visibility. Please try again.");
    }
  };

  // Delete feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/feedback/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feedback");

      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Error deleting feedback:", err);
      setError("Failed to delete feedback. Please try again.");
    }
  };

  // ✅ Sanitize Quill text (remove <p>, <br>, <div>, and other HTML tags)
  const stripHtmlTags = (html: string) => {
    return html
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<div>/gi, "")
      .replace(/<\/div>/gi, "")
      .replace(/<\/?[^>]+(>|$)/g, "") // removes any other remaining tags
      .trim();
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-600 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => setRefresh(!refresh)}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Feedback Management
              </h1>
              <p className="text-gray-600">
                Monitor and manage customer feedback for your treks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Total:{" "}
                <span className="font-semibold text-sky-600">
                  {feedbacks.length}
                </span>
              </div>
              <button
                onClick={() => setRefresh(!refresh)}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors duration-200 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No feedback yet
              </h3>
              <p className="text-gray-500">
                Customer feedback will appear here once submitted
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trek
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedbacks.map((fb, index) => (
                    <tr
                      key={fb._id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {fb.photo ? (
                            <img
                              src={fb.photo}
                              alt={fb.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-user.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center border-2 border-sky-100">
                              <span className="text-sky-600 font-semibold text-sm">
                                {fb.name
                                  ? fb.name.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {fb.name || "Anonymous"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trek */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {fb.trek?.thumbnail ? (
                            <img
                              src={fb.trek.thumbnail}
                              alt={fb.trek.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder-trek.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {fb.trek?.name || "Unknown Trek"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">
                            {fb.starRating}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < fb.starRating
                                    ? "text-yellow-400"
                                    : "text-gray-200"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Feedback */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="group relative">
                          <p className="text-gray-900 text-sm line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                            {stripHtmlTags(fb.feedback)}
                          </p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {fb.date
                            ? new Date(fb.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "No date"}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() =>
                              handleToggleVisibility(fb._id, fb.isVisible)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                              fb.isVisible ? "bg-sky-600" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                fb.isVisible
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`ml-2 text-xs font-medium ${
                              fb.isVisible
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {fb.isVisible ? "Visible" : "Hidden"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteFeedback(fb._id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete feedback"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackDashboard;

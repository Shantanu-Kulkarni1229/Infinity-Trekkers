// src/Admin/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="h-full bg-white shadow-xl lg:shadow-none lg:border-r lg:border-gray-200">
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Open sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
            <span className="text-white text-sm font-medium">A</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden backdrop-blur-sm">
                <div className="p-4 sm:p-6 lg:p-8">
                  {location.pathname === "/admin/dashboard" ? (
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-blue-700 mb-4">
                        🌄 Welcome to Infinity Trekkers Admin Portal
                      </h1>
                      <p className="text-gray-600 max-w-2xl mx-auto mb-10">
                        Manage treks, bookings, feedback, and inquiries all in one place. 
                        Empower your trekking adventures with seamless administration!
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-lg transition">
                          <h3 className="text-xl font-semibold text-blue-700 mb-2">🗻 Manage Treks</h3>
                          <p className="text-gray-600 text-sm">
                            Add, edit, and organize trekking adventures for explorers.
                          </p>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl shadow hover:shadow-lg transition">
                          <h3 className="text-xl font-semibold text-green-700 mb-2">📦 Bookings</h3>
                          <p className="text-gray-600 text-sm">
                            Track and manage all trek bookings efficiently.
                          </p>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-xl shadow hover:shadow-lg transition">
                          <h3 className="text-xl font-semibold text-purple-700 mb-2">💬 Feedback</h3>
                          <p className="text-gray-600 text-sm">
                            Read and analyze customer feedback to improve experiences.
                          </p>
                        </div>
                      </div>

                      <div className="mt-10">
                        <p className="text-gray-500 italic">
                          "Adventure begins with great leadership – let's guide the trekkers to new heights."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Outlet />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

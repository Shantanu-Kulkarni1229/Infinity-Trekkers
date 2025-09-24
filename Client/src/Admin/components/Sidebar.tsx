// src/Admin/components/Sidebar.tsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  closeSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async (): Promise<void> => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("adminKey");
      navigate("/admin");
      setIsLoggingOut(false);
    }, 800);
  };

  const baseClass =
    "group flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 font-medium relative";
  const activeClass =
    "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25";
  const hoverClass =
    "hover:bg-gray-800/50 hover:text-blue-300 hover:translate-x-1 hover:shadow-md";

  const navLinks = [
    { to: "/admin/dashboard/add", label: "Add Trek" },
    { to: "/admin/dashboard/manage", label: "Manage Treks" },
    { to: "/admin/dashboard/bookings", label: "Trek Bookings" },
    { to: "/admin/dashboard/add-tour", label: "Add Tour" },
    { to: "/admin/dashboard/manage-tours", label: "Manage Tours" },
    { to: "/admin/dashboard/tour-bookings", label: "Tour Bookings" },
    { to: "/admin/dashboard/enquiries", label: "See Enquiries" },
    { to: "/admin/dashboard/user-feedback", label: "See Feedbacks" },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col h-full">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-400">Trek Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
          Navigation
        </p>

        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            onClick={closeSidebar}
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : hoverClass}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex-1">{link.label}</span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Status Section */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">
              System Status
            </span>
          </div>
          <p className="text-xs text-gray-400">All systems operational</p>
        </div>
      </nav>

      {/* Footer Section with Logout */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={logout}
          disabled={isLoggingOut}
          className={`w-full group flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
            isLoggingOut
              ? "bg-red-600/20 text-red-300 cursor-not-allowed"
              : "text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:translate-x-1 hover:shadow-md"
          }`}
        >
          <div
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
              isLoggingOut ? "animate-spin" : "group-hover:scale-110"
            }`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <span className="flex-1 text-left">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>

        {/* User Info */}
        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">Admin User</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

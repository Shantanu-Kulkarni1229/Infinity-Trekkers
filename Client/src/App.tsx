// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Components/Home/Home";
import UpComingTrekPage from "./Components/UpComingTreks/UpComingTrekPage";
import UpComingToursPage from "./Components/UpComingTours/UpComingToursPage";
import Gallery from "./Components/Gallery/Gallery";
import OurServices from "./Components/Services/OurServices";
import Navbar from "./Components/Home/Header/Navbar";
import Footer from "./Components/Home/Footer/Footer";
import AdminLogin from "./Admin/pages/AdminLogin.js";
import Dashboard from "./Admin/pages/Dashboard.js";
import AddTrek from "./Admin/pages/AddTrek.js";
import ManageTreks from "./Admin/pages/ManageTreks.js";
import Bookings from "./Admin/pages/Bookings.js";
import BookTrek from "./Components/Home/Main-Section/BookTrek.js";
import BookTour from "./Components/Home/Main-Section/BookTour";

import AdminEnquiries from "./Admin/pages/AdminEnquiries.js";
import AdminFeedbackDashboard from "./Admin/pages/AdminFeedbackDashboard.js";
import OfflineBooking from "./Admin/pages/OfflineBooking";


function AppContent() {
  const location = useLocation();
  const isAdminAuthenticated =
    localStorage.getItem("adminKey") === import.meta.env.VITE_ADMIN_KEY;

  // Hide Navbar and Footer for any route starting with /admin
  const isAdminRoute = location.pathname.startsWith("/admin");
  const whatsappHref = "https://wa.me/917666869100?text=Hello%20Infinity%20Trekkers%2C%20I%20want%20to%20know%20more%20about%20your%20treks%20and%20tours.";

  return (
    <div>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upcoming-trek" element={<UpComingTrekPage />} />
        <Route path="/upcoming-tours" element={<UpComingToursPage />} />
        <Route path="/services" element={<OurServices />} />
        <Route path="/book/:trekId" element={<BookTrek />} />
        <Route path="/book-tour/:tourId" element={<BookTour />} />
        <Route path="/gallery" element={<Gallery />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            isAdminAuthenticated ? <Dashboard /> : <Navigate to="/admin" />
          }
        >
          <Route path="add" element={<AddTrek />} />
          <Route path="manage" element={<ManageTreks />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="offline-booking" element={<OfflineBooking />} />
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="user-feedback" element={<AdminFeedbackDashboard />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}

      {!isAdminRoute && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 sm:bottom-6 sm:right-6"
        >
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="currentColor">
            <path d="M19.11 17.06c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.19.29-.75.95-.92 1.14-.17.2-.34.22-.63.08-.29-.15-1.24-.45-2.37-1.43-.88-.78-1.48-1.75-1.65-2.04-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.6-.91-2.2-.24-.57-.49-.49-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-.99 2.43.02 1.43 1.02 2.8 1.16 2.99.15.2 2.02 3.2 5 4.36.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34z" />
            <path d="M16.01 3.2c-6.95 0-12.6 5.65-12.6 12.6 0 2.22.58 4.38 1.68 6.29L3.2 28.8l6.92-1.82a12.55 12.55 0 0 0 5.89 1.5h.01c6.95 0 12.6-5.65 12.6-12.6 0-3.37-1.31-6.54-3.7-8.93a12.53 12.53 0 0 0-8.91-3.75zm0 23.15h-.01a10.5 10.5 0 0 1-5.35-1.47l-.38-.22-4.11 1.08 1.1-4-.24-.41a10.5 10.5 0 1 1 8.99 5.02z" />
          </svg>
        </a>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

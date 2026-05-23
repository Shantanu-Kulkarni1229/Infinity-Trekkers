// src/App.tsx
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
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
import BookTour from "./Components/Home/Main-Section/BookTour.js";

import AdminEnquiries from "./Admin/pages/AdminEnquiries.js";
import AdminFeedbackDashboard from "./Admin/pages/AdminFeedbackDashboard.js";
import OfflineBooking from "./Admin/pages/OfflineBooking";


function AppContent() {
  const location = useLocation();
  const [isWhatsAppPopupOpen, setIsWhatsAppPopupOpen] = useState(false);
  const isAdminAuthenticated =
    localStorage.getItem("adminKey") === import.meta.env.VITE_ADMIN_KEY;

  // Hide Navbar and Footer for any route starting with /admin
  const isAdminRoute = location.pathname.startsWith("/admin");
  const whatsappMessage = "Hello Infinity Trekkers, I want to know more about your treks and tours.";
  const whatsappContacts = [
    {
      label: "Chhatrapati Sambhajinagar / Ahilyanagr",
      number: "8265085025",
    },
    {
      label: "Mumbai/Pune",
      number: "7400277816",
    },
  ];

  const openWhatsAppChat = (number: string) => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/91${number}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
    setIsWhatsAppPopupOpen(false);
  };

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
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
          {isWhatsAppPopupOpen && (
            <div
              role="dialog"
              aria-label="Choose WhatsApp contact"
              className="mr-0 w-[280px] rounded-2xl border border-white/20 bg-[#0f172a] p-4 text-white shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Choose a WhatsApp contact</p>
                  <p className="mt-1 text-xs text-white/70">Select the branch you want to message.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWhatsAppPopupOpen(false)}
                  aria-label="Close WhatsApp contact chooser"
                  className="rounded-full px-2 py-1 text-lg leading-none text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                {whatsappContacts.map((contact) => (
                  <button
                    key={contact.number}
                    type="button"
                    onClick={() => openWhatsAppChat(contact.number)}
                    className="w-full rounded-xl bg-white/10 px-3 py-3 text-left text-sm transition hover:bg-white/20"
                  >
                    <div className="font-medium">{contact.label}</div>
                    <div className="text-xs text-white/70">{contact.number}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsWhatsAppPopupOpen((current) => !current)}
            aria-label="Open WhatsApp contact chooser"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] p-0 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
          >
            <FaWhatsapp className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>
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

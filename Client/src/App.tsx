// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Components/Home/Home";
import UpComingTrekPage from "./Components/UpComingTreks/UpComingTrekPage";
import Gallery from "./Components/Gallery/Gallery";
import Navbar from "./Components/Home/Header/Navbar";
import Footer from "./Components/Home/Footer/Footer";
import AdminLogin from "./Admin/pages/AdminLogin.js";
import Dashboard from "./Admin/pages/Dashboard.js";
import AddTrek from "./Admin/pages/AddTrek.js";
import ManageTreks from "./Admin/pages/ManageTreks.js";
import Bookings from "./Admin/pages/Bookings.js";
import BookTrek from "./Components/Home/Main-Section/BookTrek.js";
import AdminEnquiries from "./Admin/pages/AdminEnquiries.js";
import AdminFeedbackDashboard from "./Admin/pages/AdminFeedbackDashboard.js";


function AppContent() {
  const location = useLocation();
  const isAdminAuthenticated =
    localStorage.getItem("adminKey") === import.meta.env.VITE_ADMIN_KEY;

  // Hide Navbar and Footer for any route starting with /admin
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upcoming-trek" element={<UpComingTrekPage />} />
        <Route path="/book/:trekId" element={<BookTrek />} />
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
          <Route path="enquiries" element={<AdminEnquiries />} />
          <Route path="user-feedback" element={<AdminFeedbackDashboard />} />
        </Route>
      </Routes>
      {!isAdminRoute && <Footer />}
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

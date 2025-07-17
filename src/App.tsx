// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import your components
import Home from "./Components/Home/Home";
import UpComingTrekPage from "./Components/UpComingTreks/UpComingTrekPage";
import Gallery from "./Components/Gallery/Gallery";
// import AboutUs from "./Components/AboutUs/AboutUs";
// import ContactUs from "./Components/ContactUs/ContactUs";
import Navbar from "./Components/Home/Header/Navbar";
import Footer from "./Components/Home/Footer/Footer";


function App() {
  return (
    <Router>
      <div>
        
        <Navbar />
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upcoming-trek" element={<UpComingTrekPage />} />
        <Route path="/gallery" element={<Gallery />} />
        {/* <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} /> */}
        
      </Routes>
      <Footer />
      </div>
      
    </Router>
  );
}

export default App;

// src/App.tsx
import HeroSection from "./Main-Section/Hero";
import UpcomingTreks from "./Main-Section/UpComingTreks";
import Testimonials from "./Main-Section/Testomonial";

function Home() {
  return (
    <div style={{ backgroundColor: "#F5F7F6", color: "#1E1E22", minHeight: "100vh" }}>
      
      <HeroSection />
      <UpcomingTreks />
      <Testimonials />
      

    </div>
  );
}

export default Home;

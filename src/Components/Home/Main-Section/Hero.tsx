import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import {  Mountain, Users, Award } from "lucide-react";

import trek1 from "../../../assets/Hero-Section/6.png";
import { Link } from "react-router-dom";

const images = [trek1];

const stats = [
  { icon: Mountain, value: "50+", label: "Adventures" },
  { icon: Users, value: "2K+", label: "Explorers" },
  { icon: Award, value: "4.", label: "Rating" }
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

 

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden bg-gray-900">
      <div className="absolute inset-0 w-full h-full">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          speed={1500}
          slidesPerView={1}
          spaceBetween={0}
          className="w-full h-full swiper-container"
          onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex)}
          onSwiper={(swiper) => swiper.autoplay.start()}
        >
          {images.map((_src, index) => (
            <SwiperSlide key={index} className="w-full h-full">
              <div className="relative w-full h-full">
                <img
                  src='https://t4.ftcdn.net/jpg/04/61/16/55/360_F_461165568_Hy89OZHJIOI3I0opphdN4NNWCURcYOCA.jpg'
                  alt={`Adventure ${index + 1}`}
                  className="w-full h-full object-cover object-center min-h-screen min-w-full"
                />
                {/* <video src="https://cdn.pixabay.com/video/2024/07/03/219300_large.mp4" autoPlay muted loop={true}
                  className="w-full h-full object-cover object-center min-h-screen min-w-full"></video> */}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10" />

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className={`text-center space-y-4 sm:space-y-6 lg:space-y-8 max-w-4xl mx-auto w-full transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="space-y-1 sm:space-y-2 lg:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white leading-tight tracking-tight">
              INFINITY
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-emerald-400 tracking-wider">
              TREKKERS INDIA
            </h2>
          </div>

          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-cyan-300 font-medium">
              Adventure Awaits Beyond
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed px-2">
              Discover breathtaking trails, conquer majestic peaks, and create memories that last forever with fellow adventurers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-6">
            <Link to='/upcoming-trek' onClick={() => {

              window.scrollTo(0, 0); // Scrolls to top
            }} className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-base sm:text-lg rounded-full hover:from-emerald-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-emerald-500/25 min-w-[160px] sm:min-w-[180px]">
              Start Adventure
            </Link>

            <Link to='/gallery ' onClick={() => {

              window.scrollTo(0, 0); // Scrolls to top
            }} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/30 text-white font-medium text-base sm:text-lg rounded-full hover:bg-white/10 hover:border-white/50 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm min-w-[160px] sm:min-w-[180px]">
              See Trek Moments
            </Link>
          </div>
        </div>

        <div className={`mt-8 sm:mt-12 lg:mt-16 w-full max-w-3xl transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="space-y-1 sm:space-y-2">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto group-hover:text-cyan-300 transition-colors duration-300" />
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-300">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-30 hidden sm:block">
        
      </div>

      <div className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-30 flex space-x-2 sm:space-x-3">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500 ${currentSlide === index ? 'bg-emerald-400 w-6 sm:w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
          />
        ))}
      </div>

      <div className="absolute top-20 left-10 w-4 h-4 bg-emerald-400/20 rounded-full animate-ping hidden xl:block" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-cyan-400/20 rounded-full animate-pulse hidden xl:block" />
      <div className="absolute bottom-40 left-20 w-2 h-2 bg-emerald-400/30 rounded-full animate-bounce hidden xl:block" />
    </div>
  );
};

export default HeroSection;

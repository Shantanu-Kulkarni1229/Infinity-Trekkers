import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../../assets/Logo/logo.png";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Upcoming Treks", href: "/upcoming-trek" },
  { name: "Gallery", href: "/gallery" },
  // { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" }
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const location = useLocation();

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  // Sync active link with current route
  useEffect(() => {
    const currentLink = NAV_LINKS.find(link => 
      location.pathname === link.href || 
      (link.href !== "/" && location.pathname.startsWith(link.href))
    );
    if (currentLink) {
      setActiveLink(currentLink.name);
    }
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLinkClick = (linkName) => {
    setActiveLink(linkName);
    setIsMenuOpen(false);
  };

  return (
    <header 
      className={`sticky top-0 z-50 shadow-lg bg-white/95 backdrop-blur-sm ${
        isScrolled ? "py-2" : "py-3"
      } transition-[padding] duration-300 ease-in-out`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo and Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 group"
            onClick={() => handleLinkClick("Home")}
            aria-label="Home"
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <div className="relative flex items-center justify-center h-full w-full">
                <img
                  src={logo}
                  alt="Infinity Trekkers Logo"
                  className="h-full w-full transition-opacity duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                
                {/* Enhanced fallback logo */}
                <div
                  className="hidden items-center justify-center h-full w-full bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] rounded-full"
                >
                  <span className="text-white font-bold">🏔️</span>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#0ea5e9] opacity-0 group-hover:opacity-20 blur-md rounded-full transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            {/* Brand text */}
            <div className="flex flex-col min-w-0">
              <span className={`font-bold tracking-wide uppercase leading-tight bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] bg-clip-text text-transparent ${
                isScrolled 
                  ? "text-sm sm:text-base" 
                  : "text-base sm:text-lg"
              } transition-[font-size] duration-300`}>
                <span className="hidden xs:inline sm:hidden md:inline">Infinity Trekkers India</span>
                <span className="xs:hidden sm:inline md:hidden">Infinity Trekkers India</span>
                <span className="xs:hidden"></span>
              </span>
              
              {/* Tagline */}
              <span className={`text-[#053d5c] opacity-70 leading-tight ${
                isScrolled 
                  ? "text-xs hidden sm:block" 
                  : "text-xs sm:text-sm hidden sm:block"
              } transition-[font-size] duration-300`}>
                <span className="hidden md:inline">Adventure Awaits </span>
                <span className="md:hidden">Adventure Awaits</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-3 py-2 font-medium text-base transition-colors duration-200 relative group ${
                  activeLink === link.name
                    ? "text-[#0369a1] font-semibold"
                    : "text-[#0ea5e9] hover:text-[#0284c7]"
                }`}
                onClick={() => handleLinkClick(link.name)}
                aria-current={activeLink === link.name ? "page" : undefined}
              >
                {link.name}
                
                {/* Active indicator */}
                <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                  activeLink === link.name 
                    ? "w-4/5 opacity-100" 
                    : "w-0 opacity-0 group-hover:w-4/5 group-hover:opacity-100"
                }`}></span>
              </Link>
            ))}
          </div>

          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {NAV_LINKS.slice(0, 3).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-2 py-2 font-medium text-base transition-colors duration-200 relative group ${
                  activeLink === link.name
                    ? "text-[#0369a1] font-semibold"
                    : "text-[#0ea5e9] hover:text-[#0284c7]"
                }`}
                onClick={() => handleLinkClick(link.name)}
                aria-current={activeLink === link.name ? "page" : undefined}
              >
                {link.name === "Upcoming Treks" ? "Treks" : link.name}
                
                <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                  activeLink === link.name 
                    ? "w-4/5 opacity-100" 
                    : "w-0 opacity-0 group-hover:w-4/5 group-hover:opacity-100"
                }`}></span>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          {/* <div className="hidden md:flex items-center ml-4">
            <Link 
              to="/book-trek" 
              className="bg-[#0ea5e9] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#0284c7] transition-colors duration-300 hover:shadow-md active:scale-95 whitespace-nowrap"
              aria-label="Book a trek"
            >
              Book Trek
            </Link>
          </div> */}

          {/* Mobile menu button */}
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-[#0ea5e9]/10 transition-colors duration-300 text-[#0ea5e9]"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? (
                <X size={24} className="transition-transform duration-300" />
              ) : (
                <Menu size={24} className="transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-out overflow-hidden bg-white ${
            isMenuOpen 
              ? "max-h-screen opacity-100 visible" 
              : "max-h-0 opacity-0 invisible"
          }`}
          aria-hidden={!isMenuOpen}
        >
          <div className="px-4 py-3 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`block px-4 py-3 rounded-lg font-medium text-base transition-colors duration-200 ${
                  activeLink === link.name
                    ? "bg-[#0ea5e9]/10 text-[#0369a1] font-semibold border-l-4 border-[#0ea5e9]"
                    : "text-[#0ea5e9] hover:bg-[#0ea5e9]/5 hover:text-[#0284c7]"
                }`}
                onClick={() => handleLinkClick(link.name)}
                aria-current={activeLink === link.name ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile CTA */}
            {/* <div className="pt-3">
              <Link 
                to="/book-trek"
                className="w-full block text-center bg-[#0ea5e9] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0284c7] transition-colors duration-300 active:scale-95 shadow-md"
                aria-label="Book your trek"
              >
                Book Your Trek
              </Link>
            </div> */}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
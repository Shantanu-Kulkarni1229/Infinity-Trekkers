import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../../assets/Logo/logo.png";

interface NavLink {
  name: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Upcoming Treks", href: "/upcoming-trek" },
  { name: "Gallery", href: "/gallery" },
  // { name: "Contact", href: "/contact" }
];

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeLink, setActiveLink] = useState<string>("Home");
  const location = useLocation();

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    const currentLink = NAV_LINKS.find(
      (link) =>
        location.pathname === link.href ||
        (link.href !== "/" && location.pathname.startsWith(link.href))
    );
    if (currentLink) {
      setActiveLink(currentLink.name);
    }
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLinkClick = (linkName: string) => {
    setActiveLink(linkName);
    setIsMenuOpen(false);
    // Scroll to top when a link is clicked
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <header
      className={`sticky top-0 z-50 shadow-lg bg-white/95 backdrop-blur-sm ${
        isScrolled ? "py-2" : "py-3"
      } transition-[padding] duration-300 ease-in-out`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 group"
            onClick={() => handleLinkClick("Home")}
            aria-label="Home"
          >
            <div className="relative h-8 w-8 sm:h-18 sm:w-18 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <div className="relative flex items-center justify-center h-full w-full">
                <img
                  src={logo}
                  alt="Infinity Trekkers Logo"
                  className="h-full w-full transition-opacity duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="hidden items-center justify-center h-full w-full bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] rounded-full">
                  <span className="text-white font-bold">🏔️</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-[#0ea5e9] opacity-0 group-hover:opacity-20 blur-md rounded-full transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className={`font-bold tracking-wide uppercase leading-tight bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] bg-clip-text text-transparent ${
                  isScrolled ? "text-sm sm:text-base" : "text-base sm:text-lg"
                } transition-[font-size] duration-300`}
              >
                Infinity Trekkers India
              </span>
              <span
                className={`text-[#053d5c] opacity-70 leading-tight ${
                  isScrolled
                    ? "text-xs hidden sm:block"
                    : "text-xs sm:text-sm hidden sm:block"
                } transition-[font-size] duration-300`}
              >
                Stay Beyond Limits
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
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
                <span
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                    activeLink === link.name
                      ? "w-4/5 opacity-100"
                      : "w-0 opacity-0 group-hover:w-4/5 group-hover:opacity-100"
                  }`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Tablet Nav */}
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
                <span
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                    activeLink === link.name
                      ? "w-4/5 opacity-100"
                      : "w-0 opacity-0 group-hover:w-4/5 group-hover:opacity-100"
                  }`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
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

        {/* Mobile Menu */}
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
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
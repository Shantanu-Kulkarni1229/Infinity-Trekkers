import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import logo from "../../../assets/Logo/logo.png";

interface NavLink {
  name: string;
  href: string;
}

interface SearchItem {
  id: string;
  name: string;
  type: "trek" | "tour";
}

const NAV_LINKS: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Upcoming Treks", href: "/upcoming-trek" },
  { name: "Upcoming Tours", href: "/upcoming-tours" },
  { name: "Services", href: "/services" },
  { name: "Gallery", href: "/gallery" },
  // { name: "Contact", href: "/contact" }
];

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeLink, setActiveLink] = useState<string>("Home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchData, setSearchData] = useState<SearchItem[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

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

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        setIsSearchLoading(true);
        const [treksRes, toursRes] = await Promise.all([
          fetch(`${API_BASE}/api/treks`),
          fetch(`${API_BASE}/api/tours`).catch(() => null),
        ]);

        const treksJson = treksRes.ok ? await treksRes.json() : { data: [] };
        const toursJson = toursRes && toursRes.ok ? await toursRes.json() : { data: [] };

        const treks = (treksJson.data || treksJson || [])
          .filter((item: { isActive?: boolean }) => item.isActive)
          .map((item: { _id?: string; id?: string; name?: string }) => ({
            id: item._id || item.id || "",
            name: String(item.name || "").replace(/<[^>]*>/g, "").trim(),
            type: "trek" as const,
          }))
          .filter((item: SearchItem) => item.id && item.name);

        const tours = (toursJson.data || toursJson || [])
          .filter((item: { isActive?: boolean }) => item.isActive)
          .map((item: { _id?: string; id?: string; name?: string }) => ({
            id: item._id || item.id || "",
            name: String(item.name || "").replace(/<[^>]*>/g, "").trim(),
            type: "tour" as const,
          }))
          .filter((item: SearchItem) => item.id && item.name);

        setSearchData([...treks, ...tours]);
      } catch (error) {
        console.error("Failed to load navbar search data:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    fetchSearchData();
  }, [API_BASE]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const isHomePage = location.pathname === "/";

  const handleLinkClick = (linkName: string) => {
    setActiveLink(linkName);
    setIsMenuOpen(false);
    // Scroll to top when a link is clicked
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const filteredSearchResults = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];

    return searchData
      .filter((item) => item.name.toLowerCase().includes(trimmed))
      .slice(0, 8);
  }, [searchData, searchQuery]);

  const handleSearchSelect = (item: SearchItem) => {
    setSearchQuery(item.name);
    setShowSearchDropdown(false);
    setIsMenuOpen(false);
    navigate(item.type === "trek" ? `/book/${item.id}` : `/book-tour/${item.id}`);
  };

  const searchInputClasses = `w-full rounded-full border px-4 py-2 pl-10 pr-3 text-sm outline-none transition-colors ${
    isHomePage
      ? "border-white/35 bg-white/15 text-white placeholder:text-white/75 focus:border-emerald-300"
      : "border-[#0ea5e9]/30 bg-white text-[#0a3550] placeholder:text-[#0a3550]/55 focus:border-[#0ea5e9]"
  }`;

  return (
    <header
      className={`${isHomePage ? "absolute top-0 left-0 right-0 z-50 shadow-none bg-transparent" : "sticky top-0 z-50 shadow-lg bg-white backdrop-blur-sm"} ${
        isScrolled && !isHomePage ? "py-2" : isHomePage ? "py-4 sm:py-5" : "py-3"
      } transition-[padding,background-color,box-shadow] duration-300 ease-in-out`}
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
            <div className="relative h-8 w-8 sm:h-16 sm:w-16 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
                className={`font-bold tracking-wide uppercase leading-tight bg-clip-text ${
                  isHomePage
                    ? "text-white bg-gradient-to-r from-white to-emerald-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                    : "bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] text-transparent"
                } ${
                  isScrolled && !isHomePage ? "text-sm sm:text-base" : "text-base sm:text-lg"
                } transition-[font-size] duration-300`}
              >
                Infinity Trekkers India
              </span>
              <span
                className={`leading-tight hidden sm:block ${
                  isHomePage ? "text-white/75" : "text-[#053d5c] opacity-70"
                } ${
                  isScrolled && !isHomePage ? "text-xs" : "text-xs sm:text-sm"
                } transition-[font-size,color] duration-300`}
              >
               The world of Adventure
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
                    ? isHomePage
                      ? "text-white font-semibold"
                      : "text-[#0369a1] font-semibold"
                    : isHomePage
                      ? "text-white/85 hover:text-white"
                      : "text-[#0ea5e9] hover:text-[#0284c7]"
                }`}
                onClick={() => handleLinkClick(link.name)}
                aria-current={activeLink === link.name ? "page" : undefined}
              >
                {link.name}
                <span
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                    activeLink === link.name
                      ? isHomePage
                        ? "w-4/5 opacity-100 bg-emerald-300"
                        : "w-4/5 opacity-100"
                      : isHomePage
                        ? "w-0 opacity-0 bg-emerald-300 group-hover:w-4/5 group-hover:opacity-100"
                        : "w-0 opacity-0 group-hover:w-4/5 group-hover:opacity-100"
                  }`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Search */}
          <div ref={searchContainerRef} className="hidden md:block relative w-64 lg:w-72 xl:w-80 mx-3">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isHomePage ? "text-white/80" : "text-[#0ea5e9]"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search treks & tours"
              className={searchInputClasses}
              aria-label="Search treks and tours"
            />

            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute right-0 left-0 mt-2 max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl z-50">
                {isSearchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-600">Loading options...</div>
                ) : filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSearchSelect(item)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-[#e6f7ff]"
                    >
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs uppercase tracking-wide text-[#0284c7]">{item.type}</p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-600">No matching treks or tours found</div>
                )}
              </div>
            )}
          </div>

          {/* Tablet Nav */}
          <div className="hidden md:flex lg:hidden items-center space-x-1">
            {NAV_LINKS.slice(0, 3).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-2 py-2 font-medium text-base transition-colors duration-200 relative group ${
                  activeLink === link.name
                    ? isHomePage
                      ? "text-white font-semibold"
                      : "text-[#0369a1] font-semibold"
                    : isHomePage
                      ? "text-white/85 hover:text-white"
                      : "text-[#0ea5e9] hover:text-[#0284c7]"
                }`}
                onClick={() => handleLinkClick(link.name)}
                aria-current={activeLink === link.name ? "page" : undefined}
              >
                {link.name === "Upcoming Treks" ? "Treks" : link.name}
                <span
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-[#0ea5e9] transition-all duration-300 ${
                    activeLink === link.name
                      ? isHomePage
                        ? "w-4/5 opacity-100 bg-emerald-300"
                        : "w-4/5 opacity-100"
                      : isHomePage
                        ? "w-0 opacity-0 bg-emerald-300 group-hover:w-4/5 group-hover:opacity-100"
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
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isHomePage ? "text-white hover:bg-white/10" : "text-[#0ea5e9] hover:bg-[#0ea5e9]/10"
              }`}
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
          className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${
            isHomePage ? "bg-[#071c22]/95 backdrop-blur-xl" : "bg-white"
          } ${
            isMenuOpen
              ? "max-h-screen opacity-100 visible"
              : "max-h-0 opacity-0 invisible"
          }`}
          aria-hidden={!isMenuOpen}
        >
          <div className="px-4 py-3 space-y-2">
            <div className="relative mb-3">
              <Search
                size={16}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isHomePage ? "text-white/80" : "text-[#0ea5e9]"
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search treks & tours"
                className={searchInputClasses}
                aria-label="Search treks and tours"
              />

              {showSearchDropdown && searchQuery.trim() && (
                <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {isSearchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-600">Loading options...</div>
                  ) : filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((item) => (
                      <button
                        key={`mobile-${item.type}-${item.id}`}
                        type="button"
                        onClick={() => handleSearchSelect(item)}
                        className="w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-[#e6f7ff]"
                      >
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs uppercase tracking-wide text-[#0284c7]">{item.type}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-600">No matching treks or tours found</div>
                  )}
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`block px-4 py-3 rounded-lg font-medium text-base transition-colors duration-200 ${
                  activeLink === link.name
                    ? isHomePage
                      ? "bg-white/10 text-white font-semibold border-l-4 border-emerald-300"
                      : "bg-[#0ea5e9]/10 text-[#0369a1] font-semibold border-l-4 border-[#0ea5e9]"
                    : isHomePage
                      ? "text-white/85 hover:bg-white/8 hover:text-white"
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
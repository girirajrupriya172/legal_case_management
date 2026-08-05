import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import { useDebounce } from "../hooks/useDebounce";
import { searchService } from "../services/searchService";

export default function Header({ onToggleMobileMenu }) {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  // Global Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 350);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Close search dropdown and profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch debounced search results from FastAPI
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const data = await searchService.globalSearch(debouncedSearch, 5);
        setSearchResults(data);
        setIsSearchOpen(true);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    if (isNotificationsOpen) setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logoutUser();
    navigate("/login", { replace: true });
  };

  const handleResultClick = (path) => {
    setIsSearchOpen(false);
    setSearchTerm("");
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant flex justify-between items-center w-full px-4 sm:px-margin-page py-2.5 transition-all">
      {/* Left side: Mobile Hamburger menu and Global Search */}
      <div className="flex items-center gap-3 sm:gap-gutter flex-1">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors focus-ring btn-press cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-full max-w-sm sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            {isSearching ? "hourglass_empty" : "search"}
          </span>
          <input
            className="w-full pl-10 pr-9 py-2 bg-surface-container-low border border-outline-variant/80 rounded-full text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all placeholder:text-outline"
            placeholder="Search cases, documents, or clients..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchResults && searchTerm.trim()) setIsSearchOpen(true);
            }}
            aria-label="Search cases, documents, or clients"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSearchResults(null);
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5 rounded-full hover:bg-surface-container-high transition-colors focus-ring"
              aria-label="Clear search query"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}

          {/* Global Search Dropdown Overlay */}
          {isSearchOpen && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto p-3 animate-scale-in custom-scrollbar">
              {searchResults.total_results === 0 ? (
                <div className="py-6 text-center text-on-surface-variant text-xs sm:text-sm">
                  No records found matching "<strong className="text-on-surface">{searchTerm}</strong>"
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Clients matches */}
                  {searchResults.clients && searchResults.clients.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider px-2 py-1 bg-amber-50 rounded-md flex items-center justify-between">
                        <span>Clients</span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded-full">
                          {searchResults.clients.length}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.clients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => handleResultClick("/clients")}
                            className="px-3 py-2 hover:bg-surface-container-high rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {client.full_name}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {client.email} • {client.phone}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">
                              chevron_right
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cases matches */}
                  {searchResults.cases && searchResults.cases.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider px-2 py-1 bg-blue-50 rounded-md flex items-center justify-between">
                        <span>Cases</span>
                        <span className="text-[10px] bg-blue-200/60 text-blue-900 px-1.5 py-0.5 rounded-full">
                          {searchResults.cases.length}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.cases.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleResultClick(`/cases/${c.id}`)}
                            className="px-3 py-2 hover:bg-surface-container-high rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                                <span className="text-primary font-bold mr-1.5">#{c.case_number}</span>
                                {c.title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                Status: <span className="font-medium text-on-surface">{c.status}</span> • Priority:{" "}
                                <span className="font-medium text-on-surface">{c.priority}</span>
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">
                              chevron_right
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents matches */}
                  {searchResults.documents && searchResults.documents.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider px-2 py-1 bg-emerald-50 rounded-md flex items-center justify-between">
                        <span>Documents</span>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded-full">
                          {searchResults.documents.length}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {searchResults.documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => handleResultClick("/documents")}
                            className="px-3 py-2 hover:bg-surface-container-high rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {doc.title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {doc.document_type} • {doc.file_name}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary transition-colors">
                              chevron_right
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Notifications and Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-stack-md">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative flex items-center justify-center focus-ring btn-press cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error text-on-error text-[10px] font-extrabold rounded-full border-2 border-surface flex items-center justify-center animate-pulse-subtle shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        <div className="h-6 w-[1px] bg-outline-variant/80 mx-1 hidden sm:block"></div>

        {/* Profile Card Trigger */}
        <div ref={profileRef} className="relative">
          <div
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-full hover:bg-surface-container-high cursor-pointer transition-colors select-none focus-ring btn-press"
            onClick={toggleDropdown}
            role="button"
            tabIndex={0}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs sm:text-sm text-primary font-bold tracking-tight">
                {user?.full_name || "Counselor"}
              </p>
              <p className="text-[10px] text-on-surface-variant capitalize font-medium">
                {user?.role || "Attorney"}
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary-fixed bg-primary text-on-primary flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
              {user?.full_name ? (
                user.full_name.charAt(0).toUpperCase()
              ) : (
                <span className="material-symbols-outlined text-lg">person</span>
              )}
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm sm:text-base">
              {isDropdownOpen ? "expand_less" : "expand_more"}
            </span>
          </div>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container-low/50">
                <p className="text-xs sm:text-sm font-bold text-primary truncate">{user?.full_name || "Lawyer Profile"}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{user?.email || "counselor@firm.com"}</p>
              </div>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">settings</span>
                <span className="font-medium">Profile Settings</span>
              </Link>
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-error hover:bg-error-container/20 transition-colors border-t border-outline-variant/60 text-left cursor-pointer font-semibold"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import { useNotifications } from "../contexts/NotificationContext";

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { unreadCount } = useNotifications();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: "dashboard", end: true },
    { name: "Clients", path: "/clients", icon: "group" },
    { name: "Cases", path: "/cases", icon: "folder_special" },
    { name: "Hearings", path: "/hearings", icon: "gavel" },
    { name: "Documents", path: "/documents", icon: "folder_open" },
    { name: "Notifications", path: "/notifications", icon: "notifications", badge: unreadCount },
  ];

  const footerItems = [
    { name: "Settings", path: "/settings", icon: "settings" },
    { name: "Support", path: "#", icon: "help" },
  ];

  const getLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 focus-ring btn-press ${
      isActive
        ? "bg-secondary-container text-on-secondary-container font-semibold shadow-sm translate-x-1"
        : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
    }`;

  const getFooterLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all duration-200 focus-ring text-on-surface-variant hover:bg-surface-container-high hover:text-primary ${
      isActive ? "font-semibold text-primary bg-surface-container" : ""
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-4 gap-4 bg-surface-container-low border-r border-outline-variant w-[260px] md:w-[240px] select-none">
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-1">
        <Logo />
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high focus-ring cursor-pointer"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 flex flex-col gap-1 mt-3 custom-scrollbar overflow-y-auto">
        <p className="text-[11px] font-bold tracking-wider text-outline uppercase px-3 mb-1">
          Navigation
        </p>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            onClick={onCloseMobile}
            className={getLinkClass}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-sm font-medium tracking-wide">{item.name}</span>
            </div>
            {item.badge > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-extrabold bg-error text-on-error rounded-full animate-pulse-subtle shadow-xs">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation & Settings */}
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/60 pt-3">
        <p className="text-[11px] font-bold tracking-wider text-outline uppercase px-3 mb-1">
          Preferences
        </p>
        {footerItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onCloseMobile}
            className={getFooterLinkClass}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky left-0 top-0 z-40 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Slide-in drawer container */}
          <div className="relative z-10 h-full animate-slide-up shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

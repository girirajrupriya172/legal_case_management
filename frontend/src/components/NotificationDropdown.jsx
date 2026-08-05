import { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";

// Helper function to format relative timestamps (e.g., "5m ago", "2h ago", "Yesterday")
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Helper function to select Google Material Symbols icons based on Notification Type
const getNotificationIcon = (type) => {
  switch (type) {
    case "CASE_CREATED":
    case "CASE_STATUS_CHANGED":
      return { name: "gavel", color: "text-primary bg-primary/10" };
    case "HEARING_SCHEDULED":
    case "HEARING_REMINDER":
      return { name: "event", color: "text-amber-600 bg-amber-50" };
    case "DOCUMENT_UPLOADED":
      return { name: "description", color: "text-blue-600 bg-blue-50" };
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
      return { name: "assignment", color: "text-emerald-600 bg-emerald-50" };
    default:
      return { name: "notifications", color: "text-on-surface-variant bg-surface-container" };
  }
};

export default function NotificationDropdown({ isOpen, onClose }) {
  const { recentNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when user clicks outside the popover container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onClose();

    // Navigate to related resource if applicable
    if (notification.case_id) {
      navigate(`/cases/${notification.case_id}`);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white border border-outline-variant rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn"
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <h3 className="font-label-lg font-bold text-primary text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-error/10 text-error rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/50">
        {recentNotifications.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-2xl">notifications_off</span>
            </div>
            <p className="font-semibold text-primary text-sm">No notifications</p>
            <p className="text-xs text-on-surface-variant mt-1">You are all caught up!</p>
          </div>
        ) : (
          recentNotifications.map((notification) => {
            const iconConfig = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => handleItemClick(notification)}
                className={`p-3.5 flex items-start gap-3 hover:bg-surface-container-low transition-colors cursor-pointer relative ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconConfig.color}`}
                >
                  <span className="material-symbols-outlined text-lg">{iconConfig.name}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs font-bold truncate ${
                        !notification.is_read ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-on-surface-variant shrink-0">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-snug">
                    {notification.message}
                  </p>
                </div>

                {/* Unread Status Indicator Badge Dot */}
                {!notification.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center"></span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="p-2.5 bg-surface-container-lowest border-t border-outline-variant text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-primary hover:bg-surface-container-high rounded-xl transition-colors"
        >
          <span>View All Notifications</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

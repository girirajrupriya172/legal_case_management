import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification
} from "../services/notificationService";
import { useNotifications } from "../contexts/NotificationContext";

// Relative time formatting helper
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Material Symbols Icon & Color Helper based on Notification Type
const getNotificationTypeConfig = (type) => {
  switch (type) {
    case "CASE_CREATED":
    case "CASE_STATUS_CHANGED":
      return { name: "gavel", label: "Case Event", color: "text-primary bg-secondary-container border-outline-variant/40" };
    case "HEARING_SCHEDULED":
    case "HEARING_REMINDER":
      return { name: "event", label: "Hearing", color: "text-amber-800 bg-amber-50 border-amber-200/60" };
    case "DOCUMENT_UPLOADED":
      return { name: "description", label: "Document", color: "text-blue-800 bg-blue-50 border-blue-200/60" };
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
      return { name: "assignment", label: "Task", color: "text-emerald-800 bg-emerald-50 border-emerald-200/60" };
    default:
      return { name: "notifications", label: "System", color: "text-on-surface-variant bg-surface-container border-outline-variant/40" };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { fetchRecent } = useNotifications();
  const navigate = useNavigate();

  // Load paginated notifications from backend API
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications({ page, limit, unreadOnly });
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("[NOTIFICATIONS PAGE ERROR]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark single item read handler
  const handleMarkRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      await apiMarkAsRead(id);
      fetchRecent(); // Refresh global header badge
    } catch (err) {
      console.error("Failed to mark read:", err.message);
      loadNotifications();
    }
  };

  // Mark all read handler
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      await apiMarkAllAsRead();
      fetchRecent(); // Refresh global header badge
    } catch (err) {
      console.error("Failed to mark all read:", err.message);
      loadNotifications();
    }
  };

  // Delete notification handler
  const handleDelete = async (id) => {
    try {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      await apiDeleteNotification(id);
      fetchRecent(); // Refresh global header badge
    } catch (err) {
      console.error("Failed to delete notification:", err.message);
      loadNotifications();
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in relative">
      
      {/* Top Page Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-secondary-container text-on-secondary-container rounded-full uppercase tracking-wider">
              Activity Logs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
            Notifications & System Alerts
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Real-time activity logs for case updates, court hearing reminders, document uploads, and tasks.
          </p>
        </div>

        {/* Header Action Button */}
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low border border-outline-variant/80 text-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-surface-container-high transition-all focus-ring btn-press cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">done_all</span>
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs & Stats Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs">
        {/* Filter Pill Toggle */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/60">
          <button
            onClick={() => {
              setUnreadOnly(false);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer focus-ring ${
              !unreadOnly
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            All Activities
          </button>
          <button
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer focus-ring ${
              unreadOnly
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Counter Badge */}
        <div className="text-xs font-bold text-outline">
          Showing <span className="text-primary font-extrabold">{notifications.length}</span> of{" "}
          <span className="text-primary font-extrabold">{total}</span> total alerts
        </div>
      </div>

      {/* Content List Section */}
      {loading ? (
        <div className="min-h-[350px] flex flex-col justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-secondary-container border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-on-surface-variant animate-pulse-subtle">
            Loading notification logs...
          </p>
        </div>
      ) : error ? (
        <div className="min-h-[350px] flex flex-col justify-center items-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-error-container/40 text-error rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">Sync Error</h3>
          <p className="text-sm text-on-surface-variant max-w-md mb-6">{error}</p>
          <button
            onClick={loadNotifications}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all focus-ring btn-press cursor-pointer shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="min-h-[350px] flex flex-col justify-center items-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 text-center shadow-xs animate-fade-in">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
            <span className="material-symbols-outlined text-3xl">notifications_paused</span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">No Notifications Found</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            {unreadOnly
              ? "You have read all your notifications! Switch to 'All Activities' to review full history."
              : "There are no system notifications recorded in your legal case management platform yet."}
          </p>
        </div>
      ) : (
        /* Notifications Cards List */
        <div className="space-y-3.5 animate-fade-in">
          {notifications.map((item) => {
            const config = getNotificationTypeConfig(item.type);
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xs card-hover flex flex-col sm:flex-row items-start justify-between gap-4 relative overflow-hidden ${
                  !item.is_read ? "border-l-4 border-l-primary bg-primary/[0.02]" : ""
                }`}
              >
                {/* Left Side: Type Icon + Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${config.color}`}
                  >
                    <span className="material-symbols-outlined text-2xl">{config.name}</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant">
                        {config.label}
                      </span>
                      <h3
                        className={`text-xs sm:text-sm font-bold ${
                          !item.is_read ? "text-primary font-extrabold" : "text-on-surface"
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0"></span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-outline">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                        {formatRelativeTime(item.created_at)}
                      </span>

                      {item.case_id && (
                        <button
                          onClick={() => navigate(`/cases/${item.case_id}`)}
                          className="flex items-center gap-1 font-bold text-primary hover:underline focus-ring rounded"
                        >
                          <span className="material-symbols-outlined text-sm">folder</span>
                          <span>View Linked Case</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="p-1.5 text-primary hover:bg-surface-container-high rounded-xl transition-colors focus-ring cursor-pointer"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-error hover:bg-error-container/40 rounded-xl transition-colors focus-ring cursor-pointer"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xs">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-on-surface bg-surface-container-low border border-outline-variant/80 hover:bg-surface-container-high rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-ring btn-press cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
            <span>Previous</span>
          </button>

          <span className="text-xs font-bold text-outline uppercase tracking-wider">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-on-surface bg-surface-container-low border border-outline-variant/80 hover:bg-surface-container-high rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-ring btn-press cursor-pointer"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}

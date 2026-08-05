import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getRecentNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead
} from "../services/notificationService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoized fetch function to refresh recent notifications and unread badge count
  const fetchRecent = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRecentNotifications({ limit: 5 });
      setRecentNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error("[NOTIFICATION SERVICE ERROR]", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30-second background polling interval
  useEffect(() => {
    fetchRecent();

    const interval = setInterval(() => {
      fetchRecent();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchRecent]);

  // Action: Mark single notification as read (optimistic update + API call)
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic update locally
      setRecentNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Synchronize with backend REST API
      await apiMarkAsRead(notificationId);
    } catch (err) {
      console.error("Failed to mark notification read:", err.message);
      // Revert/refetch on failure
      fetchRecent();
    }
  };

  // Action: Mark all notifications as read (optimistic update + API call)
  const markAllAsRead = async () => {
    try {
      // Optimistic update locally
      setRecentNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );
      setUnreadCount(0);

      // Synchronize with backend REST API
      await apiMarkAllAsRead();
    } catch (err) {
      console.error("Failed to mark all read:", err.message);
      fetchRecent();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        recentNotifications,
        unreadCount,
        loading,
        error,
        fetchRecent,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom Hook to consume Notification Context across React UI components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

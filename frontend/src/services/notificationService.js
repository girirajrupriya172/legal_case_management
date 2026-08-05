import api from "./api";

/**
 * Helper to process Axios HTTP responses and extract detailed FastAPI error messages.
 */
const handleAxiosError = (error, defaultMessage) => {
  if (error.response && error.response.data) {
    if (typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((err) => err.msg).join(", ");
    }
  }
  return error.message || defaultMessage;
};

/**
 * Fetch a paginated list of notifications.
 * Endpoint: GET /notifications
 */
export const getNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  try {
    const params = {
      page,
      limit,
      unread_only: unreadOnly
    };
    const response = await api.get("/notifications", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load notifications. Please try again."));
  }
};

/**
 * Fetch recent notifications and unread badge count for header popover.
 * Endpoint: GET /notifications/recent
 */
export const getRecentNotifications = async ({ limit = 5 } = {}) => {
  try {
    const params = { limit };
    const response = await api.get("/notifications/recent", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to fetch recent notifications."));
  }
};

/**
 * Mark a single notification as read by ID.
 * Endpoint: PATCH /notifications/:id/read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to mark notification as read."));
  }
};

/**
 * Mark all unread notifications as read.
 * Endpoint: PATCH /notifications/read-all
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to mark all notifications as read."));
  }
};

/**
 * Delete a notification record by ID.
 * Endpoint: DELETE /notifications/:id
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to delete notification."));
  }
};

/**
 * Create a new notification.
 * Endpoint: POST /notifications
 */
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post("/notifications", notificationData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to create notification."));
  }
};

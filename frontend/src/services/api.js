import axios from "axios";

// Base URL for the FastAPI backend service loaded dynamically from Vite environment
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const API_URL = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api/v1`;

// Create custom Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// State flag to track ongoing refresh requests and queue concurrent 401 failures
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Automatically inject the JWT Access Token into every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Automatically handle 401 Unauthorized with token refresh & retry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If request failed with 401 Unauthorized and hasn't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh for login or refresh endpoints themselves
      if (
        originalRequest.url.includes("/auth/login") || 
        originalRequest.url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If a refresh is already in progress, queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        // No refresh token available, purge queued requests and force logout
        processQueue(error, null);
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call backend refresh endpoint directly to avoid interceptor recursion
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: storedRefreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Save new rotated tokens in client storage
        localStorage.setItem("token", access_token);
        localStorage.setItem("refreshToken", refresh_token);

        // Update default Authorization header for future requests
        api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

        // Notify queued requests of new token
        processQueue(null, access_token);

        // Retry original failed request seamlessly
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token revoked or expired), purge session and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;


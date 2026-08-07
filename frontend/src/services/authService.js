import api from "./api";

/**
 * Helper to extract and format backend Pydantic validation errors from Axios exceptions
 * to prevent [object Object] output on the client UI.
 */
const handleAxiosError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  if (error.response) {
    if (error.response.data && error.response.data.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        errorMessage = detail
          .map((err) => {
            const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "";
            return field ? `${field}: ${err.msg}` : err.msg;
          })
          .join(", ");
      } else if (typeof detail === "string") {
        errorMessage = detail;
      }
    } else if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.response.status >= 500) {
      errorMessage = `Server Error (${error.response.status}): Database or backend service unavailable.`;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
};

/**
 * Send credentials to backend to get an access token.
 */
export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Incorrect email or password"));
  }
};

/**
 * Retrieve profile data of the currently logged-in user.
 * Supports manual token override, falls back to default interceptor token.
 */
export const getCurrentUser = async (token) => {
  try {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await api.get("/auth/me", config);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Session expired or invalid"));
  }
};

/**
 * Register a new user account on the backend.
 */
export const register = async (email, password, fullName, role = "attorney") => {
  try {
    const response = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
      role,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Registration failed"));
  }
};

/**
 * Send refresh token to backend to obtain a new access and refresh token pair.
 */
export const refreshToken = async (token) => {
  try {
    const response = await api.post("/auth/refresh", { refresh_token: token });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to refresh session"));
  }
};

/**
 * Send refresh token to backend to invalidate session on server-side logout.
 */
export const logout = async (token) => {
  try {
    if (token) {
      await api.post("/auth/logout", { refresh_token: token });
    }
  } catch (error) {
    console.warn("Logout endpoint notification failed:", error.message);
  }
};

/**
 * Request a password reset link for the provided email.
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to process password recovery request"));
  }
};

/**
 * Reset the password using the token sent via email.
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to reset password. Link may be invalid or expired."));
  }
};


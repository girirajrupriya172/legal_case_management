import api from "./api";

/**
 * Fetch main dashboard statistics, upcoming hearings, and recent activities.
 * Uses the pre-configured Axios instance to handle authorization headers automatically.
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    // Extract detailed error messages returned by FastAPI/Pydantic
    const errorMessage =
      error.response && error.response.data && error.response.data.detail
        ? error.response.data.detail
        : "Failed to load dashboard data. Please try again later.";
    throw new Error(errorMessage);
  }
};

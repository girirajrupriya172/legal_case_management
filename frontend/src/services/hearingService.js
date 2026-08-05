import api from "./api";

/**
 * Helper to process Axios HTTP errors and extract clean error messages from FastAPI/Pydantic responses.
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
 * Fetch paginated list of hearings with search, filtering, case, client, or upcoming constraints.
 * GET /api/v1/hearings
 */
export const getHearings = async ({
  page = 1,
  limit = 20,
  search = "",
  caseId = null,
  clientId = null,
  status = "",
  upcomingOnly = false
} = {}) => {
  try {
    const params = { page, limit };

    if (search && search.trim() !== "") params.search = search.trim();
    if (caseId) params.case_id = caseId;
    if (clientId) params.client_id = clientId;
    if (status && status.trim() !== "") params.status = status.trim();
    if (upcomingOnly) params.upcoming_only = true;

    const response = await api.get("/hearings", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load court hearings. Please try again."));
  }
};

/**
 * Fetch upcoming court hearings ordered by date (nearest first).
 * GET /api/v1/hearings/upcoming
 */
export const getUpcomingHearings = async (limit = 10) => {
  try {
    const response = await api.get("/hearings/upcoming", { params: { limit } });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load upcoming hearings. Please try again."));
  }
};

/**
 * Fetch all hearings belonging to a specific legal case.
 * GET /api/v1/hearings/case/{caseId}
 */
export const getCaseHearings = async (caseId) => {
  try {
    const response = await api.get(`/hearings/case/${caseId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load case hearing history. Please try again."));
  }
};

/**
 * Fetch details of a single court hearing by ID.
 * GET /api/v1/hearings/{hearingId}
 */
export const getHearingById = async (hearingId) => {
  try {
    const response = await api.get(`/hearings/${hearingId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to retrieve hearing details. Please try again."));
  }
};

/**
 * Schedule a new court hearing.
 * POST /api/v1/hearings
 */
export const scheduleHearing = async (hearingData) => {
  try {
    const response = await api.post("/hearings", hearingData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to schedule court hearing. Please review data."));
  }
};

/**
 * Update status, courtroom, date, judge, or notes for an existing hearing.
 * PUT /api/v1/hearings/{hearingId}
 */
export const updateHearing = async (hearingId, hearingData) => {
  try {
    const response = await api.put(`/hearings/${hearingId}`, hearingData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to update court hearing record. Please try again."));
  }
};

/**
 * Remove/Cancel a scheduled court hearing.
 * DELETE /api/v1/hearings/{hearingId}
 */
export const deleteHearing = async (hearingId) => {
  try {
    const response = await api.delete(`/hearings/${hearingId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to delete court hearing. Please try again."));
  }
};

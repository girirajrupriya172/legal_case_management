import api from "./api";

/**
 * Helper to process Axios HTTP responses and extract detailed FastAPI/Pydantic validation errors.
 */
const handleAxiosError = (error, defaultMessage) => {
  if (error.response && error.response.data) {
    if (typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      // If Pydantic yields multiple validation error dictionaries, join them
      return error.response.data.detail.map((err) => err.msg).join(", ");
    }
  }
  return error.message || defaultMessage;
};

/**
 * Fetch a paginated list of cases with searching and filtering parameters.
 */
export const getCases = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  priority = ""
} = {}) => {
  try {
    const params = {
      page,
      limit
    };

    if (search && search.trim() !== "") {
      params.search = search.trim();
    }

    if (status && status.trim() !== "") {
      params.status = status.trim();
    }

    if (priority && priority.trim() !== "") {
      params.priority = priority.trim();
    }

    const response = await api.get("/cases", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load cases directory. Please try again."));
  }
};

/**
 * Open/Create a new case file in the system.
 */
export const createCase = async (caseData) => {
  try {
    const response = await api.post("/cases", caseData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to register case file. Please review details."));
  }
};

/**
 * Fetch a single case profile details by ID.
 */
export const getCaseById = async (caseId) => {
  try {
    const response = await api.get(`/cases/${caseId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to retrieve case details. Please try again."));
  }
};

/**
 * Fetch comprehensive case details including nested client info,
 * hearings, tasks, and unified timeline.
 * Calls: GET /cases/{caseId}/detail
 * Used by: CaseDetails.jsx (Case Details page)
 */
export const getCaseDetail = async (caseId) => {
  try {
    const response = await api.get(`/cases/${caseId}/detail`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load case profile. Please try again."));
  }
};

/**
 * Update details of an existing case file by ID.
 */
export const updateCase = async (caseId, caseData) => {
  try {
    const response = await api.put(`/cases/${caseId}`, caseData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to update case file. Please try again."));
  }
};

/**
 * Delete a case file and its related database entities.
 */
export const deleteCase = async (caseId) => {
  try {
    const response = await api.delete(`/cases/${caseId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to delete case record. Please try again."));
  }
};

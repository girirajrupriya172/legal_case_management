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
 * Fetch a paginated list of clients with search and filter parameters.
 */
export const getClients = async ({ page = 1, limit = 10, search = "", filterStatus = "", filter_status = "" } = {}) => {
  try {
    // Construct query parameters matching what FastAPI expects
    const params = {
      page,
      limit,
    };

    if (search && search.trim() !== "") {
      params.search = search.trim();
    }

    const activeFilter = (filter_status || filterStatus || "").trim();
    if (activeFilter !== "") {
      params.filter_status = activeFilter;
    }

    const response = await api.get("/clients", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load clients. Please try again."));
  }
};

/**
 * Create a new client record in the system.
 */
export const createClient = async (clientData) => {
  try {
    const response = await api.post("/clients", clientData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to create client. Please check details and try again."));
  }
};

/**
 * Update an existing client's details by ID.
 */
export const updateClient = async (clientId, clientData) => {
  try {
    const response = await api.put(`/clients/${clientId}`, clientData);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to update client details. Please try again."));
  }
};

/**
 * Delete a client record and its associated case files.
 */
export const deleteClient = async (clientId) => {
  try {
    const response = await api.delete(`/clients/${clientId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to delete client. Please try again."));
  }
};

/**
 * Fetch a single client's profile details including cases and activities by ID.
 */
export const getClientById = async (clientId) => {
  try {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load client profile details. Please try again."));
  }
};


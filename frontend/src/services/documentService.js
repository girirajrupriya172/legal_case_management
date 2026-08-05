import api from "./api";

/**
 * Helper to process Axios HTTP errors and extract detailed FastAPI/Pydantic error messages.
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
 * Fetch a paginated list of all legal documents with search and filter parameters.
 */
export const getDocuments = async ({
  page = 1,
  limit = 10,
  search = "",
  documentType = "",
  document_type = "",
  caseId = null,
  case_id = null
} = {}) => {
  try {
    const params = { page, limit };
    if (search && search.trim() !== "") params.search = search.trim();
    
    const activeDocType = (document_type || documentType || "").trim();
    if (activeDocType !== "") params.document_type = activeDocType;
    
    const activeCaseId = case_id || caseId;
    if (activeCaseId) params.case_id = activeCaseId;

    const response = await api.get("/documents", { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to load legal documents. Please try again."));
  }
};

/**
 * Fetch all documents associated with a specific legal case.
 */
export const getDocumentsByCase = async (caseId, { skip = 0, limit = 100, documentType = "" } = {}) => {
  try {
    const params = { skip, limit };
    if (documentType && documentType.trim() !== "") params.document_type = documentType.trim();

    const response = await api.get(`/documents/case/${caseId}`, { params });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, `Failed to load documents for Case #${caseId}.`));
  }
};

/**
 * Fetch detailed metadata for a single legal document by ID.
 */
export const getDocumentById = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to retrieve document details."));
  }
};

/**
 * Upload a new legal document file with form data (Multipart/Form-Data).
 * Supports upload progress tracking callback.
 */
export const uploadDocument = async (formData, onUploadProgress = null) => {
  try {
    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to upload legal document file."));
  }
};

/**
 * Delete a legal document file by ID.
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to delete legal document."));
  }
};

/**
 * Helper to construct direct preview URL for inline display.
 */
export const getPreviewUrl = (documentId) => {
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  return `${baseUrl}/documents/${documentId}/preview?token=${token || ""}`;
};

/**
 * Trigger secure file download using Axios blob response.
 * Preserves Authorization headers while giving browser native save file prompt.
 */
export const downloadDocumentFile = async (documentId, fallbackFileName = "document.pdf") => {
  try {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: "blob",
    });

    // Create temporary blob URL in browser memory
    const blob = new Blob([response.data], { type: response.headers["content-type"] });
    const blobUrl = window.URL.createObjectURL(blob);

    // Extract filename from Content-Disposition header if available
    let filename = fallbackFileName;
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Create temporary <a> element to trigger download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Clean up temporary DOM element and blob URL memory
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error(handleAxiosError(error, "Failed to download legal document file."));
  }
};

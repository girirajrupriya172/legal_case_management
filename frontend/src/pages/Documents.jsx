import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getDocuments,
  deleteDocument,
  downloadDocumentFile,
} from "../services/documentService";
import { getCases } from "../services/caseService";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";

/**
 * Helper: returns a Tailwind CSS color class for document type badges.
 */
const getDocTypeBadge = (docType) => {
  const map = {
    "FIR": "bg-rose-100 text-rose-800 border border-rose-200/60 font-extrabold",
    "Court Orders": "bg-blue-100 text-blue-800 border border-blue-200/60 font-bold",
    "Evidence": "bg-amber-100 text-amber-800 border border-amber-200/60 font-bold",
    "Affidavits": "bg-purple-100 text-purple-800 border border-purple-200/60 font-bold",
    "Agreements": "bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold",
    "Notices": "bg-orange-100 text-orange-800 border border-orange-200/60 font-bold",
    "Identity Proofs": "bg-teal-100 text-teal-800 border border-teal-200/60 font-bold",
    "Property Documents": "bg-cyan-100 text-cyan-800 border border-cyan-200/60 font-bold",
    "Judgement Copies": "bg-indigo-100 text-indigo-800 border border-indigo-200/60 font-bold",
    "Other Legal Files": "bg-surface-container-high text-on-surface-variant border border-outline-variant/40 font-medium",
  };
  return map[docType] || "bg-surface-container-high text-on-surface-variant border border-outline-variant/40 font-medium";
};

/**
 * Helper: returns a Material icon name based on MIME type.
 */
const getFileIcon = (mimeType) => {
  if (!mimeType) return "description";
  if (mimeType === "application/pdf") return "picture_as_pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word")) return "article";
  if (mimeType === "text/plain") return "text_snippet";
  return "description";
};

/**
 * Helper: returns icon color class based on MIME type.
 */
const getFileIconColor = (mimeType) => {
  if (!mimeType) return "text-primary";
  if (mimeType === "application/pdf") return "text-rose-600";
  if (mimeType.startsWith("image/")) return "text-blue-600";
  if (mimeType.includes("word")) return "text-blue-800";
  return "text-primary";
};

/**
 * Helper: format bytes to human-readable string.
 */
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DOCUMENT_TYPES = [
  "", "FIR", "Court Orders", "Evidence", "Affidavits", "Agreements",
  "Notices", "Identity Proofs", "Property Documents", "Judgement Copies", "Other Legal Files",
];

export default function Documents() {
  const location = useLocation();

  // Data State
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter & Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState("");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [allCases, setAllCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const caseDropdownRef = useRef(null);

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Delete Confirm State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check location state for incoming notifications
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotification(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Cases for Selector Dropdown
  const loadCases = async () => {
    if (allCases.length > 0) return;
    try {
      setCasesLoading(true);
      const data = await getCases({ page: 1, limit: 100 });
      setAllCases(data.items || data.cases || []);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setCasesLoading(false);
    }
  };

  // Click outside to close case dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (caseDropdownRef.current && !caseDropdownRef.current.contains(e.target)) {
        setCaseSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCases = allCases.filter((c) =>
    c.case_number?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(caseSearchQuery.toLowerCase())
  );

  // Data Fetching
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDocuments({
        page,
        limit,
        search: debouncedSearch,
        documentType: filterType,
      });
      setDocuments(data.items || data.documents || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load legal documents.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Success Notification Auto-dismiss
  useEffect(() => {
    if (!successNotification) return;
    const timer = setTimeout(() => setSuccessNotification(""), 4000);
    return () => clearTimeout(timer);
  }, [successNotification]);

  // Preview Handler
  const handlePreview = (doc) => {
    setPreviewDocument(doc);
    setIsPreviewModalOpen(true);
  };

  // Download Handler
  const handleDownload = async (doc) => {
    try {
      await downloadDocumentFile(doc.id, doc.title || doc.file_name);
    } catch (err) {
      setError(err.message || "Failed to download document.");
    }
  };

  // Delete Handlers
  const openDeleteModal = (doc) => {
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDocument(documentToDelete.id);
      setSuccessNotification(`"${documentToDelete.title || documentToDelete.file_name}" has been permanently deleted.`);
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
      loadDocuments();
    } catch (err) {
      setError(err.message || "Failed to delete document.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Upload Success Handler
  const handleUploadSuccess = (newDoc) => {
    setSuccessNotification(`Document "${newDoc.title || newDoc.file_name}" uploaded successfully.`);
    setShowCaseSelector(false);
    setSelectedCase(null);
    setCaseSearchQuery("");
    loadDocuments();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in relative">

      {/* Toast Success Notification */}
      {successNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-2xl shadow-xl border border-outline-variant/30 flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-xs sm:text-sm font-medium">{successNotification}</span>
          <button
            onClick={() => setSuccessNotification("")}
            className="text-on-primary/70 hover:text-on-primary transition-colors ml-3 p-0.5 rounded-full hover:bg-white/10 focus-ring"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-secondary-container text-on-secondary-container rounded-full uppercase tracking-wider">
              Document Vault
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Legal Documents Repository</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Secure, encrypted legal file repository for all active and archived case litigations.
          </p>
        </div>

        {/* Upload Button or Searchable Case Selector Popover */}
        {!showCaseSelector ? (
          <button
            onClick={() => { setShowCaseSelector(true); loadCases(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs self-start sm:self-auto"
            id="upload-document-btn"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            <span>Upload Document</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-4 shadow-xl min-w-[320px] animate-scale-in" ref={caseDropdownRef}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline px-1">Select Case File to Attach</p>

            <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/80 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-base text-outline">search</span>
              <input
                type="text"
                placeholder="Search by case number or title..."
                value={caseSearchQuery}
                onChange={(e) => setCaseSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-xs focus:outline-none text-on-surface placeholder:text-outline"
                id="case-search-input"
              />
            </div>

            {selectedCase && (
              <div className="flex items-center justify-between gap-2 bg-secondary-container rounded-xl px-3 py-2 border border-outline-variant/40">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate">#{selectedCase.case_number}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{selectedCase.title}</p>
                </div>
                <button onClick={() => setSelectedCase(null)} className="text-on-surface-variant hover:text-error p-0.5 rounded-full hover:bg-white/10 transition-colors focus-ring">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}

            {casesLoading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <div className="w-4 h-4 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-on-surface-variant animate-pulse-subtle">Loading cases directory...</span>
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 divide-y divide-outline-variant/30">
                {filteredCases.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-3">No matching legal cases found.</p>
                ) : (
                  filteredCases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCase(c); setCaseSearchQuery(""); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-surface-container-high transition-colors cursor-pointer w-full ${
                        selectedCase?.id === c.id ? "bg-surface-container-high font-bold" : ""
                      }`}
                      id={`case-option-${c.id}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sm text-primary">folder_special</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate">#{c.case_number}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">{c.title}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
              <button
                onClick={() => { setShowCaseSelector(false); setSelectedCase(null); setCaseSearchQuery(""); }}
                className="px-3.5 py-1.5 border border-outline-variant text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedCase) return;
                  setIsUploadModalOpen(true);
                }}
                disabled={!selectedCase}
                className="px-4 py-1.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Continue →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-2xl px-5 py-3.5 text-xs font-medium animate-fade-in">
          <span className="material-symbols-outlined text-lg text-error">warning</span>
          <p className="flex-1">{error}</p>
          <button onClick={() => setError("")} className="text-on-error-container/70 hover:text-on-error-container p-0.5 rounded-full hover:bg-black/10 focus-ring">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by title, case #, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-full text-xs sm:text-sm text-on-surface placeholder:text-outline focus-ring outline-none transition-all"
            id="documents-search-input"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5 rounded-full hover:bg-surface-container-high transition-colors focus-ring">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            id="documents-type-filter"
          >
            <option value="">All Document Types</option>
            {DOCUMENT_TYPES.filter(t => t !== "").map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-outline text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            <span className="material-symbols-outlined text-base text-primary">folder_open</span>
            <span>{total} File{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Main Documents Table Viewport */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden animate-fade-in">
        {loading && (
          <LoadingSpinner message="Loading legal document repository..." minHeight="min-h-[350px]" />
        )}

        {!loading && documents.length === 0 && (
          <div className="min-h-[350px] flex flex-col justify-center items-center p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                folder_open
              </span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">No Documents Found</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              {debouncedSearch || filterType
                ? "No legal files match your active search or filter. Try resetting search filters."
                : "No legal documents have been attached yet. Click 'Upload Document' to attach case files."}
            </p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Document Title</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Category Type</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Linked Case</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Uploaded By</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">File Size</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Date Added</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {documents.map((doc) => (
                  <tr key={doc.id} className="table-row-hover">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 shadow-xs">
                          <span
                            className={`material-symbols-outlined text-xl ${getFileIconColor(doc.mime_type)}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {getFileIcon(doc.mime_type)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-primary truncate max-w-[200px]">
                            {doc.title || doc.file_name}
                          </p>
                          <p className="text-[11px] text-outline truncate max-w-[200px]">
                            {doc.file_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${getDocTypeBadge(doc.document_type)}`}>
                        {doc.document_type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {doc.case ? (
                        <Link
                          to={`/cases/${doc.case_id}`}
                          className="text-xs sm:text-sm font-bold text-primary hover:underline"
                        >
                          #{doc.case.case_number}
                        </Link>
                      ) : (
                        <span className="text-xs text-outline italic">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-on-surface font-medium">
                        {doc.uploaded_by?.full_name || "System Admin"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-on-surface font-medium">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-outline whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePreview(doc)}
                          title="Preview Document"
                          className="p-1.5 rounded-lg text-primary hover:bg-surface-container-high transition-colors focus-ring cursor-pointer"
                          id={`preview-doc-${doc.id}`}
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>

                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download Document"
                          className="p-1.5 rounded-lg text-primary hover:bg-surface-container-high transition-colors focus-ring cursor-pointer"
                          id={`download-doc-${doc.id}`}
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>

                        <button
                          onClick={() => openDeleteModal(doc)}
                          title="Delete Document"
                          className="p-1.5 rounded-lg text-error hover:bg-error-container/40 transition-colors focus-ring cursor-pointer"
                          id={`delete-doc-${doc.id}`}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-md w-full overflow-hidden shadow-2xl animate-scale-in p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center text-error shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  delete_forever
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-primary text-base">Delete Legal Document</h3>
                <p className="text-xs text-outline">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-error-container/20 border border-error/30 rounded-xl p-3.5 mb-5">
              <p className="text-xs text-on-surface leading-relaxed font-medium">
                Are you sure you want to permanently delete{" "}
                <strong className="text-primary font-bold">"{documentToDelete.title || documentToDelete.file_name}"</strong>?
                The file will be purged from server storage.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setDocumentToDelete(null); }}
                disabled={deleteLoading}
                className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-5 py-2 bg-error text-on-error font-semibold text-xs rounded-xl hover:opacity-90 transition-all focus-ring btn-press cursor-pointer shadow-xs"
                id="confirm-delete-document-btn"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-on-error/40 border-t-on-error rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        caseId={selectedCase?.id || null}
        caseNumber={selectedCase?.case_number || ""}
        onSuccess={handleUploadSuccess}
      />

      {/* Preview Document Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => { setIsPreviewModalOpen(false); setPreviewDocument(null); }}
        document={previewDocument}
      />
    </div>
  );
}

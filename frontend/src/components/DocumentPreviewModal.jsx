import { useState } from "react";
import { downloadDocumentFile } from "../services/documentService";

/**
 * DocumentPreviewModal
 *
 * A premium overlay modal for previewing and downloading legal documents.
 * Supports:
 *   - PDF inline preview via <iframe>
 *   - Image inline preview via <img>
 *   - Unsupported file type fallback with download prompt
 *   - Secure Axios-based file download with JWT headers
 *   - Document metadata display (type, size, uploader, case, date)
 *
 * Props:
 *   isOpen    — controls modal visibility
 *   onClose   — callback to close modal
 *   document  — document metadata object from DocumentResponse schema
 */

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const API_BASE_URL = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api/v1`;

// Helper: format bytes into human-readable size string
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Helper: return Material Icon name based on MIME type
const getFileIcon = (mimeType) => {
  if (!mimeType) return "description";
  if (mimeType === "application/pdf") return "picture_as_pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("word")) return "article";
  if (mimeType === "text/plain") return "text_snippet";
  return "description";
};

// Helper: return icon color class based on MIME type
const getFileIconColor = (mimeType) => {
  if (!mimeType) return "text-primary";
  if (mimeType === "application/pdf") return "text-red-500";
  if (mimeType.startsWith("image/")) return "text-blue-500";
  if (mimeType.includes("word")) return "text-blue-700";
  return "text-primary";
};

// Helper: document type badge color
const getDocTypeBadge = (docType) => {
  const map = {
    "FIR": "bg-red-100 text-red-700",
    "Court Orders": "bg-blue-100 text-blue-700",
    "Evidence": "bg-amber-100 text-amber-700",
    "Affidavits": "bg-purple-100 text-purple-700",
    "Agreements": "bg-green-100 text-green-700",
    "Notices": "bg-orange-100 text-orange-700",
    "Identity Proofs": "bg-teal-100 text-teal-700",
    "Property Documents": "bg-cyan-100 text-cyan-700",
    "Judgement Copies": "bg-indigo-100 text-indigo-700",
    "Other Legal Files": "bg-gray-100 text-gray-700",
  };
  return map[docType] || "bg-surface-container-high text-on-surface-variant";
};

export default function DocumentPreviewModal({ isOpen, onClose, document: doc }) {
  // ─── State ─────────────────────────────────────────────────────────
  // downloadLoading: prevents duplicate download clicks while blob is streaming
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // ─── Early return: don't render if modal is closed or no document ──
  if (!isOpen || !doc) return null;

  // Determine if file can be previewed inline in the browser
  const isPdf = doc.mime_type === "application/pdf";
  const isImage = doc.mime_type?.startsWith("image/");
  const canPreviewInline = isPdf || isImage;

  // Build authenticated preview URL
  // The token is passed as a query param so the <iframe> / <img> src attribute
  // can carry authentication without a custom header (browsers don't allow custom
  // headers on <iframe src> or <img src> attributes).
  const token = localStorage.getItem("token");
  const previewUrl = `${API_BASE_URL}/documents/${doc.id}/preview?token=${token || ""}`;

  // ─── Download Handler ───────────────────────────────────────────────
  const handleDownload = async () => {
    if (downloadLoading) return;
    setDownloadError("");
    setDownloadLoading(true);
    try {
      await downloadDocumentFile(doc.id, doc.title || doc.file_name);
    } catch (err) {
      setDownloadError(err.message || "Download failed. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Modal Container — click stopPropagation prevents backdrop click closing when clicking inside */}
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-outline-variant/30 animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* File Type Icon */}
            <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
              <span
                className={`material-symbols-outlined text-[22px] ${getFileIconColor(doc.mime_type)}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {getFileIcon(doc.mime_type)}
              </span>
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0">
              <h2 className="font-bold text-primary text-sm truncate max-w-[400px]">
                {doc.title || doc.file_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getDocTypeBadge(doc.document_type)}`}>
                  {doc.document_type}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {formatFileSize(doc.file_size)}
                </span>
                {doc.case?.case_number && (
                  <span className="text-[11px] text-on-surface-variant">
                    Case #{doc.case.case_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              title="Download file"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {downloadLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* ── Download Error Banner ── */}
        {downloadError && (
          <div className="flex items-center gap-2 mx-6 mt-3 bg-error-container text-on-error-container rounded-xl px-4 py-2.5">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <p className="text-xs font-medium">{downloadError}</p>
          </div>
        )}

        {/* ── Preview Content Area ── */}
        <div className="flex-1 overflow-auto flex flex-col">
          {isPdf && (
            /* PDF Preview: embed via <iframe>
               Browser renders PDF natively.
               Content-Disposition: inline is set by FastAPI preview endpoint.
               Token is passed as query param since <iframe src> cannot carry auth headers. */
            <iframe
              src={previewUrl}
              title={doc.title || doc.file_name}
              className="w-full flex-1"
              style={{ minHeight: "500px", border: "none" }}
            />
          )}

          {isImage && (
            /* Image Preview: rendered as <img> with max dimensions */
            <div className="flex-1 flex items-center justify-center p-6 bg-surface-container-low">
              <img
                src={previewUrl}
                alt={doc.title || doc.file_name}
                className="max-w-full max-h-[500px] object-contain rounded-xl shadow-md"
              />
            </div>
          )}

          {!canPreviewInline && (
            /* Unsupported Preview Fallback */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-secondary-container flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[40px] text-on-surface-variant"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  description
                </span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base mb-1">
                  Preview Not Available
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  This file type cannot be previewed in the browser. Please download it to view with an appropriate application.
                </p>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download to View
              </button>
            </div>
          )}
        </div>

        {/* ── Modal Footer: Document Metadata Strip ── */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-outline-variant/30 bg-surface-container-low flex flex-wrap items-center gap-x-6 gap-y-1">
          {doc.uploaded_by?.full_name && (
            <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">person</span>
              {doc.uploaded_by.full_name}
            </span>
          )}
          {doc.created_at && (
            <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {new Date(doc.created_at).toLocaleDateString([], { dateStyle: "medium" })}
            </span>
          )}
          {doc.file_name && (
            <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant truncate max-w-[200px]">
              <span className="material-symbols-outlined text-[14px]">folder</span>
              {doc.file_name}
            </span>
          )}
          {doc.notes && (
            <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">notes</span>
              {doc.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

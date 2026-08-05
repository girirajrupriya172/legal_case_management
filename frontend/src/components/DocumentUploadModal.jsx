import { useState, useRef } from "react";
import { uploadDocument } from "../services/documentService";

/**
 * DocumentUploadModal
 *
 * A premium full-screen overlay modal for securely uploading legal documents
 * to a specific case. Supports:
 *   - File selection via click OR drag-and-drop
 *   - Document type selection
 *   - Optional counsel notes
 *   - Real-time upload progress bar
 *   - Error and success states
 *
 * Props:
 *   isOpen     — controls modal visibility
 *   onClose    — callback to close modal
 *   caseId     — the case this document is linked to
 *   caseNumber — displayed in the modal header for context
 *   onSuccess  — callback triggered on successful upload, receives new document object
 */

const DOCUMENT_TYPES = [
  "FIR",
  "Court Orders",
  "Evidence",
  "Affidavits",
  "Agreements",
  "Notices",
  "Identity Proofs",
  "Property Documents",
  "Judgement Copies",
  "Other Legal Files",
];

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function DocumentUploadModal({
  isOpen,
  onClose,
  caseId,
  caseNumber = "",
  onSuccess,
}) {
  // ─── State ─────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("FIR");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // useRef: gives us a direct reference to the hidden <input type="file"> DOM element.
  // When the user clicks the styled "Browse File" button, we trigger a click on the
  // hidden file input via fileInputRef.current.click().
  const fileInputRef = useRef(null);

  // ─── File Validation ────────────────────────────────────────────────
  const validateFile = (file) => {
    if (!file) return "Please select a file to upload.";
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Allowed: PDF, Images, Word Documents, Text.`;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  // ─── File Input Handler ─────────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError("");
    setSelectedFile(file);
    // Auto-fill title from filename (strip extension)
    if (!title) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExtension);
    }
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files?.[0]);
  };

  // ─── Drag & Drop Handlers ───────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  // ─── Helper: Human-readable File Size ──────────────────────────────
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ─── Reset form state ───────────────────────────────────────────────
  const resetForm = () => {
    setSelectedFile(null);
    setDocumentType("FIR");
    setTitle("");
    setNotes("");
    setUploadProgress(0);
    setError("");
    setIsUploading(false);
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Close Handler ──────────────────────────────────────────────────
  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  // ─── Submit Handler ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate file before submission
    const fileError = validateFile(selectedFile);
    if (fileError) { setError(fileError); return; }
    if (!documentType) { setError("Please select a Document Type."); return; }

    setError("");
    setIsUploading(true);
    setUploadProgress(0);

    // Build FormData object for multipart/form-data upload
    // FormData encodes the request as multipart/form-data boundary sections
    const formData = new FormData();
    formData.append("case_id", caseId);
    formData.append("document_type", documentType);
    formData.append("title", title.trim() || selectedFile.name);
    formData.append("notes", notes.trim());
    formData.append("file", selectedFile);

    try {
      const uploadedDoc = await uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });

      // Notify parent component of successful upload
      if (onSuccess) onSuccess(uploadedDoc);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ─── Don't render anything if modal is closed ───────────────────────
  if (!isOpen) return null;

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant/30 animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                upload_file
              </span>
            </div>
            <div>
              <h2 className="font-bold text-primary text-sm">Upload Legal Document</h2>
              {caseNumber && (
                <p className="text-[11px] text-on-surface-variant">Case #{caseNumber}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ── Modal Form Body ── */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

          {/* ── Error Banner ── */}
          {error && (
            <div className="flex items-start gap-2 bg-error-container text-on-error-container rounded-xl p-3">
              <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">warning</span>
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          {/* ── Drag & Drop File Drop Zone ── */}
          {/* 
            This div acts as the file drop zone.
            dragover / dragleave / drop events are handled to capture files dragged into the UI.
            Clicking it also triggers the hidden file input.
          */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200
                ${isDragOver
                  ? "border-primary bg-primary-fixed scale-[1.01]"
                  : "border-outline-variant hover:border-primary hover:bg-surface-container-high"
                }
              `}
            >
              <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cloud_upload
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm text-on-surface">
                  {isDragOver ? "Release to upload file" : "Drag & Drop your file here"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">or click to browse from your computer</p>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  PDF, Images, Word Documents — max {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            </div>
          ) : (
            /* ── Selected File Preview Chip ── */
            <div className="flex items-center gap-3 bg-secondary-container rounded-xl p-4 border border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {selectedFile.type.startsWith("image/")
                    ? "image"
                    : selectedFile.type === "application/pdf"
                    ? "picture_as_pdf"
                    : "description"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-on-surface-variant">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                disabled={isUploading}
                className="text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          )}

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
            onChange={handleInputChange}
            className="hidden"
            id="document-file-input"
          />

          {/* ── Document Type ── */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Document Type *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              disabled={isUploading}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer disabled:opacity-60"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* ── Document Title ── */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FIR Filed in Rajkot District Court (optional)"
              disabled={isUploading}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* ── Counsel Notes ── */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Counsel Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary or context notes for this legal document..."
              disabled={isUploading}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm focus:outline-none resize-none disabled:opacity-60"
            />
          </div>

          {/* ── Upload Progress Bar ── */}
          {/* 
            Shown only when isUploading is true.
            Upload progress percentage is tracked from Axios onUploadProgress callback.
          */}
          {isUploading && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-medium">Uploading to secure storage...</span>
                <span className="font-bold text-primary">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="pt-2 border-t border-outline-variant flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-5 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

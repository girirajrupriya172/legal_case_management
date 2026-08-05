import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCaseDetail } from "../services/caseService";
import { scheduleHearing } from "../services/hearingService";
import { getDocumentsByCase, deleteDocument, downloadDocumentFile } from "../services/documentService";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";

/**
 * Semantic helper to return Tailwind classes for priority badges.
 */
const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case "High":
      return "bg-error-container/60 text-error border border-error/20 font-extrabold";
    case "Medium":
      return "bg-amber-50 text-amber-800 border border-amber-200/60 font-bold";
    case "Low":
    default:
      return "bg-surface-container-high text-on-surface-variant border border-outline-variant/40 font-medium";
  }
};

/**
 * Returns a Material icon name based on the timeline event type.
 */
const getTimelineIcon = (eventType) => {
  switch (eventType) {
    case "hearing":
      return "gavel";
    case "task":
      return "task_alt";
    case "case_created":
      return "folder_open";
    default:
      return "circle";
  }
};

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState("");

  // Schedule Hearing Modal State
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [hearingFormData, setHearingFormData] = useState({
    hearing_date: "",
    court_room: "",
    judge_name: "",
    hearing_type: "Trial",
    notes: "",
    status: "Scheduled"
  });
  const [hearingFormErrors, setHearingFormErrors] = useState({});
  const [hearingSubmitLoading, setHearingSubmitLoading] = useState(false);
  const [hearingModalError, setHearingModalError] = useState("");

  // Document Section State
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDocDeleteOpen, setIsDocDeleteOpen] = useState(false);
  const [docDeleteLoading, setDocDeleteLoading] = useState(false);
  const [docSuccessMsg, setDocSuccessMsg] = useState("");

  // Data Fetching Effect
  const fetchCaseDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCaseDetail(caseId);
      setCaseData(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load case details.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetail();
    }
  }, [caseId, fetchCaseDetail]);

  // Fetch Case Documents
  const fetchDocuments = useCallback(async () => {
    if (!caseId) return;
    try {
      setDocsLoading(true);
      const data = await getDocumentsByCase(caseId);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setDocsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchDocuments();
  }, [caseId, fetchDocuments]);

  useEffect(() => {
    if (!docSuccessMsg) return;
    const t = setTimeout(() => setDocSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [docSuccessMsg]);

  // Document helpers
  const handleDocPreview = (doc) => { setPreviewDoc(doc); setIsPreviewModalOpen(true); };
  const handleDocDownload = async (doc) => {
    try { await downloadDocumentFile(doc.id, doc.title || doc.file_name); }
    catch (err) { console.error("Download error:", err); }
  };
  const openDocDelete = (doc) => { setDocToDelete(doc); setIsDocDeleteOpen(true); };
  const confirmDocDelete = async () => {
    if (!docToDelete) return;
    setDocDeleteLoading(true);
    try {
      await deleteDocument(docToDelete.id);
      setDocSuccessMsg(`"${docToDelete.title || docToDelete.file_name}" deleted.`);
      setIsDocDeleteOpen(false);
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDocDeleteLoading(false);
    }
  };

  const getFileIcon = (mime) => {
    if (!mime) return "description";
    if (mime === "application/pdf") return "picture_as_pdf";
    if (mime.startsWith("image/")) return "image";
    if (mime.includes("word")) return "article";
    return "description";
  };
  const formatFileSize = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(2)} MB`;
  };
  const getDocTypeBadge = (t) => {
    const m = {
      "FIR": "bg-rose-100 text-rose-800",
      "Court Orders": "bg-blue-100 text-blue-800",
      "Evidence": "bg-amber-100 text-amber-800",
      "Affidavits": "bg-purple-100 text-purple-800",
      "Agreements": "bg-emerald-100 text-emerald-800",
      "Notices": "bg-orange-100 text-orange-800",
      "Identity Proofs": "bg-teal-100 text-teal-800",
      "Property Documents": "bg-cyan-100 text-cyan-800",
      "Judgement Copies": "bg-indigo-100 text-indigo-800",
    };
    return m[t] || "bg-surface-container-high text-on-surface-variant";
  };

  const openHearingModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const formattedDefaultDate = tomorrow.toISOString().slice(0, 16);

    setHearingFormData({
      hearing_date: formattedDefaultDate,
      court_room: caseData?.court_details || "",
      judge_name: "",
      hearing_type: "Trial",
      notes: "",
      status: "Scheduled"
    });
    setHearingFormErrors({});
    setHearingModalError("");
    setIsHearingModalOpen(true);
  };

  const handleScheduleHearingSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!hearingFormData.hearing_date) errs.hearing_date = "Hearing date & time is required.";
    if (!hearingFormData.court_room || !hearingFormData.court_room.trim()) errs.court_room = "Courtroom is required.";
    
    if (Object.keys(errs).length > 0) {
      setHearingFormErrors(errs);
      return;
    }

    try {
      setHearingSubmitLoading(true);
      setHearingModalError("");

      const payload = {
        case_id: parseInt(caseId, 10),
        client_id: caseData.client_id,
        hearing_date: new Date(hearingFormData.hearing_date).toISOString(),
        court_room: hearingFormData.court_room.trim(),
        judge_name: hearingFormData.judge_name.trim() || null,
        hearing_type: hearingFormData.hearing_type,
        notes: hearingFormData.notes.trim() || null,
        status: hearingFormData.status
      };

      await scheduleHearing(payload);
      setIsHearingModalOpen(false);
      setSuccessNotification("Court hearing scheduled for this case.");
      fetchCaseDetail();
    } catch (err) {
      setHearingModalError(err.message || "Failed to schedule hearing.");
    } finally {
      setHearingSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (!successNotification) return;
    const t = setTimeout(() => setSuccessNotification(""), 5000);
    return () => clearTimeout(t);
  }, [successNotification]);

  if (loading) {
    return <LoadingSpinner message="Loading case file..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Sync Error"
        message={error}
        onRetry={() => navigate("/cases")}
        retryLabel="Return to Cases Directory"
      />
    );
  }

  if (!caseData) {
    return (
      <ErrorMessage
        title="Case Not Found"
        message="The requested case record does not exist or has been removed."
        icon="folder_off"
        onRetry={() => navigate("/cases")}
        retryLabel="Return to Cases Directory"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in relative">

      {/* Top Success Banner Toast Notification */}
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

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
        <Link to="/cases" className="hover:text-primary transition-colors focus-ring rounded">
          Cases Directory
        </Link>
        <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
        <span className="text-primary font-bold">Case #{caseData.case_number}</span>
      </nav>

      {/* Case Header Card */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 sm:p-8 border border-outline-variant/60">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary-container flex items-center justify-center text-primary flex-shrink-0 font-extrabold shadow-xs">
              <span className="material-symbols-outlined text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                folder_special
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{caseData.title}</h1>
              <p className="text-xs sm:text-sm font-semibold text-outline mb-2">
                Case #{caseData.case_number}
              </p>

              {/* Status + Priority Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <StatusBadge status={caseData.status} />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${getPriorityBadgeClass(caseData.priority)}`}>
                  {caseData.priority} Priority
                </span>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {caseData.court_details && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-base text-primary">balance</span>
                    {caseData.court_details}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-base text-primary">calendar_today</span>
                  Filed: {new Date(caseData.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => navigate("/cases")}
              className="px-4 sm:px-5 py-2.5 border border-outline-variant/80 bg-surface-container-low text-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-surface-container-high transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {caseData.description && (
          <div className="mt-6 pt-5 border-t border-outline-variant/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-outline mb-1">Case Summary</h2>
            <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
              {caseData.description}
            </p>
          </div>
        )}
      </section>

      {/* Two-Column Grid: Client Info + Hearings Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Client Info Card */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 sm:p-8 border border-outline-variant/60">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
            <h2 className="text-base sm:text-lg font-bold text-primary">Client Information</h2>
          </div>

          {caseData.client ? (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {caseData.client.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Client Name</p>
                  <Link
                    to={`/clients/${caseData.client.id}`}
                    className="text-xs sm:text-sm text-primary font-bold hover:underline"
                  >
                    {caseData.client.full_name}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Email Address</p>
                  <p className="text-xs sm:text-sm text-on-surface font-medium">{caseData.client.email}</p>
                </div>
              </div>

              {caseData.client.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-lg">call</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Mobile Phone</p>
                    <p className="text-xs sm:text-sm text-on-surface font-medium">{caseData.client.phone}</p>
                  </div>
                </div>
              )}

              {caseData.client.address && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Office Address</p>
                    <p className="text-xs sm:text-sm text-on-surface font-medium">{caseData.client.address}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl text-outline mb-1 block">person_off</span>
              <p className="text-xs font-medium">No client information associated with this case.</p>
            </div>
          )}
        </section>

        {/* Hearings Schedule Card */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 sm:p-8 border border-outline-variant/60">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">gavel</span>
              <h2 className="text-base sm:text-lg font-bold text-primary">Hearings Schedule</h2>
            </div>
            <button
              onClick={openHearingModal}
              className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-container transition-all flex items-center gap-1 focus-ring btn-press cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Schedule Hearing</span>
            </button>
          </div>

          {caseData.hearings && caseData.hearings.length > 0 ? (
            <div className="space-y-3">
              {caseData.hearings.map((hearing) => (
                <div
                  key={hearing.id}
                  className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 hover:border-primary transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-lg">event</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-primary">
                        {hearing.court_room}
                      </p>
                      <p className="text-[11px] font-medium text-outline">
                        {new Date(hearing.hearing_date).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={hearing.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl text-outline mb-1 block">event_busy</span>
              <p className="text-xs font-medium mb-3">No hearings scheduled for this case yet.</p>
              <button
                onClick={openHearingModal}
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all inline-flex items-center gap-1.5 focus-ring btn-press cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">event_available</span>
                <span>Schedule First Hearing</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Case Timeline */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-xl">timeline</span>
          <h2 className="text-base sm:text-lg font-bold text-primary">Case Timeline</h2>
        </div>

        {caseData.timeline && caseData.timeline.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-outline-variant/60 space-y-6 ml-2">
            {caseData.timeline.map((event) => (
              <div key={event.id} className="relative">
                <span className="absolute -left-[37px] sm:-left-[45px] top-0 bg-surface-container-lowest flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-outline-variant/80 text-primary shadow-xs">
                  <span className="material-symbols-outlined text-xs sm:text-sm">
                    {getTimelineIcon(event.event_type)}
                  </span>
                </span>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-xs sm:text-sm font-bold text-primary">
                      {event.title}
                    </h3>
                    <span className="text-[11px] font-medium text-outline">
                      {new Date(event.event_date).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">
                    {event.description}
                  </p>
                  <StatusBadge status={event.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl text-outline mb-1 block">history_toggle_off</span>
            <p className="text-xs font-medium">No timeline events recorded for this case.</p>
          </div>
        )}
      </section>

      {/* Case History (Tasks) */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-xl">history</span>
          <h2 className="text-base sm:text-lg font-bold text-primary">Case History & Tasks</h2>
        </div>

        {caseData.tasks && caseData.tasks.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">Task</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">Description</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline text-center">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {caseData.tasks.map((task) => (
                  <tr key={task.id} className="table-row-hover">
                    <td className="px-5 py-3.5 text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                      {task.title}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-surface-variant max-w-xs truncate">
                      {task.description || <span className="italic text-outline">No description</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-outline text-right whitespace-nowrap">
                      {new Date(task.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-outline mb-1 block">assignment</span>
            <p className="text-xs font-medium">No tasks or history records exist for this case.</p>
          </div>
        )}
      </section>

      {/* Schedule Hearing Modal */}
      {isHearingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                <h2 className="text-base font-extrabold text-primary">Schedule Hearing for #{caseData.case_number}</h2>
              </div>
              <button
                onClick={() => setIsHearingModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high focus-ring"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form onSubmit={handleScheduleHearingSubmit} className="p-6 space-y-4">
              {hearingModalError && (
                <div className="p-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg text-error">error</span>
                  <span>{hearingModalError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Date & Time *</label>
                <input
                  type="datetime-local"
                  value={hearingFormData.hearing_date}
                  onChange={(e) => setHearingFormData({ ...hearingFormData, hearing_date: e.target.value })}
                  className={`bg-surface-container-low border ${hearingFormErrors.hearing_date ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {hearingFormErrors.hearing_date && <span className="text-[11px] text-error font-medium">{hearingFormErrors.hearing_date}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Court / Location Venue *</label>
                <input
                  type="text"
                  placeholder="e.g. Federal Court, Room 402B"
                  value={hearingFormData.court_room}
                  onChange={(e) => setHearingFormData({ ...hearingFormData, court_room: e.target.value })}
                  className={`bg-surface-container-low border ${hearingFormErrors.court_room ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {hearingFormErrors.court_room && <span className="text-[11px] text-error font-medium">{hearingFormErrors.court_room}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Presiding Judge</label>
                  <input
                    type="text"
                    placeholder="e.g. Judge Sarah Jenkins"
                    value={hearingFormData.judge_name}
                    onChange={(e) => setHearingFormData({ ...hearingFormData, judge_name: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Type</label>
                  <select
                    value={hearingFormData.hearing_type}
                    onChange={(e) => setHearingFormData({ ...hearingFormData, hearing_type: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
                  >
                    <option value="Trial">Trial / Full Hearing</option>
                    <option value="Initial Hearing">Initial Hearing</option>
                    <option value="Evidence Submission">Evidence Submission</option>
                    <option value="Arguments">Arguments</option>
                    <option value="Motion Hearing">Motion Hearing</option>
                    <option value="Final Verdict">Final Verdict</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Notes / Preparation Instructions</label>
                <textarea
                  rows="2"
                  placeholder="Additional hearing preparation notes..."
                  value={hearingFormData.notes}
                  onChange={(e) => setHearingFormData({ ...hearingFormData, notes: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHearingModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hearingSubmitLoading}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                >
                  {hearingSubmitLoading ? "Scheduling..." : "Schedule Hearing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Section */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/60 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            <h2 className="font-bold text-primary text-sm sm:text-base">Legal Case Documents</h2>
            <span className="ml-1 px-2.5 py-0.5 bg-secondary-container text-on-secondary-container text-[11px] font-extrabold rounded-full">
              {documents.length}
            </span>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs"
            id="case-upload-doc-btn"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            <span>Upload Document</span>
          </button>
        </div>

        {docSuccessMsg && (
          <div className="flex items-center gap-2 mx-6 mt-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl px-4 py-2.5 text-xs font-medium">
            <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
            <p>{docSuccessMsg}</p>
          </div>
        )}

        {docsLoading && (
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-secondary-container border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-medium text-on-surface-variant animate-pulse-subtle">Loading case documents...</p>
          </div>
        )}

        {!docsLoading && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <span className="material-symbols-outlined text-3xl text-outline mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
            <p className="text-xs sm:text-sm font-bold text-primary">No case documents uploaded yet</p>
            <p className="text-xs text-on-surface-variant">Click "Upload Document" to attach FIR, Evidence, Court Orders, and Affidavits.</p>
          </div>
        )}

        {!docsLoading && documents.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">Document Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">Type</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">File Size</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline">Uploaded Date</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {documents.map((doc) => (
                  <tr key={doc.id} className="table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {getFileIcon(doc.mime_type)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-primary truncate max-w-[220px]">{doc.title || doc.file_name}</p>
                          <p className="text-[11px] text-outline truncate max-w-[220px]">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${getDocTypeBadge(doc.document_type)}`}>
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-on-surface font-medium">{formatFileSize(doc.file_size)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-outline whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDocPreview(doc)} title="Preview" className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container-high transition-colors focus-ring cursor-pointer" id={`preview-doc-${doc.id}`}>
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button onClick={() => handleDocDownload(doc)} title="Download" className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container-high transition-colors focus-ring cursor-pointer" id={`download-doc-${doc.id}`}>
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                        <button onClick={() => openDocDelete(doc)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg text-error hover:bg-error-container/40 transition-colors focus-ring cursor-pointer" id={`delete-doc-${doc.id}`}>
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
      </section>

      {/* Document Delete Modal */}
      {isDocDeleteOpen && docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-md w-full overflow-hidden shadow-2xl animate-scale-in p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center text-error shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
              </div>
              <div>
                <h3 className="font-bold text-primary text-base">Delete Legal Document</h3>
                <p className="text-xs text-outline">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-error-container/20 border border-error/30 rounded-xl p-3.5 mb-5">
              <p className="text-xs text-on-surface leading-relaxed font-medium">
                Delete <strong>"{docToDelete.title || docToDelete.file_name}"</strong>? The file will be permanently removed from server storage.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { setIsDocDeleteOpen(false); setDocToDelete(null); }} disabled={docDeleteLoading} className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press">
                Cancel
              </button>
              <button onClick={confirmDocDelete} disabled={docDeleteLoading} className="flex items-center gap-1.5 px-5 py-2 bg-error text-on-error font-semibold text-xs rounded-xl hover:opacity-90 transition-all focus-ring btn-press cursor-pointer shadow-xs" id="confirm-doc-delete-btn">
                {docDeleteLoading ? (
                  <><span className="w-3 h-3 border-2 border-on-error/40 border-t-on-error rounded-full animate-spin" />Deleting...</>
                ) : (
                  <><span className="material-symbols-outlined text-base">delete</span>Delete Document</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        caseId={parseInt(caseId)}
        caseNumber={caseData?.case_number || caseId}
        onSuccess={(newDoc) => {
          setDocSuccessMsg(`"${newDoc.title || newDoc.file_name}" uploaded successfully.`);
          fetchDocuments();
        }}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => { setIsPreviewModalOpen(false); setPreviewDoc(null); }}
        document={previewDoc}
      />

    </div>
  );
}

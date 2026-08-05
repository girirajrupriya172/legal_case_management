import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  getHearings,
  getUpcomingHearings,
  scheduleHearing,
  updateHearing,
  deleteHearing
} from "../services/hearingService";
import { getCases } from "../services/caseService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";

export default function Hearings() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming', 'history', 'all'
  const [hearings, setHearings] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [total, setTotal] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState("");

  // Modal Visibility States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    case_id: "",
    hearing_date: "",
    court_room: "",
    judge_name: "",
    hearing_type: "Trial",
    notes: "",
    outcome: "",
    status: "Scheduled"
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [modalGeneralError, setModalGeneralError] = useState("");

  // Searchable Cases Dropdown inside Schedule Modal
  const [casesList, setCasesList] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [selectedCaseObj, setSelectedCaseObj] = useState(null);
  const dropdownRef = useRef(null);

  // Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Check Incoming Router Location State
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotification(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Success Notification Auto-Dismiss
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => setSuccessNotification(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // Click Outside Listener for Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCaseDropdownOpen(false);
      }
    };
    if (isCaseDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCaseDropdownOpen]);

  // Data Fetching
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "upcoming") {
        const upcomingData = await getUpcomingHearings(20);
        setUpcomingList(upcomingData || []);
        const allData = await getHearings({ page: 1, limit: 1 });
        setTotal(allData.total || 0);
        setUpcomingCount(allData.upcoming_count || upcomingData.length);
        setCompletedCount(allData.completed_count || 0);
      } else {
        const isUpcomingFilter = activeTab === "upcoming";
        const isHistoryFilter = activeTab === "history";

        const data = await getHearings({
          page,
          limit,
          search: debouncedSearch,
          status: isHistoryFilter ? "Completed" : filterStatus,
          upcomingOnly: isUpcomingFilter
        });

        setHearings(data.hearings || []);
        setTotal(data.total || 0);
        setUpcomingCount(data.upcoming_count || 0);
        setCompletedCount(data.completed_count || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load hearing records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, debouncedSearch, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch cases for Schedule Hearing dropdown on demand
  const loadCasesForModal = async () => {
    try {
      setCasesLoading(true);
      const res = await getCases({ page: 1, limit: 100 });
      setCasesList(res.items || res.cases || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error("Failed to load cases list:", err);
    } finally {
      setCasesLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const openScheduleModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const formattedDefaultDate = tomorrow.toISOString().slice(0, 16);

    setFormData({
      case_id: "",
      hearing_date: formattedDefaultDate,
      court_room: "",
      judge_name: "",
      hearing_type: "Trial",
      notes: "",
      outcome: "",
      status: "Scheduled"
    });
    setSelectedCaseObj(null);
    setFormErrors({});
    setModalGeneralError("");
    setIsScheduleModalOpen(true);
    loadCasesForModal();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "schedule" || params.get("schedule") === "true") {
      openScheduleModal();
    }
  }, [location.search]);

  const openEditModal = (hearing) => {
    setSelectedHearing(hearing);
    let formattedDate = "";
    if (hearing.hearing_date) {
      const d = new Date(hearing.hearing_date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      formattedDate = d.toISOString().slice(0, 16);
    }

    setFormData({
      case_id: hearing.case_id,
      hearing_date: formattedDate,
      court_room: hearing.court_room || "",
      judge_name: hearing.judge_name || "",
      hearing_type: hearing.hearing_type || "Trial",
      notes: hearing.notes || "",
      outcome: hearing.outcome || "",
      status: hearing.status || "Scheduled"
    });
    setSelectedCaseObj(hearing.case);
    setFormErrors({});
    setModalGeneralError("");
    setIsEditModalOpen(true);
    loadCasesForModal();
  };

  const openDeleteModal = (hearing) => {
    setSelectedHearing(hearing);
    setModalGeneralError("");
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.case_id) errors.case_id = "Please select a legal case.";
    if (!formData.hearing_date) errors.hearing_date = "Hearing date & time is required.";
    if (!formData.court_room || formData.court_room.trim() === "") {
      errors.court_room = "Courtroom / Venue detail is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");

      const payload = {
        case_id: parseInt(formData.case_id, 10),
        hearing_date: new Date(formData.hearing_date).toISOString(),
        court_room: formData.court_room.trim(),
        judge_name: formData.judge_name.trim() || null,
        hearing_type: formData.hearing_type,
        notes: formData.notes.trim() || null,
        status: formData.status
      };

      await scheduleHearing(payload);
      setIsScheduleModalOpen(false);
      setSuccessNotification("New court hearing has been successfully scheduled!");
      loadData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to schedule hearing. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");

      const payload = {
        case_id: parseInt(formData.case_id, 10),
        hearing_date: new Date(formData.hearing_date).toISOString(),
        court_room: formData.court_room.trim(),
        judge_name: formData.judge_name.trim() || null,
        hearing_type: formData.hearing_type,
        notes: formData.notes.trim() || null,
        outcome: formData.outcome.trim() || null,
        status: formData.status
      };

      await updateHearing(selectedHearing.id, payload);
      setIsEditModalOpen(false);
      setSuccessNotification("Court hearing record has been updated successfully.");
      loadData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to update hearing record.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      await deleteHearing(selectedHearing.id);
      setIsDeleteModalOpen(false);
      setSuccessNotification("Scheduled hearing record deleted.");
      loadData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to delete hearing.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const filteredCases = casesList.filter(
    (c) =>
      c.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(caseSearchQuery.toLowerCase())
  );

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
              Calendar & Docket
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Hearing Management</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Schedule court hearings, monitor upcoming sessions, track judge rulings, and review hearing history.
          </p>
        </div>
        <button
          onClick={openScheduleModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-xs sm:text-sm hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">event_available</span>
          <span>Schedule Hearing</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex items-center gap-4 card-hover">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">event</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Upcoming Hearings</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary">{upcomingCount}</h2>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex items-center gap-4 card-hover">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Completed Hearings</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary">{completedCount}</h2>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex items-center gap-4 card-hover">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Docket Hearings</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary">{total}</h2>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-outline-variant/60 flex items-center gap-6 sm:gap-8 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => {
            setActiveTab("upcoming");
            setPage(1);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "upcoming"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">schedule</span>
          <span>Upcoming Hearings</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            setPage(1);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          <span>Hearing History</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
          <span>All Hearings Directory</span>
        </button>
      </div>

      {/* Filter & Search Panel */}
      {activeTab === "all" && (
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search judge, court, case..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-full text-xs sm:text-sm text-on-surface placeholder:text-outline focus-ring outline-none transition-all"
              aria-label="Search hearings"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-0.5 rounded-full hover:bg-surface-container-high transition-colors focus-ring"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filterStatus" className="text-xs font-bold uppercase tracking-wider text-outline whitespace-nowrap">
              Status:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Adjourned">Adjourned</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      {loading ? (
        <LoadingSpinner message="Loading court calendar..." minHeight="min-h-[350px]" />
      ) : error ? (
        <ErrorMessage
          title="Sync Error"
          message={error}
          onRetry={loadData}
          retryLabel="Retry Connection"
          minHeight="min-h-[350px]"
        />
      ) : activeTab === "upcoming" ? (
        /* Upcoming Hearings Grid View */
        upcomingList.length === 0 ? (
          <div className="min-h-[300px] flex flex-col justify-center items-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 text-center shadow-xs animate-fade-in">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
              <span className="material-symbols-outlined text-3xl">event_busy</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">No Upcoming Hearings</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              There are no court hearings scheduled for upcoming dates. Click "Schedule Hearing" to add a session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {upcomingList.map((h) => (
              <div
                key={h.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs p-6 flex flex-col justify-between card-hover group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      {h.case && (
                        <Link
                          to={`/cases/${h.case.id}`}
                          className="text-[11px] font-bold text-primary uppercase tracking-wider hover:underline"
                        >
                          Case #{h.case.case_number}
                        </Link>
                      )}
                      <h3 className="text-base font-extrabold text-primary group-hover:text-primary transition-colors">
                        {h.case ? h.case.title : "Hearing Session"}
                      </h3>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>

                  {/* Date & Time Highlight Pill */}
                  <div className="p-3 bg-secondary-container/50 rounded-xl mb-4 flex items-center gap-3 border border-outline-variant/30">
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-xl">calendar_month</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-extrabold text-primary">
                        {new Date(h.hearing_date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-outline font-semibold">
                        {new Date(h.hearing_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-on-surface-variant mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-primary">balance</span>
                      <span className="font-bold text-on-surface">{h.court_room}</span>
                    </div>

                    {h.judge_name && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-primary">gavel</span>
                        <span>Presiding: <strong className="text-on-surface font-semibold">{h.judge_name}</strong></span>
                      </div>
                    )}

                    {h.hearing_type && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-primary">category</span>
                        <span>Type: <strong className="text-on-surface font-semibold">{h.hearing_type}</strong></span>
                      </div>
                    )}

                    {h.notes && (
                      <p className="text-xs text-on-surface bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40 italic">
                        "{h.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(h)}
                    className="px-3.5 py-1.5 border border-outline-variant text-primary text-xs font-semibold rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-1 focus-ring btn-press cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(h)}
                    className="p-1.5 text-error hover:bg-error-container/40 rounded-xl transition-colors focus-ring cursor-pointer"
                    title="Delete Hearing"
                    aria-label="Delete hearing"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )
      ) : (
        /* Table View */
        hearings.length === 0 ? (
          <div className="min-h-[300px] flex flex-col justify-center items-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 text-center shadow-xs animate-fade-in">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
              <span className="material-symbols-outlined text-3xl">gavel</span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">No Hearing Records Found</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              No hearing records match your active tab filter or search query.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden animate-fade-in">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/60">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Date & Time</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Case Reference</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Court Venue</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Judge / Type</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-center">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {hearings.map((h) => (
                    <tr key={h.id} className="table-row-hover">
                      <td className="px-5 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-primary">
                        {new Date(h.hearing_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {h.case ? (
                          <Link to={`/cases/${h.case.id}`} className="font-bold text-xs sm:text-sm text-primary hover:underline">
                            #{h.case.case_number} - {h.case.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-outline italic">Unlinked Case</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs sm:text-sm text-on-surface font-semibold max-w-xs truncate">
                        {h.court_room}
                      </td>
                      <td className="px-5 py-4 text-xs text-on-surface-variant">
                        <div className="font-semibold text-on-surface">{h.judge_name || <span className="italic text-outline font-normal">Unassigned</span>}</div>
                        <div className="text-[11px] text-outline">{h.hearing_type}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-colors focus-ring cursor-pointer"
                            title="Edit Hearing Details"
                            aria-label="Edit hearing"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(h)}
                            className="p-1.5 rounded-lg hover:bg-error-container/40 text-error transition-colors focus-ring cursor-pointer"
                            title="Delete Hearing"
                            aria-label="Delete hearing"
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

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/60 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-outline font-bold uppercase tracking-wider">
                Showing page {page} of {totalPages} ({total} total hearings)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 border border-outline-variant/80 bg-surface-container-lowest rounded-xl text-xs font-semibold hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-all text-on-surface flex items-center gap-1 focus-ring btn-press"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                  <span>Prev</span>
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 border border-outline-variant/80 bg-surface-container-lowest rounded-xl text-xs font-semibold hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-all text-on-surface flex items-center gap-1 focus-ring btn-press"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        )
      )}

      {/* Schedule Hearing Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-xl w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                <h2 className="text-base font-extrabold text-primary">Schedule Court Hearing</h2>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high focus-ring"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {modalGeneralError && (
                <div className="p-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg text-error">error</span>
                  <span>{modalGeneralError}</span>
                </div>
              )}

              {/* Case Dropdown */}
              <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Associated Legal Case *</label>
                <div
                  onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
                  className={`bg-surface-container-low border ${formErrors.case_id ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer select-none focus-ring`}
                  role="button"
                  tabIndex={0}
                >
                  {selectedCaseObj ? (
                    <span className="text-on-surface font-semibold truncate">#{selectedCaseObj.case_number} - {selectedCaseObj.title}</span>
                  ) : (
                    <span className="text-outline">Search or select case...</span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant text-base ml-2 shrink-0">
                    {isCaseDropdownOpen ? "arrow_drop_up" : "arrow_drop_down"}
                  </span>
                </div>

                {isCaseDropdownOpen && (
                  <div className="absolute top-[100%] left-0 w-full z-50 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl mt-1.5 overflow-hidden animate-scale-in">
                    <div className="p-2 border-b border-outline-variant/60 bg-surface-container-low flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-base">search</span>
                      <input
                        type="text"
                        placeholder="Search case number or title..."
                        value={caseSearchQuery}
                        onChange={(e) => setCaseSearchQuery(e.target.value)}
                        className="bg-transparent border-none text-xs w-full focus:outline-none text-on-surface"
                        autoFocus
                      />
                      {caseSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCaseSearchQuery("")}
                          className="text-outline hover:text-primary p-0.5 rounded-full hover:bg-surface-container-high transition-colors focus-ring"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30">
                      {casesLoading ? (
                        <div className="p-4 text-center text-xs text-on-surface-variant animate-pulse-subtle flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          <span>Loading legal cases directory...</span>
                        </div>
                      ) : filteredCases.length === 0 ? (
                        <div className="p-4 text-center text-xs text-on-surface-variant font-medium">
                          {casesList.length === 0 ? "No active legal cases found." : `No cases match "${caseSearchQuery}"`}
                        </div>
                      ) : (
                        filteredCases.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCaseObj(c);
                              setFormData((prev) => ({ ...prev, case_id: c.id }));
                              setIsCaseDropdownOpen(false);
                              setCaseSearchQuery("");
                            }}
                            className={`px-3.5 py-2 text-xs hover:bg-surface-container-high transition-colors cursor-pointer flex flex-col gap-0.5 ${
                              formData.case_id === c.id ? "bg-surface-container-high font-bold" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-primary font-bold">#{c.case_number}</strong>
                              {c.status && (
                                <span className="text-[10px] text-outline uppercase font-semibold">{c.status}</span>
                              )}
                            </div>
                            <span className="text-on-surface font-medium truncate">{c.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {formErrors.case_id && <span className="text-[11px] text-error font-medium">{formErrors.case_id}</span>}
              </div>

              {/* Hearing Date & Venue */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.hearing_date}
                    onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                    className={`bg-surface-container-low border ${formErrors.hearing_date ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                  />
                  {formErrors.hearing_date && <span className="text-[11px] text-error font-medium">{formErrors.hearing_date}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Court / Location Venue *</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 402B - Federal Court"
                    value={formData.court_room}
                    onChange={(e) => setFormData({ ...formData, court_room: e.target.value })}
                    className={`bg-surface-container-low border ${formErrors.court_room ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                  />
                  {formErrors.court_room && <span className="text-[11px] text-error font-medium">{formErrors.court_room}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Presiding Judge</label>
                  <input
                    type="text"
                    placeholder="e.g. Hon. Judge Alexander"
                    value={formData.judge_name}
                    onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Type</label>
                  <select
                    value={formData.hearing_type}
                    onChange={(e) => setFormData({ ...formData, hearing_type: e.target.value })}
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Notes / Instructions</label>
                <textarea
                  rows="3"
                  placeholder="Notes for legal counsel or required documents..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                >
                  {formSubmitLoading ? "Scheduling..." : "Schedule Hearing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hearing Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-xl w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                <h2 className="text-base font-extrabold text-primary">Edit Hearing Details & Ruling</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high focus-ring"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {modalGeneralError && (
                <div className="p-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg text-error">error</span>
                  <span>{modalGeneralError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.hearing_date}
                    onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Court / Location Venue</label>
                  <input
                    type="text"
                    value={formData.court_room}
                    onChange={(e) => setFormData({ ...formData, court_room: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Presiding Judge</label>
                  <input
                    type="text"
                    value={formData.judge_name}
                    onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Adjourned">Adjourned</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Hearing Outcome / Judge Ruling</label>
                <textarea
                  rows="2"
                  placeholder="Record judicial decision or settlement directives..."
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                >
                  {formSubmitLoading ? "Updating..." : "Update Hearing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Hearing Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-error-container/20 border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="text-base font-extrabold">Confirm Hearing Deletion</h2>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high focus-ring"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <div className="p-6 space-y-4">
              {modalGeneralError && (
                <div className="p-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg text-error">error</span>
                  <span>{modalGeneralError}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                Are you sure you want to delete the hearing scheduled for{" "}
                <strong className="text-primary font-bold">
                  {selectedHearing && new Date(selectedHearing.hearing_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </strong>{" "}
                at <strong className="text-primary font-bold">{selectedHearing?.court_room}</strong>?
              </p>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
                  disabled={formSubmitLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={formSubmitLoading}
                  className="px-5 py-2 bg-error text-on-error font-semibold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                >
                  {formSubmitLoading ? "Deleting..." : "Delete Hearing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

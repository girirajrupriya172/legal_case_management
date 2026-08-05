import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCases, updateCase, deleteCase } from "../services/caseService";
import { getClients } from "../services/clientService";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";

/**
 * Semantic helper to return style classes for priority badges.
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

export default function Cases() {
  const location = useLocation();

  // 1. Reactive state variables for case records and pagination
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 2. Filter and search states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // 3. UI states for loading indicators and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 4. Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // 5. Form editing states (inside Edit Modal)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    court_details: "",
    priority: "Medium",
    status: "Pending",
    client_id: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [successNotification, setSuccessNotification] = useState("");
  const [modalGeneralError, setModalGeneralError] = useState("");

  // Search clients list inside the Edit Case modal (searchable dropdown)
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const dropdownRef = useRef(null);

  // Check incoming location state for success notifications from NewCase navigation
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotification(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 6. Debounce search input logic (wait 350ms after user stops typing)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // 7. Data loading trigger function
  const loadCasesData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCases({
        page,
        limit,
        search: debouncedSearch,
        status: filterStatus,
        priority: filterPriority
      });
      setCases(data.items || data.cases || []);
      setTotal(data.total || 0);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load cases directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus, filterPriority]);

  // 8. Trigger load on dependency updates
  useEffect(() => {
    loadCasesData();
  }, [loadCasesData]);

  // 9. Success banner auto-dismiss logic
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // 10. Dropdown click-outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
    };
    if (isClientDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClientDropdownOpen]);

  // Fetch clients for Edit Modal dropdown on demand
  const loadClientsForModal = async () => {
    try {
      setClientsLoading(true);
      const response = await getClients({ page: 1, limit: 100 });
      setClients(response.clients || []);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setClientsLoading(false);
    }
  };

  // 11. Pagination calculations
  const totalPages = Math.ceil(total / limit) || 1;

  // 12. Modal trigger helpers
  const openEditModal = (caseRecord) => {
    setSelectedCase(caseRecord);
    setFormData({
      title: caseRecord.title,
      description: caseRecord.description || "",
      court_details: caseRecord.court_details || "",
      priority: caseRecord.priority,
      status: caseRecord.status,
      client_id: caseRecord.client_id
    });
    setSelectedClient(caseRecord.client);
    setFormErrors({});
    setModalGeneralError("");
    setIsEditModalOpen(true);
    loadClientsForModal();
  };

  const openDeleteModal = (caseRecord) => {
    setSelectedCase(caseRecord);
    setModalGeneralError("");
    setIsDeleteModalOpen(true);
  };

  // 13. Edit Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.title || formData.title.trim() === "") {
      errors.title = "Case title is required.";
    }
    if (!formData.client_id) {
      errors.client_id = "Please associate a client with this case.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 14. Edit Case Submission Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        court_details: formData.court_details.trim() || null,
        priority: formData.priority,
        status: formData.status,
        client_id: parseInt(formData.client_id, 10)
      };

      await updateCase(selectedCase.id, payload);
      setIsEditModalOpen(false);
      setSuccessNotification(`Case file "${selectedCase.case_number}" has been successfully updated.`);
      loadCasesData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to update case file. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // 15. Delete Case Confirmation Handler
  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      await deleteCase(selectedCase.id);
      setIsDeleteModalOpen(false);
      setSuccessNotification(`Case file "${selectedCase.case_number}" has been purged from the system.`);
      
      if (cases.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadCasesData();
      }
    } catch (err) {
      setModalGeneralError(err.message || "Failed to delete case record. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Filter clients for modal search dropdown
  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in relative">
      
      {/* Success Notification Alert Toast */}
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
              Docket
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Cases Directory</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Track firm litigations, manage court room details, filing statuses, and priorities.
          </p>
        </div>
        <Link
          to="/cases/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-xs sm:text-sm hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">folder_open</span>
          <span>Open Case</span>
        </Link>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search Input Bar */}
        <div className="relative w-full lg:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search case #, title, court, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-full text-xs sm:text-sm text-on-surface placeholder:text-outline focus-ring outline-none transition-all"
            aria-label="Search cases"
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

        {/* Filter Controls */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-stretch sm:items-center justify-end">
          
          {/* Status Filter */}
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
              <option value="Pending">Pending</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Won">Won / Settled</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filterPriority" className="text-xs font-bold uppercase tracking-wider text-outline whitespace-nowrap">
              Priority:
            </label>
            <select
              id="filterPriority"
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Limit selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="limitSelect" className="text-xs font-bold uppercase tracking-wider text-outline whitespace-nowrap">
              Show:
            </label>
            <select
              id="limitSelect"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            >
              <option value="5">5 rows</option>
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Cases Content Viewport */}
      {loading ? (
        <LoadingSpinner message="Fetching active case docket..." minHeight="min-h-[350px]" />
      ) : error ? (
        <ErrorMessage
          title="Sync Failed"
          message={error}
          onRetry={loadCasesData}
          retryLabel="Retry Connection"
          minHeight="min-h-[350px]"
        />
      ) : cases.length === 0 ? (
        <div className="min-h-[350px] flex flex-col justify-center items-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 text-center animate-fade-in shadow-xs">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
            <span className="material-symbols-outlined text-3xl">folder_off</span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">No Cases Found</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            We couldn't find any case files matching your search query or filters. Open a new case file to populate your docket.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden animate-fade-in">
          
          {/* Responsive table container */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Case File</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Title</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Client Name</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">Court / Location</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-center">Priority</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-center">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {cases.map((c) => (
                  <tr key={c.id} className="table-row-hover group">
                    <td className="px-5 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-primary">
                      <Link
                        to={`/cases/${c.id}`}
                        className="hover:underline font-extrabold text-primary"
                      >
                        #{c.case_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-on-surface max-w-xs truncate">
                      <Link
                        to={`/cases/${c.id}`}
                        className="hover:underline text-primary font-bold group-hover:text-primary transition-colors"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {c.client ? (
                        <Link
                          to={`/clients/${c.client_id}`}
                          className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-2"
                        >
                          <div className="w-6 h-6 bg-primary-fixed text-primary text-[10px] rounded-full flex items-center justify-center font-extrabold shadow-xs">
                            {c.client.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span>{c.client.full_name}</span>
                        </Link>
                      ) : (
                        <span className="text-outline italic text-xs">Unassociated</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs sm:text-sm text-on-surface max-w-xs truncate">
                      {c.court_details || <span className="text-outline italic text-xs">Not Assigned</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${getPriorityBadgeClass(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/cases/${c.id}`}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-colors cursor-pointer focus-ring"
                          title="View Case Details"
                          aria-label={`View details for case ${c.case_number}`}
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-colors cursor-pointer focus-ring"
                          title="Edit Case File"
                          aria-label={`Edit case ${c.case_number}`}
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          className="p-1.5 rounded-lg hover:bg-error-container/40 text-error transition-colors cursor-pointer focus-ring"
                          title="Purge Case File"
                          aria-label={`Delete case ${c.case_number}`}
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

          {/* Pagination Component Footer */}
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
      )}

      {/* Edit Case Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-in">
            
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit_square</span>
                <h2 className="text-base font-extrabold text-primary">Edit Case File Metadata</h2>
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
                
                {/* Left fields: Title, Client Selector, Description */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Case Title / Caption *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`bg-surface-container-low border ${formErrors.title ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                    />
                    {formErrors.title && <span className="text-[11px] text-error font-medium">{formErrors.title}</span>}
                  </div>

                  <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Associated Client *</label>
                    <div
                      onClick={() => !clientsLoading && setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className={`bg-surface-container-low border ${formErrors.client_id ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer select-none focus-ring`}
                      role="button"
                      tabIndex={0}
                    >
                      {selectedClient ? (
                        <span className="text-on-surface font-semibold">{selectedClient.full_name}</span>
                      ) : (
                        <span className="text-outline">Select case client...</span>
                      )}
                      <span className="material-symbols-outlined text-on-surface-variant text-base">
                        {isClientDropdownOpen ? "arrow_drop_up" : "arrow_drop_down"}
                      </span>
                    </div>

                    {isClientDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full z-40 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl mt-1.5 overflow-hidden animate-scale-in">
                        <div className="p-2 border-b border-outline-variant/60 bg-surface-container-low flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-base">search</span>
                          <input
                            type="text"
                            placeholder="Filter clients..."
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-xs w-full focus:outline-none text-on-surface"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30">
                          {filteredClients.map((cl) => (
                            <div
                              key={cl.id}
                              onClick={() => {
                                setSelectedClient(cl);
                                setFormData((prev) => ({ ...prev, client_id: cl.id }));
                                setIsClientDropdownOpen(false);
                                setClientSearchQuery("");
                              }}
                              className="px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                            >
                              {cl.full_name} ({cl.email})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {formErrors.client_id && <span className="text-[11px] text-error font-medium">{formErrors.client_id}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Case Summary / Notes</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Right fields: Court Venue, Priority, Status */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Court / Location Venue</label>
                    <input
                      type="text"
                      value={formData.court_details}
                      onChange={(e) => setFormData({ ...formData, court_details: e.target.value })}
                      className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Priority Urgency</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Filing Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending Approval</option>
                      <option value="Ongoing">Ongoing Litigation</option>
                      <option value="Won">Dispute Won / Settled</option>
                      <option value="Lost">Dispute Lost</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface font-semibold text-xs rounded-xl hover:bg-surface-container-high transition-colors focus-ring btn-press"
                  disabled={formSubmitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                  disabled={formSubmitLoading}
                >
                  {formSubmitLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Case File</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            
            <header className="px-6 py-4 bg-error-container/20 border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="text-base font-extrabold">Confirm Purge</h2>
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
                Are you sure you want to delete case file <strong className="text-primary font-bold">#{selectedCase?.case_number} - {selectedCase?.title}</strong>?
              </p>

              <div className="p-3.5 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">report_problem</span>
                <div>
                  <h3 className="text-xs font-bold text-error uppercase tracking-wider mb-0.5">Cascading Action Warning</h3>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant">
                    Purging this case record will permanently remove all associated scheduled court hearings and document references. This action cannot be undone.
                  </p>
                </div>
              </div>

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
                  className="px-5 py-2 bg-error text-on-error font-semibold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
                  disabled={formSubmitLoading}
                >
                  {formSubmitLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin"></div>
                      <span>Purging...</span>
                    </>
                  ) : (
                    <span>Purge Permanently</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { getClients, createClient, updateClient, deleteClient } from "../services/clientService";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function Clients() {
  const location = useLocation();

  // 1. Reactive state variables for client records and pagination metadata
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 2. State for filters and search terms
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // 3. UI states for loading indicators and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 4. Modal visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // 5. Form field states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [successNotification, setSuccessNotification] = useState("");
  const [modalGeneralError, setModalGeneralError] = useState("");

  // Check incoming location state for success messages
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotification(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 6. Debounce search input logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // 7. Data loading trigger function
  const loadClientsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClients({
        page,
        limit,
        search: debouncedSearch,
        filterStatus,
      });
      setClients(data.items || data.clients || []);
      setTotal(data.total || 0);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sync clients directory. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus]);

  // 8. Trigger load on dependency updates
  useEffect(() => {
    loadClientsData();
  }, [loadClientsData]);

  // 9. Success banner auto-dismiss logic
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // 10. Pagination helper calculations
  const totalPages = Math.ceil(total / limit) || 1;

  // 11. Event handlers for directory navigation
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value, 10));
    setPage(1);
  };

  // 12. CRUD Modal Trigger Helpers
  const openAddModal = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: ""
    });
    setFormErrors({});
    setModalGeneralError("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || ""
    });
    setFormErrors({});
    setModalGeneralError("");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setModalGeneralError("");
    setIsDeleteModalOpen(true);
  };

  // 13. Form Client-Side Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.full_name || formData.full_name.trim() === "") {
      errors.full_name = "Full legal name is required.";
    }

    if (!formData.email || formData.email.trim() === "") {
      errors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address format.";
      }
    }

    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = "Invalid phone number format.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 14. Add Client submission handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      await createClient(formData);
      setIsAddModalOpen(false);
      setSuccessNotification(`Client "${formData.full_name}" has been successfully onboarded.`);
      loadClientsData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to add client. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // 15. Edit Client submission handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      await updateClient(selectedClient.id, formData);
      setIsEditModalOpen(false);
      setSuccessNotification(`Client "${formData.full_name}" details have been updated.`);
      loadClientsData();
    } catch (err) {
      setModalGeneralError(err.message || "Failed to update client. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // 16. Delete Client confirmation handler
  const handleDeleteConfirm = async () => {
    try {
      setFormSubmitLoading(true);
      setModalGeneralError("");
      await deleteClient(selectedClient.id);
      setIsDeleteModalOpen(false);
      setSuccessNotification(`Client "${selectedClient.full_name}" and all associated cases were removed.`);

      if (clients.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadClientsData();
      }
    } catch (err) {
      setModalGeneralError(err.message || "Failed to delete client. Please try again.");
    } finally {
      setFormSubmitLoading(false);
    }
  };

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
              Directory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">Client Directory</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Manage your firm's clients and view their linked case files.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-xs sm:text-sm hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Add Client</span>
        </button>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search Input Bar */}
        <div className="relative w-full lg:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, email, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant/80 rounded-full text-xs sm:text-sm text-on-surface placeholder:text-outline focus-ring outline-none transition-all"
            aria-label="Search clients"
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
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="filterStatus" className="text-xs font-bold uppercase tracking-wider text-outline whitespace-nowrap">
              Filter:
            </label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={handleFilterChange}
              className="w-full sm:w-auto px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            >
              <option value="">All Clients</option>
              <option value="active_cases">With Active Cases</option>
              <option value="no_cases">With No Cases</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-xs font-bold uppercase tracking-wider text-outline whitespace-nowrap">
              Show:
            </label>
            <select
              id="pageSize"
              value={limit}
              onChange={handleLimitChange}
              className="w-full sm:w-auto px-3.5 py-2 bg-surface-container-low border border-outline-variant/80 rounded-xl text-xs sm:text-sm font-medium text-on-surface focus-ring outline-none cursor-pointer"
            >
              <option value="5">5 rows</option>
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      {loading ? (
        <LoadingSpinner message="Fetching clients directory..." minHeight="min-h-[350px]" />
      ) : error ? (
        <ErrorMessage
          title="Sync Failed"
          message={error}
          onRetry={loadClientsData}
          retryLabel="Retry Connection"
          minHeight="min-h-[350px]"
        />
      ) : clients.length === 0 ? (
        <div className="min-h-[350px] flex flex-col justify-center items-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 text-center animate-fade-in shadow-xs">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-outline">
            <span className="material-symbols-outlined text-3xl">person_search</span>
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">No clients found.</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            No client records exist in your account. Click "Add Client" above to register your first client.
          </p>
        </div>

      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden animate-fade-in">
          {/* Responsive Table Scroll Container */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                    Client Name
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                    Email Address
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                    Phone Number
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                    Office Address
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-center">
                    Case Files
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-outline text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="table-row-hover group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-fixed text-primary rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs">
                          {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-xs sm:text-sm font-bold text-primary group-hover:underline transition-all"
                        >
                          {client.full_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs sm:text-sm text-on-surface">
                      {client.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs sm:text-sm text-on-surface">
                      {client.phone || <span className="text-outline italic text-xs">N/A</span>}
                    </td>
                    <td className="px-5 py-4 text-xs sm:text-sm text-on-surface max-w-xs truncate">
                      {client.address || <span className="text-outline italic text-xs">N/A</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${client.case_count > 0
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                        {client.case_count} {client.case_count === 1 ? "case" : "cases"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/clients/${client.id}`}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-colors cursor-pointer focus-ring"
                          title="View Details"
                          aria-label={`View details for ${client.full_name}`}
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-primary transition-colors cursor-pointer focus-ring"
                          title="Edit Profile"
                          aria-label={`Edit ${client.full_name}`}
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(client)}
                          className="p-1.5 rounded-lg hover:bg-error-container/40 text-error transition-colors cursor-pointer focus-ring"
                          title="Delete Client"
                          aria-label={`Delete ${client.full_name}`}
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

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                <h2 className="text-base font-extrabold text-primary">New Client Onboarding</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high focus-ring"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </header>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {modalGeneralError && (
                <div className="p-3 bg-error-container/50 text-on-error-container border border-error/30 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-lg text-error">error</span>
                  <span>{modalGeneralError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.full_name ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.full_name && (
                  <span className="text-[11px] text-error font-medium">{formErrors.full_name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. jdoe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.email ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.email && (
                  <span className="text-[11px] text-error font-medium">{formErrors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.phone ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.phone && (
                  <span className="text-[11px] text-error font-medium">{formErrors.phone}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Office Address</label>
                <input
                  type="text"
                  placeholder="Street Address, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Client</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit_square</span>
                <h2 className="text-base font-extrabold text-primary">Edit Client Profile</h2>
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

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.full_name ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.full_name && (
                  <span className="text-[11px] text-error font-medium">{formErrors.full_name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. jdoe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.email ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.email && (
                  <span className="text-[11px] text-error font-medium">{formErrors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`bg-surface-container-low border ${formErrors.phone ? "border-error" : "border-outline-variant/80"} rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all`}
                />
                {formErrors.phone && (
                  <span className="text-[11px] text-error font-medium">{formErrors.phone}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Office Address</label>
                <input
                  type="text"
                  placeholder="Street Address, City, State, ZIP"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                />
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
                    <span>Update Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <header className="px-6 py-4 bg-error-container/20 border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="text-base font-extrabold">Confirm Deletion</h2>
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
                Are you sure you want to delete client <strong className="text-primary font-bold">{selectedClient?.full_name}</strong>?
              </p>

              <div className="p-3.5 bg-error-container/20 border border-error/30 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">report_problem</span>
                <div>
                  <h3 className="text-xs font-bold text-error uppercase tracking-wider mb-0.5">Cascading Delete Warning</h3>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant">
                    Deleting this client automatically removes all associated case files and scheduled court hearings. This action cannot be undone.
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
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Permanently</span>
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

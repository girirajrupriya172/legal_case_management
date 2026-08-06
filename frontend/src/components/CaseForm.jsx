import { useState, useEffect, useRef } from "react";
import { createCase } from "../services/caseService";
import { getClients } from "../services/clientService";

/**
 * CaseForm component provides a premium UI to input case metadata
 * and binds it with a searchable client directory selector.
 */
export default function CaseForm({ onSuccess, onCancel }) {
  // 1. Directory States
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // 2. Form States
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    court_details: "",
    priority: "Medium",
    status: "Pending",
    client_id: ""
  });

  // 3. Status States
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Ref for handling clicks outside the dropdown
  const dropdownRef = useRef(null);

  // 4. Fetch Clients for dropdown selection on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        // Load all clients (limit to 100 for local selection search within backend constraints)
        const response = await getClients({ page: 1, limit: 100 });
        setClients(response.clients || []);
      } catch (err) {
        console.error("Failed to load clients for dropdown selection:", err);
        setGeneralError("Failed to synchronize clients directory. Dropdown selection will be unavailable.");
      } finally {
        setClientsLoading(false);
      }
    };
    loadClients();
  }, []);

  // 5. Click outside detection to auto-close client dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 6. Filter clients based on user typing
  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 7. Client Select handler
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData((prev) => ({ ...prev, client_id: client.id }));
    setIsDropdownOpen(false);
    setSearchQuery("");
    // Clear validation error for client_id if any
    if (formErrors.client_id) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.client_id;
        return copy;
      });
    }
  };

  // 8. Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.title || formData.title.trim() === "") {
      errors.title = "Case title is required.";
    }
    if (!formData.client_id) {
      errors.client_id = "Please select a client to bind this case to.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 9. Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      setGeneralError("");
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        court_details: formData.court_details.trim() || null,
        priority: formData.priority,
        status: formData.status,
        client_id: parseInt(formData.client_id, 10)
      };

      await createCase(payload);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setGeneralError(err.message || "Failed to save case file. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-stack-md bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-[0_4px_24px_rgba(26,43,75,0.04)]">
      
      {/* General Alert Message */}
      {generalError && (
        <div className="p-4 bg-error-container text-on-error-container border border-error/20 rounded-xl flex items-center gap-3 text-sm font-semibold animate-fade-in">
          <span className="material-symbols-outlined shrink-0 text-xl">error</span>
          <span>{generalError}</span>
        </div>
      )}

      {/* Grid Container for details split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        
        {/* Left Side fields: Title & Client & Description */}
        <div className="space-y-4">
          {/* Title field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caseTitle" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Case Title / Caption *
            </label>
            <input
              id="caseTitle"
              type="text"
              placeholder="e.g. Commercial Contract Dispute"

              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) {
                  setFormErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.title;
                    return copy;
                  });
                }
              }}
              className={`bg-surface border ${
                formErrors.title ? "border-error focus:ring-error/20" : "border-outline-variant focus:border-primary"
              } rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all`}
            />
            {formErrors.title && (
              <span className="text-[11px] text-error font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {formErrors.title}
              </span>
            )}
          </div>

          {/* Searchable Client dropdown selector */}
          <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Associated Client *
            </label>
            
            {/* Display select box */}
            <div
              onClick={() => !clientsLoading && setIsDropdownOpen(!isDropdownOpen)}
              className={`bg-surface border ${
                formErrors.client_id ? "border-error" : "border-outline-variant"
              } rounded-lg px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer select-none transition-colors hover:border-outline`}
            >
              {clientsLoading ? (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Syncing client directory...</span>
                </div>
              ) : selectedClient ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary-fixed text-primary text-[10px] rounded-full flex items-center justify-center font-bold">
                    {selectedClient.full_name.charAt(0)}
                  </div>
                  <span className="text-on-surface font-semibold">{selectedClient.full_name}</span>
                  <span className="text-xs text-on-surface-variant">({selectedClient.email})</span>
                </div>
              ) : (
                <span className="text-on-surface-variant">Select case client...</span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200">
                {isDropdownOpen ? "arrow_drop_up" : "arrow_drop_down"}
              </span>
            </div>

            {/* Floating Dropdown Card */}
            {isDropdownOpen && (
              <div className="absolute top-[100%] left-0 w-full z-40 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl mt-1.5 overflow-hidden animate-scale-up">
                {/* Local search input */}
                <div className="p-3 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search clients by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs w-full focus:outline-none text-on-surface placeholder:text-on-surface-variant"
                    autoFocus
                  />
                </div>

                {/* Clients list results */}
                <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-on-surface-variant italic">
                      No matching clients found.
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="px-4 py-3 text-xs text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-bold text-[9px]">
                            {client.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface group-hover:text-primary">{client.full_name}</p>
                            <p className="text-[10px] text-on-surface-variant">{client.email}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-secondary px-2 py-0.5 rounded">
                          ID: {client.id}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {formErrors.client_id && (
              <span className="text-[11px] text-error font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {formErrors.client_id}
              </span>
            )}
          </div>

          {/* Description text area */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caseDesc" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Case Summary / Description
            </label>
            <textarea
              id="caseDesc"
              rows="4"
              placeholder="Provide a summary of the dispute, claim details, or filing notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        {/* Right Side fields: Court Details, Priority & Status */}
        <div className="space-y-4">
          {/* Court Details field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="courtDetails" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Court Details / Venue
            </label>
            <input
              id="courtDetails"
              type="text"
              placeholder="e.g. County Superior Court, Room 405"
              value={formData.court_details}
              onChange={(e) => setFormData({ ...formData, court_details: e.target.value })}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Priority dropdown select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="casePriority" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Case Priority
            </label>
            <select
              id="casePriority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>

          {/* Status dropdown select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caseStatus" className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Filing Status
            </label>
            <select
              id="caseStatus"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="Pending">Pending Approval</option>
              <option value="Ongoing">Ongoing Litigation</option>
              <option value="Won">Dispute Won / Settled</option>
              <option value="Lost">Dispute Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="pt-6 border-t border-outline-variant flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-outline-variant text-on-surface font-semibold text-xs rounded-lg hover:bg-surface-container-high transition-colors active:scale-95 duration-150 cursor-pointer"
          disabled={submitLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 active:scale-95 duration-150 cursor-pointer shadow-md"
          disabled={submitLoading}
        >
          {submitLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Registering File...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">folder_open</span>
              <span>Register Case</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}

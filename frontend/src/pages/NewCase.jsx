import { useNavigate, Link } from "react-router-dom";
import CaseForm from "../components/CaseForm";

/**
 * NewCase page provides the page context for opening case files.
 * It contains navigation headers, breadcrumbs, and embeds the CaseForm.
 */
export default function NewCase() {
  const navigate = useNavigate();

  // Redirect to cases list on successful case registration with toast notification state
  const handleSuccess = () => {
    navigate("/cases", {
      state: { successMessage: "New case file successfully registered and added to directory." }
    });
  };

  // Redirect to cases list on cancel
  const handleCancel = () => {
    navigate("/cases");
  };

  return (
    <div className="space-y-stack-lg animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
        <Link to="/cases" className="hover:text-primary transition-colors">
          Cases
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">New Case File</span>
      </nav>

      {/* Page Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 border border-outline-variant hover:bg-surface-container-high rounded-lg text-on-surface transition-colors cursor-pointer flex items-center justify-center active:scale-95 duration-100"
          title="Back to Cases"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="font-display text-display text-primary">Open Case File</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Create a new client case profile and generate court filing details.
          </p>
        </div>
      </div>

      {/* Case Register Form */}
      <CaseForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}


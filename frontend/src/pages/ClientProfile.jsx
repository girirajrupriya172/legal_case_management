import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getClientById } from "../services/clientService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";

export default function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        setLoading(true);
        const data = await getClientById(clientId);
        setClient(data);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load client profile.");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientProfile();
    }
  }, [clientId]);

  if (loading) {
    return <LoadingSpinner message="Loading client profile..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Sync Error"
        message={error}
        onRetry={() => navigate("/clients")}
        retryLabel="Return to Client Directory"
      />
    );
  }

  if (!client) {
    return (
      <ErrorMessage
        title="Client Not Found"
        message="The requested client record does not exist or has been removed."
        icon="person_off"
        onRetry={() => navigate("/clients")}
        retryLabel="Return to Client Directory"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
        <Link to="/clients" className="hover:text-primary transition-colors focus-ring rounded">
          Clients Directory
        </Link>
        <span className="material-symbols-outlined text-sm text-outline">chevron_right</span>
        <span className="text-primary font-bold">{client.full_name}</span>
      </nav>

      {/* Client Profile Header Card */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 sm:p-8 border border-outline-variant/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Profile Avatar Icon Container */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary-container flex items-center justify-center text-primary flex-shrink-0 font-extrabold text-2xl sm:text-3xl shadow-xs">
              {client.full_name?.charAt(0).toUpperCase()}
            </div>
            
            {/* Client Personal Info Details */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 rounded-full uppercase tracking-wider border border-emerald-200/60">
                  Active Client
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">{client.full_name}</h1>
              
              {/* Contact Information Details */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-base text-primary">mail</span>
                  {client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-base text-primary">call</span>
                    {client.phone}
                  </span>
                )}
                {client.address && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-base text-primary">location_on</span>
                    {client.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => navigate("/cases", { state: { openAddModal: true, preselectedClientId: client.id } })}
              className="px-4 sm:px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Case File</span>
            </button>
            <button
              onClick={() => navigate("/clients")}
              className="px-4 sm:px-5 py-2.5 border border-outline-variant/80 bg-surface-container-low text-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-surface-container-high transition-all flex items-center gap-2 focus-ring btn-press cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Back to Directory</span>
            </button>
          </div>
        </div>
      </section>

      {/* Associated Cases Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">folder_special</span>
              <span>Associated Case Files</span>
            </h2>
            <p className="text-xs text-on-surface-variant">
              Overview of active and historical matters linked to this client.
            </p>
          </div>
        </div>

        {/* Bento Grid of Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {client.cases?.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-xs flex flex-col hover:border-primary transition-all card-hover group"
            >
              <div className="flex justify-between items-start mb-3">
                <StatusBadge status={item.status} />
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  #{item.case_number}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary mb-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                  {item.description}
                </p>
              )}
              <div className="mt-auto pt-3">
                <Link
                  to={`/cases/${item.id}`}
                  className="block w-full py-2 text-center bg-surface-container-low hover:bg-secondary-container text-primary font-semibold text-xs rounded-xl transition-all focus-ring btn-press"
                >
                  View Case Details
                </Link>
              </div>
            </div>
          ))}
          {(!client.cases || client.cases.length === 0) && (
            <div className="col-span-full bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8 text-center shadow-xs">
              <span className="material-symbols-outlined text-3xl text-outline mb-2 block">folder_open</span>
              <p className="text-xs sm:text-sm font-medium text-on-surface-variant">
                No active or archived case files have been associated with this client yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline Card */}
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-xl">history</span>
          <span>Activity Timeline</span>
        </h2>
        <div className="relative pl-6 sm:pl-8 border-l-2 border-outline-variant/60 space-y-6 ml-2">
          {client.activities?.map((activity) => (
            <div key={activity.id} className="relative">
              {/* Timeline Bullet Icon */}
              <span className="absolute -left-[37px] sm:-left-[45px] top-0 bg-surface-container-lowest flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-outline-variant/80 text-primary shadow-xs">
                <span className="material-symbols-outlined text-xs sm:text-sm">
                  {activity.id?.startsWith("hearing") ? "gavel" : "task_alt"}
                </span>
              </span>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h3 className="text-xs sm:text-sm font-bold text-primary">
                    {activity.title}
                  </h3>
                  <span className="text-[11px] font-medium text-outline">
                    {new Date(activity.created_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">
                  {activity.description}
                </p>
                <StatusBadge status={activity.status} />
              </div>
            </div>
          ))}
          {(!client.activities || client.activities.length === 0) && (
            <div className="text-center py-6 text-on-surface-variant">
              <span className="material-symbols-outlined text-2xl text-outline mb-1 block">history_toggle_off</span>
              <p className="text-xs font-medium">No recent activities recorded for this client.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


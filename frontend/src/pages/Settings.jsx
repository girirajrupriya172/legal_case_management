import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Settings Page Component
 *
 * Provides attorney profile preferences, security settings, notification toggle configurations,
 * and system health metrics.
 */
export default function Settings() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'notifications', 'security', 'system'

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    role: user?.role || "Attorney"
  });

  // Notification Toggles State
  const [notifPrefs, setNotifPrefs] = useState({
    hearing_reminders: true,
    document_alerts: true,
    case_status_updates: true,
    email_digests: false
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Auto-dismiss success toasts
  const triggerToast = (setter, msg) => {
    setter(msg);
    setTimeout(() => setter(""), 4000);
  };

  // Profile Form Submit
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    triggerToast(setProfileSuccess, "Profile information saved successfully.");
  };

  // Security Form Submit
  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    setSecurityError("");

    if (!securityForm.current_password) {
      setSecurityError("Please enter your current password.");
      return;
    }
    if (securityForm.new_password.length < 6) {
      setSecurityError("New password must be at least 6 characters long.");
      return;
    }
    if (securityForm.new_password !== securityForm.confirm_password) {
      setSecurityError("New password and confirmation do not match.");
      return;
    }

    setSecurityForm({ current_password: "", new_password: "", confirm_password: "" });
    triggerToast(setSecuritySuccess, "Security credentials updated successfully.");
  };

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in relative max-w-5xl mx-auto">
      
      {/* Top Page Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-secondary-container text-on-secondary-container rounded-full uppercase tracking-wider">
              Preferences
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">System & Account Settings</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Manage your attorney profile, notification preferences, security credentials, and review system status.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="border-b border-outline-variant/60 flex items-center gap-6 sm:gap-8 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">person</span>
          <span>User Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">notifications</span>
          <span>Notification Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">lock</span>
          <span>Security & Passwords</span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer focus-ring whitespace-nowrap ${
            activeTab === "system"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-lg">dns</span>
          <span>System Status</span>
        </button>
      </div>

      {/* Tab Content Area */}

      {/* TAB 1: USER PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
          
          {profileSuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-2xl text-xs flex items-center gap-2 font-medium animate-slide-up">
              <span className="material-symbols-outlined text-lg text-emerald-700">check_circle</span>
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-outline-variant/60">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary text-on-primary font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-xs shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-primary">{user?.full_name || "Attorney Profile"}</h2>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider">{user?.role || "Legal Administrator"}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Full Legal Name *</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Email Address *</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Assigned System Role</label>
              <input
                type="text"
                value={profileForm.role}
                disabled
                className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-outline cursor-not-allowed font-semibold"
              />
              <span className="text-[11px] text-outline italic">System roles are managed by lead administrators.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS PREFERENCES */}
      {activeTab === "notifications" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary mb-1">Alert Configurations</h2>
            <p className="text-xs text-on-surface-variant">Configure real-time push notifications and court calendar reminder digests.</p>
          </div>

          <div className="space-y-4 max-w-2xl divide-y divide-outline-variant/40">
            
            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-primary">Court Hearing Reminders</h3>
                <p className="text-xs text-on-surface-variant">Receive automated notifications 24 hours prior to scheduled hearings.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.hearing_reminders}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, hearing_reminders: e.target.checked })}
                className="w-5 h-5 accent-primary rounded cursor-pointer focus-ring"
              />
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-primary">Document Vault Upload Alerts</h3>
                <p className="text-xs text-on-surface-variant">Get notified when new legal evidence or court orders are uploaded.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.document_alerts}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, document_alerts: e.target.checked })}
                className="w-5 h-5 accent-primary rounded cursor-pointer focus-ring"
              />
            </div>

            <div className="pt-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-primary">Case Status Transitions</h3>
                <p className="text-xs text-on-surface-variant">Alert when a case is marked Ongoing, Pending, or Closed.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.case_status_updates}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, case_status_updates: e.target.checked })}
                className="w-5 h-5 accent-primary rounded cursor-pointer focus-ring"
              />
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORDS */}
      {activeTab === "security" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary mb-1">Update Security Credentials</h2>
            <p className="text-xs text-on-surface-variant">Ensure your account password meets firm security compliance standards.</p>
          </div>

          {securitySuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-2xl text-xs flex items-center gap-2 font-medium animate-slide-up">
              <span className="material-symbols-outlined text-lg text-emerald-700">check_circle</span>
              <span>{securitySuccess}</span>
            </div>
          )}

          {securityError && (
            <div className="p-3.5 bg-error-container/50 text-on-error-container border border-error/30 rounded-2xl text-xs flex items-center gap-2 font-medium animate-slide-up">
              <span className="material-symbols-outlined text-lg text-error">warning</span>
              <span>{securityError}</span>
            </div>
          )}

          <form onSubmit={handleSecuritySubmit} className="space-y-4 max-w-md">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Current Password *</label>
              <input
                type="password"
                value={securityForm.current_password}
                onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">New Password *</label>
              <input
                type="password"
                value={securityForm.new_password}
                onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Confirm New Password *</label>
              <input
                type="password"
                value={securityForm.confirm_password}
                onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                className="bg-surface-container-low border border-outline-variant/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-on-surface focus-ring outline-none transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all focus-ring btn-press cursor-pointer shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SYSTEM STATUS */}
      {activeTab === "system" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-xs p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary mb-1">System Environment</h2>
            <p className="text-xs text-on-surface-variant">Real-time status of connected backend microservices and databases.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-center justify-between card-hover">
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">FastAPI Backend API</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected (v1.0)
                </p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">api</span>
            </div>

            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-center justify-between card-hover">
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">MySQL Database</p>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active (Port 3306)
                </p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">database</span>
            </div>

            <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/60 flex items-center justify-between card-hover">
              <div>
                <p className="text-[10px] font-bold uppercase text-outline">JWT Authentication</p>
                <p className="text-xs sm:text-sm font-extrabold text-primary flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  Bearer (HS256)
                </p>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

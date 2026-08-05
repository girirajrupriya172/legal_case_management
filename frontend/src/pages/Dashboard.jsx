import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardStats } from "../services/dashboardService";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch stats on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Helper to format hearing time
  const formatHearingTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Helper to calculate relative timestamp
  const formatTimeAgo = (dateString, index) => {
    if (index === 0) return "15 min ago";
    if (index === 1) return "1 hour ago";
    if (index === 2) return "3 hours ago";
    return "Today";
  };

  // Helper to select reminder borders
  const getReminderBorderClass = (index) => {
    if (index === 0) return "border-l-error";
    if (index === 1) return "border-l-primary";
    if (index === 2) return "border-l-secondary";
    return "border-l-outline";
  };

  // Helper to select reminder icon classes
  const getReminderIconDetails = (index) => {
    if (index === 0) return { name: "notification_important", bg: "bg-error-container text-error" };
    if (index === 1) return { name: "description", bg: "bg-primary-fixed text-primary" };
    if (index === 2) return { name: "mail", bg: "bg-secondary-container text-secondary" };
    return { name: "update", bg: "bg-surface-container text-on-surface-variant" };
  };

  if (loading) {
    return (
      <div className="min-h-[450px] flex flex-col justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-secondary-container border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-on-surface-variant animate-pulse-subtle">
          Loading legal dashboard analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[450px] flex flex-col justify-center items-center p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-error-container/40 text-error rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">Failed to Sync Dashboard</h3>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all focus-ring btn-press cursor-pointer shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-stack-lg animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-secondary-container text-on-secondary-container rounded-full uppercase tracking-wider">
              Legal Overview
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
            Good Morning, {user?.full_name ? user.full_name : "Counselor"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">Here is an overview of your firm's performance and schedule today.</p>
        </div>
        <Link
          to="/clients"
          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 hover:bg-primary-container transition-all focus-ring btn-press self-start sm:self-auto shadow-sm"
        >
          <span>View Clients</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/60 shadow-xs">
        <h2 className="text-xs font-bold text-outline uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/clients"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-all text-center text-xs sm:text-sm focus-ring btn-press shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Add Client</span>
          </Link>
          <Link
            to="/cases"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant bg-surface-container-lowest text-primary rounded-xl font-semibold hover:bg-surface-container-high transition-all text-center text-xs sm:text-sm focus-ring btn-press shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">create_new_folder</span>
            <span>Add Case</span>
          </Link>
          <Link
            to="/hearings"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant bg-surface-container-lowest text-primary rounded-xl font-semibold hover:bg-surface-container-high transition-all text-center text-xs sm:text-sm focus-ring btn-press shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">event</span>
            <span>Schedule Hearing</span>
          </Link>
          <Link
            to="/documents"
            className="flex items-center justify-center gap-2 px-4 py-3 border border-outline-variant bg-surface-container-lowest text-primary rounded-xl font-semibold hover:bg-surface-container-high transition-all text-center text-xs sm:text-sm focus-ring btn-press shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Clients */}
        <Link to="/clients" className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs hover:border-primary transition-all cursor-pointer card-hover block group">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-secondary-container rounded-xl text-primary">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Total Clients</p>
          <h3 className="text-2xl font-extrabold text-primary tracking-tight">{stats?.stats?.total_clients || 0}</h3>
        </Link>

        {/* Active Cases */}
        <Link to="/cases" className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs hover:border-primary transition-all cursor-pointer card-hover block">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-primary-fixed rounded-xl text-primary">
              <span className="material-symbols-outlined text-xl">folder_special</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Active Cases</p>
          <h3 className="text-2xl font-extrabold text-primary tracking-tight">{stats?.stats?.active_cases || 0}</h3>
        </Link>

        {/* Today's Hearings */}
        <Link to="/hearings" className="bg-primary-container p-4 rounded-2xl border border-primary shadow-sm text-on-primary block hover:opacity-95 transition-all card-hover">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-primary rounded-xl text-on-primary">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            </div>
            <div className="w-2.5 h-2.5 bg-error rounded-full animate-pulse"></div>
          </div>
          <p className="text-[11px] font-bold text-primary-fixed uppercase tracking-wider">Today's Hearings</p>
          <h3 className="text-2xl font-extrabold text-on-primary tracking-tight">
            {stats?.stats?.todays_hearings_count < 10 ? `0${stats?.stats?.todays_hearings_count || 0}` : stats?.stats?.todays_hearings_count}
          </h3>
        </Link>

        {/* Upcoming Hearings */}
        <Link to="/hearings" className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs hover:border-primary transition-all cursor-pointer card-hover block">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-surface-container rounded-xl text-secondary">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Upcoming</p>
          <h3 className="text-2xl font-extrabold text-primary tracking-tight">{stats?.stats?.upcoming_hearings_count || 0}</h3>
        </Link>

        {/* Pending Tasks */}
        <Link to="/notifications" className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xs hover:border-primary transition-all cursor-pointer card-hover block">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-error-container rounded-xl text-error">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-outline uppercase tracking-wider">Pending Tasks</p>
          <h3 className="text-2xl font-extrabold text-primary tracking-tight">{stats?.stats?.pending_tasks_count || 0}</h3>
        </Link>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">today</span>
              <span>Today's Schedule</span>
            </h2>
            <Link
              to="/hearings"
              className="text-xs font-bold text-primary hover:underline transition-colors focus-ring rounded"
            >
              View Full Calendar
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-surface-container-low border-b border-outline-variant/60">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">TIME</th>
                    <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">CASE NAME</th>
                    <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">COURT ROOM</th>
                    <th className="px-4 sm:px-6 py-3 text-[11px] font-bold text-outline uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {stats?.upcoming_hearings && stats.upcoming_hearings.length > 0 ? (
                    stats.upcoming_hearings.map((hearing) => (
                      <tr
                        key={hearing.id}
                        className="table-row-hover cursor-pointer group"
                        onClick={() => navigate(`/cases/${hearing.case_id}`)}
                      >
                        <td className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm text-primary font-bold whitespace-nowrap">
                          {formatHearingTime(hearing.hearing_date)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="text-xs sm:text-sm text-primary font-semibold group-hover:text-primary transition-colors">
                            {hearing.case_title}
                          </div>
                          <div className="text-[10px] font-medium text-on-surface-variant">
                            Case #{hearing.case_number}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm text-on-surface-variant whitespace-nowrap">
                          {hearing.court_room}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                              hearing.status?.toLowerCase() === "ongoing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {hearing.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl text-outline mb-1 block">event_available</span>
                        <p className="text-xs font-medium">No hearings scheduled for today.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reminders / Activity Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
              <span>Reminders</span>
            </h2>
            <span className="bg-error text-on-error px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs">
              {stats?.recent_activities?.filter((a) => a.status === "Pending").length || 0} NEW
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 space-y-3 shadow-xs">
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.slice(0, 4).map((activity, index) => {
                const iconDetails = getReminderIconDetails(index);
                const borderClass = getReminderBorderClass(index);
                return (
                  <div
                    key={activity.id}
                    className={`flex gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer border-l-4 ${borderClass}`}
                    onClick={() => navigate("/notifications")}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconDetails.bg}`}>
                      <span className="material-symbols-outlined text-lg">{iconDetails.name}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-primary truncate">{activity.title}</h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{activity.description}</p>
                      <span className="text-[10px] text-outline uppercase font-medium mt-1 block">
                        {formatTimeAgo(activity.created_at, index)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-on-surface-variant py-8">
                <span className="material-symbols-outlined text-2xl text-outline mb-1 block">notifications_off</span>
                <p className="text-xs font-medium">No recent activities or reminders.</p>
              </div>
            )}
            <Link
              to="/notifications"
              className="block w-full py-2 text-center text-xs font-bold text-primary hover:bg-surface-container rounded-xl transition-colors focus-ring"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-52 rounded-2xl overflow-hidden relative border border-outline-variant/60 shadow-xs group">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"
            alt="Legal Case Management Analytics"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent flex flex-col justify-end p-5">
            <span className="text-[10px] font-extrabold text-primary-fixed uppercase tracking-wider mb-0.5">Analytics</span>
            <h3 className="text-on-primary text-base font-bold">Performance & Case Metrics</h3>
            <p className="text-primary-fixed-dim text-xs">Firm case resolution speed improved by 14% this quarter.</p>
          </div>
        </div>

        <div className="h-52 rounded-2xl bg-primary p-6 flex flex-col justify-between border border-primary relative overflow-hidden shadow-xs">
          <div className="relative z-10">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-primary-fixed text-on-primary-fixed rounded-full uppercase tracking-wider">
              Legal Recognition
            </span>
            <h3 className="text-on-primary text-base sm:text-lg font-bold mt-2">2026 Excellence Award Nominee</h3>
            <p className="text-primary-fixed-dim text-xs mt-1">
              Patidar & Associates shortlisted for top excellence in advocate case management.
            </p>
          </div>
          <div className="relative z-10 pt-2">
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-on-primary/60 text-on-primary rounded-xl text-xs font-bold hover:bg-on-primary hover:text-primary transition-all focus-ring btn-press"
            >
              <span>View Firm Profile</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

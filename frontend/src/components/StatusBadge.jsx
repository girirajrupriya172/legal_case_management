import { memo } from "react";

/**
 * Color and styling mapping dictionary for various case, hearing, and client statuses.
 */
const STATUS_STYLES = {
  // Case & Hearing Statuses
  ongoing: "bg-blue-100 text-blue-800 border-blue-200/60",
  pending: "bg-amber-100 text-amber-800 border-amber-200/60",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200/60",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200/60",
  won: "bg-emerald-100 text-emerald-800 border-emerald-200/60",
  lost: "bg-rose-100 text-rose-800 border-rose-200/60",
  adjourned: "bg-purple-100 text-purple-800 border-purple-200/60",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200/60",
  
  // Default Fallback Style
  default: "bg-surface-container-high text-on-surface-variant border-outline-variant/60",
};

/**
 * Reusable StatusBadge component.
 * Encapsulates status color formatting into a single memoized UI element.
 * 
 * @param {Object} props
 * @param {string} props.status - Status text (e.g., 'Ongoing', 'Pending', 'Completed', 'Won', 'Lost')
 * @param {string} [props.className] - Optional extra CSS classes
 */
const StatusBadge = memo(({ status, className = "" }) => {
  if (!status) return null;

  const normalizedStatus = status.trim().toLowerCase();
  const styleClass = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${styleClass} ${className}`}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;

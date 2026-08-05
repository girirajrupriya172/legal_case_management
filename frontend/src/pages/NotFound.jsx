import { Link } from "react-router-dom";

/**
 * NotFound (404) Page Component
 *
 * Displayed when the user navigates to a URL that does not match any defined route.
 * Provides a clear visual message and a navigation path back to the Dashboard.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center animate-fade-in space-y-6">

        {/* Large 404 Visual Indicator */}
        <div className="relative inline-block">
          <span className="text-[140px] font-display font-black text-primary/10 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              explore_off
            </span>
          </div>
        </div>

        {/* Error Heading */}
        <div>
          <h1 className="font-display text-3xl text-primary font-bold mb-2">
            Page Not Found
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto">
            The legal resource you are looking for does not exist, has been moved, or is restricted from your access level.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Return to Dashboard
          </Link>
          <Link
            to="/cases"
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant text-primary font-bold text-sm rounded-xl hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Browse Cases
          </Link>
        </div>

        {/* Subtle Help Text */}
        <p className="text-[11px] text-on-surface-variant/60 pt-4">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}

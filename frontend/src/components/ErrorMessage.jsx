import { memo } from "react";

/**
 * Reusable ErrorMessage component.
 * Encapsulates error banners and fallback error state UI into a single memoized element.
 * 
 * @param {Object} props
 * @param {string} [props.title="Error Occurred"] - Main error heading title
 * @param {string} props.message - Detailed error message description
 * @param {Function} [props.onRetry] - Optional callback function to retry action
 * @param {string} [props.retryLabel="Retry Action"] - Text for retry button
 * @param {string} [props.icon="error"] - Material symbol icon name
 * @param {string} [props.minHeight="min-h-[450px]"] - Container minimum height class
 * @param {string} [props.className=""] - Optional additional CSS class names
 */
const ErrorMessage = memo(({
  title = "Error Occurred",
  message,
  onRetry,
  retryLabel = "Retry Action",
  icon = "error",
  minHeight = "min-h-[450px]",
  className = ""
}) => {
  return (
    <div className={`${minHeight} flex flex-col justify-center items-center p-6 text-center animate-fade-in ${className}`}>
      <div className="w-16 h-16 bg-error-container/40 text-error rounded-full flex items-center justify-center mb-4 shadow-xs">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all focus-ring btn-press cursor-pointer shadow-xs text-xs sm:text-sm"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
});

ErrorMessage.displayName = "ErrorMessage";

export default ErrorMessage;

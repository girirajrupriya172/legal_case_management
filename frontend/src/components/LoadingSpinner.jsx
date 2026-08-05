import { memo } from "react";

/**
 * Reusable LoadingSpinner component.
 * Encapsulates full-screen or container loading state UI into a single memoized element.
 * 
 * @param {Object} props
 * @param {string} [props.message="Loading data..."] - Customizable loading text label
 * @param {string} [props.minHeight="min-h-[450px]"] - Container minimum height class
 * @param {string} [props.className=""] - Optional additional CSS class names
 */
const LoadingSpinner = memo(({ 
  message = "Loading data...", 
  minHeight = "min-h-[450px]",
  className = "" 
}) => {
  return (
    <div className={`${minHeight} flex flex-col justify-center items-center py-12 ${className}`}>
      <div className="w-12 h-12 border-4 border-secondary-container border-t-primary rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-on-surface-variant animate-pulse">
        {message}
      </p>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;

import React from 'react';

const Pagination = ({
  page = 1,
  limit = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 25, 50]
}) => {
  // Calculate display ranges (e.g., Showing 11 to 20 of 45 entries)
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate dynamic page number sequence with ellipsis for clean UI
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 1);
      let end = Math.min(totalPages, page + 1);

      if (page <= 2) {
        start = 1;
        end = 3;
      } else if (page >= totalPages - 1) {
        start = totalPages - 2;
        end = totalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-surface-container-low border-t border-outline-variant/60 text-xs text-on-surface-variant font-medium rounded-b-2xl select-none"
    >
      {/* Left side: Results counter & rows-per-page selector */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
        <span className="text-on-surface-variant text-center sm:text-left">
          Showing <strong className="text-on-surface font-bold">{startItem}</strong> to{' '}
          <strong className="text-on-surface font-bold">{endItem}</strong> of{' '}
          <strong className="text-on-surface font-bold">{total}</strong> records
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="text-xs text-on-surface-variant font-normal">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Records per page"
              className="px-2 py-1 bg-surface-container-lowest border border-outline-variant/80 rounded-lg text-xs font-semibold text-on-surface focus-ring outline-none cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Interactive navigation buttons */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="First Page"
          aria-label="Go to first page"
          className="p-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:cursor-not-allowed transition-all text-on-surface flex items-center justify-center focus-ring btn-press cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-lg">first_page</span>
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous Page"
          aria-label="Go to previous page"
          className="p-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:cursor-not-allowed transition-all text-on-surface flex items-center justify-center focus-ring btn-press cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => (
            <React.Fragment key={idx}>
              {p === '...' ? (
                <span className="px-2 py-1 text-on-surface-variant select-none text-xs">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Go to page ${p}`}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all focus-ring btn-press cursor-pointer ${
                    p === page
                      ? 'bg-primary text-on-primary shadow-sm scale-105'
                      : 'border border-outline-variant/80 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface shadow-xs'
                  }`}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next Page"
          aria-label="Go to next page"
          className="p-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:cursor-not-allowed transition-all text-on-surface flex items-center justify-center focus-ring btn-press cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Last Page"
          aria-label="Go to last page"
          className="p-1.5 rounded-lg border border-outline-variant/80 bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:cursor-not-allowed transition-all text-on-surface flex items-center justify-center focus-ring btn-press cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-lg">last_page</span>
        </button>
      </div>
    </nav>
  );
};

export default Pagination;

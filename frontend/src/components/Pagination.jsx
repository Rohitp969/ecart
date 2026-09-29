import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 1 … 4 5 6 … 12
const pageNumbers = (page, total) => {
  const pages = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ["…", p] : [p]));
};

const Pagination = ({ page, totalPages, onChange, className = "" }) => {
  if (totalPages <= 1) return null;
  // phones: 36px buttons and icon-only Prev/Next so the whole row fits on one line
  const buttonClass =
    "flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:px-3";
  return (
    <nav className={`flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 ${className}`} aria-label="Pagination">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page" className={buttonClass}>
        <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
      </button>
      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`h-9 min-w-9 cursor-pointer rounded-lg border px-2 text-sm font-semibold sm:h-10 sm:min-w-10 sm:px-3 ${
              p === page ? "border-pink-600 bg-pink-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Next page" className={buttonClass}>
        <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};

export default Pagination;

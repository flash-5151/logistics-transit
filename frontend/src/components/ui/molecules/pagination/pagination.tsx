import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { PaginationProps } from "./pagination.types";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
};

export const getPaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "...")[] => {
  const totalPageNumbers = siblingCount * 2 + 5;
  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 2;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(1, leftItemCount), "...", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [1, "...", ...range(totalPages - rightItemCount + 1, totalPages)];
  }

  return [
    1,
    "...",
    ...range(leftSiblingIndex, rightSiblingIndex),
    "...",
    totalPages,
  ];
};

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      className,
      ...props
    },
    ref
  ) => {
    const items = getPaginationItems(currentPage, totalPages, siblingCount);

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn("flex items-center justify-center gap-2", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => {
            if (currentPage > 1) onPageChange(currentPage - 1);
          }}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-border/20 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </button>

        {items.map((item, index) => {
          if (item === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="flex size-9 items-center justify-center text-muted-foreground"
              >
                <MoreHorizontal className="size-4" />
              </span>
            );
          }

          const pageNumber = item;
          const isCurrent = pageNumber === currentPage;

          return (
            <button
              key={`${pageNumber}-${index}`}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`Page ${pageNumber}`}
              className={cn(
                "flex size-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-border/20"
              )}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            if (currentPage < totalPages) onPageChange(currentPage + 1);
          }}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-border/20 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    );
  }
);

Pagination.displayName = "Pagination";

export { Pagination };

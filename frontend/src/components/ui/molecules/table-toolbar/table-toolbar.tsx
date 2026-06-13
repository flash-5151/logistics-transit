import * as React from "react";
import { cn } from "../../../../lib/utils";
import type { TableToolbarProps } from "./table-toolbar.types";

const TableToolbar = React.forwardRef<HTMLDivElement, TableToolbarProps>(
  ({ slots, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Table actions toolbar"
        className={cn(
          "flex w-full items-center justify-between gap-4",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-4">
          {slots?.search}
          {slots?.filters}
        </div>

        <div className="flex items-center justify-end gap-4">
          {slots?.bulkActions}
          {slots?.actions}
        </div>
      </div>
    );
  }
);

TableToolbar.displayName = "TableToolbar";

export { TableToolbar };

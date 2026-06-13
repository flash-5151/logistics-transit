import * as React from "react";

export interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  slots?: {
    search?: React.ReactNode;
    filters?: React.ReactNode;
    bulkActions?: React.ReactNode;
    actions?: React.ReactNode;
  };
}

import * as React from "react";

export interface UserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  menu?: React.ReactNode;
}

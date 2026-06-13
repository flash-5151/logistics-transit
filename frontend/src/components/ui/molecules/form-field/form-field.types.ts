import * as React from "react";

export interface FormFieldProps {
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

import * as React from "react";
import { cn } from "../../../../lib/utils";
import type { FormFieldProps } from "./form-field.types";

const FormField = ({
  children,
  label,
  helperText,
  error,
  required = false,
  className,
}: FormFieldProps) => {
  const generatedId = React.useId();
  const childId = children.props.id || generatedId;
  const errorId = `${childId}-error`;
  const descriptionId = `${childId}-description`;

  let describedBy = children.props["aria-describedby"] || "";
  if (error) {
    describedBy = `${describedBy} ${errorId}`.trim();
  } else if (helperText) {
    describedBy = `${describedBy} ${descriptionId}`.trim();
  }

  const enhancedChild = React.cloneElement(children, {
    id: childId,
    "aria-invalid": error ? true : children.props["aria-invalid"],
    "aria-describedby": describedBy || undefined,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={childId}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && (
            <span className="ml-1 text-primary" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {enhancedChild}

      {error ? (
        <p id={errorId} className="text-xs text-danger font-medium" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

FormField.displayName = "FormField";

export { FormField };

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "../../atoms/Input";
import type { SearchInputProps } from "./search-input.types";

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== "";
    const showClearButton = !!(hasValue && onClear && !props.disabled && !props.readOnly);

    const clearButton = showClearButton ? (
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear search"
        className="rounded-md hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-colors"
      >
        <X className="size-5" />
      </button>
    ) : undefined;

    return (
      <Input
        type="search"
        ref={ref}
        value={value}
        leftIcon={<Search className="size-5" />}
        rightIcon={clearButton}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };

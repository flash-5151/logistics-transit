import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Reusable utility to merge Tailwind classes cleanly.
 * This ensures no CSS conflicts when building atomic components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

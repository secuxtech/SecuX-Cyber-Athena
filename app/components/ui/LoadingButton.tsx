"use client";

import React from "react";

interface LoadingButtonProps {
  /** Button content when not loading */
  children: React.ReactNode;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Bootstrap button variant */
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  /** Button size */
  size?: "sm" | "lg";
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Loading text to show instead of children when loading */
  loadingText?: string;
}

/**
 * Button component with loading state
 *
 * Automatically shows a spinner and disables the button when loading.
 * Prevents double-clicks and provides visual feedback during async operations.
 */
export default function LoadingButton({
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  size,
  type = "button",
  onClick,
  className = "",
  style,
  loadingText,
}: LoadingButtonProps) {
  const buttonClasses = [
    "btn",
    `btn-${variant}`,
    size && `btn-${size}`,
    className,
  ].filter(Boolean).join(" ");

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={onClick}
      style={style}
    >
      {loading && (
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
"use client";

import React from "react";

interface LoadingSpinnerProps {
  /** Size of the spinner: "sm", "md", or "lg" */
  size?: "sm" | "md" | "lg";
  /** Color variant following Bootstrap conventions */
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  /** Optional text to display alongside the spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable loading spinner component
 *
 * Provides consistent loading indicators across the application.
 * Supports different sizes and color variants to match Bootstrap themes.
 */
export default function LoadingSpinner({
  size = "md",
  variant = "secondary",
  text,
  className = "",
}: LoadingSpinnerProps) {
  // Define size styles based on the size prop
  const sizeStyles = {
    sm: { width: "1.5rem", height: "1.5rem" },
    md: { width: "3rem", height: "3rem" },
    lg: { width: "4rem", height: "4rem" },
  };

  const spinnerClasses = [
    "spinner-border",
    `text-${variant}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className="d-flex justify-content-center align-items-center">
      <div
        className={spinnerClasses}
        style={sizeStyles[size]}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <span className="ms-2 text-muted">{text}</span>
      )}
    </div>
  );
}
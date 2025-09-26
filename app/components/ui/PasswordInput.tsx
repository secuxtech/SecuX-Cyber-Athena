"use client";

import React from "react";

interface PasswordInputProps {
  /** Current password value */
  value: string;
  /** Input change handler */
  onChange: (value: string) => void;
  /** Whether to show password in plain text */
  showPassword?: boolean;
  /** Toggle visibility handler */
  onToggleVisibility?: () => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Input name attribute */
  name?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Additional CSS classes for the input */
  className?: string;
  /** Validation error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Key press handler */
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Password input component with toggle visibility
 *
 * Provides a consistent password input interface with optional
 * show/hide functionality and validation feedback.
 */
export default function PasswordInput({
  value,
  onChange,
  showPassword = false,
  onToggleVisibility,
  placeholder = "Enter password",
  disabled = false,
  required = false,
  name,
  autoComplete = "new-password",
  className = "",
  error,
  success,
  onKeyPress,
}: PasswordInputProps) {
  const inputClasses = [
    "form-control",
    error && "is-invalid",
    success && "is-valid",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className="position-relative">
      <input
        type={showPassword ? "text" : "password"}
        className={inputClasses}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        autoComplete={autoComplete}
        onKeyPress={onKeyPress}
      />

      {onToggleVisibility && (
        <button
          type="button"
          className="btn btn-outline-secondary position-absolute end-0 top-0 h-100"
          style={{ borderLeft: "none" }}
          onClick={onToggleVisibility}
          disabled={disabled}
          tabIndex={-1}
        >
          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
        </button>
      )}

      {error && (
        <div className="invalid-feedback">
          {error}
        </div>
      )}

      {success && (
        <div className="valid-feedback">
          {success}
        </div>
      )}
    </div>
  );
}
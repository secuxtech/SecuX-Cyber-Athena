/**
 * Form Validation Utilities
 *
 * Centralized validation functions used across components.
 * Provides consistent validation logic and error messages.
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates passphrase strength for wallet security
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 *
 * These requirements balance security with usability for enterprise wallet usage.
 */
export function validatePassphrase(passphrase: string): ValidationResult {
  if (!passphrase) {
    return { isValid: false, message: "Passphrase is required" };
  }

  if (passphrase.length < 8) {
    return { isValid: false, message: "Passphrase must be at least 8 characters long" };
  }

  if (!/[A-Z]/.test(passphrase)) {
    return { isValid: false, message: "Passphrase must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(passphrase)) {
    return { isValid: false, message: "Passphrase must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(passphrase)) {
    return { isValid: false, message: "Passphrase must contain at least one number" };
  }

  return { isValid: true, message: "Valid passphrase" };
}

/**
 * Validates passphrase confirmation matches the original
 *
 * Ensures user has correctly entered their intended passphrase
 * to prevent wallet lockouts due to typos.
 */
export function validatePassphraseMatch(
  passphrase: string,
  confirmPassphrase: string,
): ValidationResult {
  if (!confirmPassphrase) {
    return { isValid: false, message: "Please confirm your passphrase" };
  }

  if (passphrase !== confirmPassphrase) {
    return { isValid: false, message: "Passphrases do not match" };
  }

  return { isValid: true, message: "Passphrases match" };
}

/**
 * Validates email format using a simple but effective regex
 *
 * Pattern covers most common email formats while avoiding
 * overly complex regex that could cause performance issues.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "Valid email address" };
}

/**
 * Validates account ID format
 *
 * Account IDs must be at least 3 characters and contain only
 * alphanumeric characters and common symbols for security.
 */
export function validateAccountId(accountId: string): ValidationResult {
  if (!accountId) {
    return { isValid: false, message: "Account ID is required" };
  }

  const trimmed = accountId.trim();

  if (trimmed.length < 3) {
    return { isValid: false, message: "Account ID must be at least 3 characters long" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, message: "Account ID must be less than 50 characters" };
  }

  // Allow alphanumeric, hyphen, underscore, and dot
  const accountIdRegex = /^[a-zA-Z0-9._-]+$/;

  if (!accountIdRegex.test(trimmed)) {
    return { isValid: false, message: "Account ID can only contain letters, numbers, dots, hyphens, and underscores" };
  }

  return { isValid: true, message: "Valid account ID" };
}

/**
 * Validates URL format, typically used for HSM vault URLs
 *
 * Ensures URLs are properly formatted and use secure protocols
 * when possible for production environments.
 */
export function validateUrl(url: string, requireHttps = false): ValidationResult {
  if (!url) {
    return { isValid: false, message: "URL is required" };
  }

  try {
    const parsedUrl = new URL(url);

    if (requireHttps && parsedUrl.protocol !== "https:") {
      return { isValid: false, message: "URL must use HTTPS for security" };
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { isValid: false, message: "URL must use HTTP or HTTPS protocol" };
    }

    return { isValid: true, message: "Valid URL" };
  } catch {
    return { isValid: false, message: "Please enter a valid URL" };
  }
}

/**
 * Validates Bitcoin amounts
 *
 * Ensures amounts are positive numbers within reasonable bounds
 * for Bitcoin transactions (considering both mainnet and testnet).
 */
export function validateBitcoinAmount(amount: string): ValidationResult {
  if (!amount) {
    return { isValid: false, message: "Amount is required" };
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { isValid: false, message: "Amount must be a valid number" };
  }

  if (numAmount <= 0) {
    return { isValid: false, message: "Amount must be greater than 0" };
  }

  if (numAmount > 21_000_000) {
    return { isValid: false, message: "Amount cannot exceed 21 million BTC" };
  }

  // Check for reasonable decimal precision (8 decimal places max for BTC)
  const decimalPlaces = (amount.split(".")[1] || "").length;
  if (decimalPlaces > 8) {
    return { isValid: false, message: "Amount cannot have more than 8 decimal places" };
  }

  return { isValid: true, message: "Valid Bitcoin amount" };
}

/**
 * Generic required field validator
 *
 * Simple utility for checking if a field has been filled out.
 */
export function validateRequired(value: string, fieldName = "Field"): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true, message: `Valid ${fieldName.toLowerCase()}` };
}

/**
 * Validates minimum length requirement
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName = "Field",
): ValidationResult {
  if (!value) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters long`,
    };
  }

  return { isValid: true, message: `Valid ${fieldName.toLowerCase()}` };
}

/**
 * Validates maximum length requirement
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName = "Field",
): ValidationResult {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must be less than ${maxLength} characters`,
    };
  }

  return { isValid: true, message: `Valid ${fieldName.toLowerCase()}` };
}
/**
 * Input Validation Module - Zod-based API input validation
 * Prevents injection attacks, validates formats, enforces length limits
 */

import { z } from "zod";

// ============================================================================
// Common Validation Schemas
// ============================================================================

// Account ID: 3-50 chars, alphanumeric with hyphens/underscores
export const AccountIdSchema = z
  .string()
  .min(3, "Account ID must be at least 3 characters")
  .max(50, "Account ID must not exceed 50 characters")
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9\-_]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/)
  .transform(val => val.trim());

// Bitcoin transaction amount: max 8 decimal places, within total supply
export const TransactionAmountSchema = z
  .number()
  .positive("Amount must be positive")
  .max(21000000, "Amount exceeds Bitcoin total supply")
  .refine(
    (val) => {
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 8;
    },
    "Amount cannot have more than 8 decimal places",
  );

// Bitcoin address validation: supports Legacy (1...), SegWit (3...), and Bech32 (bc1/tb1/bcrt1...)
export const BitcoinAddressSchema = z
  .string()
  .min(26, "Bitcoin address too short")
  .max(90, "Bitcoin address too long") // Increased max length for testnet addresses
  .refine(
    (address) => {
      // Legacy (P2PKH): starts with 1
      if (address.startsWith("1")) return /^[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      // SegWit (P2SH): starts with 3
      if (address.startsWith("3")) return /^[3][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      // Bech32 Mainnet (P2WPKH/P2WSH): starts with bc1
      if (address.startsWith("bc1")) return /^bc1[a-zA-Z0-9]{25,87}$/.test(address);
      // Bech32 Testnet (P2WPKH/P2WSH): starts with tb1
      if (address.startsWith("tb1")) return /^tb1[a-zA-Z0-9]{25,87}$/.test(address);
      // Bech32 Regtest (P2WPKH/P2WSH): starts with bcrt1
      if (address.startsWith("bcrt1")) return /^bcrt1[a-zA-Z0-9]{25,87}$/.test(address);
      return false;
    },
    "Invalid Bitcoin address format",
  );

// Password strength: min 8 chars, requires upper/lower/number
export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Email format validation with length limit
export const EmailSchema = z
  .string()
  .email("Invalid email format")
  .max(254, "Email address too long");

// ============================================================================
// Validation Helper Functions
// ============================================================================

// Parse and validate JSON request body with Zod schema
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Validate URL search parameters
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): T {
  try {
    const params: Record<string, any> = {};
    for (const [key, value] of searchParams.entries()) {
      // Convert numeric strings to numbers if they look like numbers
      if (/^\d+(\.\d+)?$/.test(value)) {
        params[key] = parseFloat(value);
      } else {
        params[key] = value;
      }
    }
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error("Invalid URL parameters");
  }
}

/**
 * Validate path parameters (like /api/user/[id])
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>,
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error("Invalid path parameters");
  }
}

// ============================================================================
// Common API Parameter Schemas
// ============================================================================

/**
 * Standard path parameter validation for accountId
 */
export const PathAccountIdSchema = z.object({
  accountId: AccountIdSchema,
});

/**
 * Standard query parameter validation for accountId
 */
export const QueryAccountIdSchema = z.object({
  accountId: AccountIdSchema,
});

/**
 * Transaction ID validation for path parameters
 */
export const TransactionIdSchema = z
  .string()
  .min(1, "Transaction ID is required")
  .max(100, "Transaction ID too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid transaction ID format");

/**
 * Standard path parameter validation for transaction ID
 */
export const PathTransactionIdSchema = z.object({
  id: TransactionIdSchema,
});

/**
 * Multiple path parameters validation (transaction + initiator)
 */
export const PathTransactionInitiatorSchema = z.object({
  id: TransactionIdSchema,
  initiatorId: AccountIdSchema,
});

// ============================================================================
// Convenience Validation Functions
// ============================================================================

/**
 * Quick validation for accountId from URL search params
 */
export function validateAccountIdFromQuery(searchParams: URLSearchParams): string {
  const result = validateSearchParams(searchParams, QueryAccountIdSchema);
  return result.accountId;
}

/**
 * Quick validation for accountId from path (last segment)
 */
export function validateAccountIdFromPath(url: string): string {
  const pathSegments = url.split("/");
  const accountId = pathSegments[pathSegments.length - 1];
  return AccountIdSchema.parse(accountId);
}

/**
 * Quick validation for transaction ID from path parameters
 */
export function validateTransactionIdFromPath(params: { id: string }): string {
  const result = validatePathParams(params, PathTransactionIdSchema);
  return result.id;
}

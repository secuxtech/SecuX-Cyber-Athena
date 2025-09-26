/**
 * Application Constants and Configuration
 *
 * This module centralizes all magic numbers, timeouts, limits, and other
 * configuration values used throughout the application to improve maintainability
 * and make configuration changes easier.
 */

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

export const LIMITS = {
  ACCOUNT_ID: { MIN: 1, MAX: 100 },
  WALLET_ID: { MIN: 1, MAX: 100 },
  SERVICE_NAME: { MIN: 1, MAX: 100 },
  OPERATION_NAME: { MIN: 1, MAX: 50 },
  ASSET_NAME: { MIN: 1, MAX: 10 },
  WALLET_NAME: { MIN: 1, MAX: 100 },
  TRANSACTION_ID: { MIN: 1, MAX: 200 },
  RECIPIENT_ADDRESS: { MIN: 1, MAX: 100 },
  MULTISIG_COUNT: { MIN: 1, MAX: 10 },
  REQUIRED_SIGNATURES: { MIN: 1, MAX: 10 },
  APPROVAL_COUNT: { MIN: 0, MAX: 10 },
  BTC_FEE_RATE: { MIN: 1, MAX: 100000 },
  PAGE_NUMBER: { MIN: 1 },
} as const;

// ============================================================================
// TIMEOUTS
// ============================================================================

export const TIMEOUT = {
  FIDO_REGISTER: 60000,          // 1 minute
  FIDO_AUTH: 60000,              // 1 minute
  CHALLENGE: 60000,              // 1 minute
  HSM_OP: 30000,                 // 30 seconds
  JWT_TOKEN: "1h",               // 1 hour
} as const;

// ============================================================================
// RATE LIMITS
// ============================================================================

export const RATE = {
  WINDOW: 60000,                 // 1 minute
  GENERAL: 60,                   // 60 requests/min
  STRICT: 20,                    // 20 requests/min
} as const;


// ============================================================================
// CRYPTO
// ============================================================================

export const CRYPTO = {
  BTC_MIN_AMOUNT: 0.000003,      // Minimum BTC amount
  DEFAULT_FEE_RATE: 1000,        // Default fee rate
  BTC_RPC_URL: "https://bitcoin-rpc.publicnode.com",
  BTC_BOOK_URL: "https://btc1.trezor.io",
} as const;

// ============================================================================
// HSM
// ============================================================================

export const HSM = {
  DEFAULT_PORT: "3001",
  OP_TIMEOUT: 30000,             // 30 seconds
  FAUCET_URL: "http://pufhsm2.itracxing.xyz:9000/faucet",
} as const;

// ============================================================================
// DATABASE
// ============================================================================

export const DB = {
  ENCRYPTION_KEY_BYTES: 32,      // 256-bit encryption
  JWT_SECRET_MIN_LENGTH: 32,     // JWT secret length
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// ERROR CODES AND MESSAGES
// ============================================================================

export const ERROR_CODES = {
  // Authentication errors
  INVALID_ACCOUNT_ID: "INVALID_ACCOUNT_ID",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ALREADY_REGISTERED: "ALREADY_REGISTERED",
  CHALLENGE_EXPIRED: "CHALLENGE_EXPIRED",
  CREDENTIAL_NOT_FOUND: "CREDENTIAL_NOT_FOUND",
  AUTH_VERIFICATION_FAILED: "AUTH_VERIFICATION_FAILED",

  // Transaction errors
  INVALID_TRANSACTION_ID: "INVALID_TRANSACTION_ID",
  PARTICIPANT_NOT_FOUND: "PARTICIPANT_NOT_FOUND",
  MULTISIG_NOT_FOUND: "MULTISIG_NOT_FOUND",
  INSUFFICIENT_AMOUNT: "INSUFFICIENT_AMOUNT",

  // HSM errors
  HSM_TIMEOUT: "HSM_TIMEOUT",
  HSM_SIGN_TIMEOUT: "HSM_SIGN_TIMEOUT",
  HSM_CONNECTION_ERROR: "HSM_CONNECTION_ERROR",

  // Validation errors
  INVALID_ACTION: "INVALID_ACTION",
  MISSING_RECIPIENT: "MISSING_RECIPIENT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

// ============================================================================
// TYPE EXPORTS FOR BETTER TYPE SAFETY
// ============================================================================

export type Limits = typeof LIMITS;
export type Timeouts = typeof TIMEOUT;
export type RateSettings = typeof RATE;
export type CryptoSettings = typeof CRYPTO;
export type HSMConfig = typeof HSM;
export type DatabaseConfig = typeof DB;
export type HTTPStatusCodes = typeof HTTP_STATUS;
export type ErrorCodes = typeof ERROR_CODES;
/**
 * Environment variable validation with security checks
 * Ensures all critical security configurations are properly set
 */

import { CRYPTO, HSM, DB } from "@/config";

export interface SecurityConfig {
  jwtSecret: string;
  rpName: string;
  rpId: string;
  origin: string;
  databaseUrl: string;
  btcRpcUrl: string;
  btcBookUrl: string;
  hsmVaultPort: string;
  databaseEncryptionKey: string;
}

/**
 * Validates JWT secret strength
 * Requirements: minimum 32 characters, contains letters and numbers
 */
function validateJwtSecret(secret: string): void {
  if (secret.length < DB.JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${DB.JWT_SECRET_MIN_LENGTH} characters long for security. ` +
      "Generate a strong secret using: openssl rand -base64 32",
    );
  }

  if (!/[A-Za-z]/.test(secret) || !/[0-9]/.test(secret)) {
    throw new Error(
      "JWT_SECRET should contain both letters and numbers for better security",
    );
  }
}

/**
 * Validates database encryption key
 * Requirements: exactly 32 bytes (256-bit) encoded as base64
 */
function validateDatabaseEncryptionKey(key: string): void {
  try {
    const keyBuffer = Buffer.from(key, "base64");
    if (keyBuffer.length !== DB.ENCRYPTION_KEY_BYTES) {
      throw new Error(
        `DATABASE_ENCRYPTION_KEY must be exactly ${DB.ENCRYPTION_KEY_BYTES} bytes (256-bit) encoded as base64. ` +
        "Generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_ENCRYPTION_KEY")) {
      throw error;
    }
    throw new Error(
      "DATABASE_ENCRYPTION_KEY must be valid base64 encoded string. " +
      "Generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
}

/**
 * Validates FIDO2 Relying Party configuration
 */
function validateFidoConfig(rpId: string, origin: string): void {
  // RP_ID should not be localhost in production
  if (process.env.NODE_ENV === "production" && rpId === "localhost") {
    throw new Error(
      "RP_ID cannot be 'localhost' in production environment. " +
      "Set it to your actual domain name.",
    );
  }

  // Origin should use HTTPS in production
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) {
    throw new Error(
      "ORIGIN must use HTTPS in production environment for FIDO2 security",
    );
  }

  // RP_ID should match origin domain
  try {
    const originUrl = new URL(origin);
    if (rpId !== originUrl.hostname && rpId !== "localhost") {
      console.warn(
        `Warning: RP_ID (${rpId}) should typically match origin hostname (${originUrl.hostname})`,
      );
    }
  } catch {
    throw new Error(`Invalid ORIGIN URL format: ${origin}`);
  }
}

/**
 * Validates and returns all security configuration
 * Throws descriptive errors for missing or invalid configurations
 */
export function validateSecurityConfig(): SecurityConfig {
  const requiredEnvVars = [
    "JWT_SECRET",
    "RP_NAME",
    "RP_ID",
    "ORIGIN",
    "DATABASE_URL",
    "DATABASE_ENCRYPTION_KEY",
  ];

  // Check for missing required environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. ` +
      "Please check your .env file and ensure all required variables are set.",
    );
  }

  const jwtSecret = process.env.JWT_SECRET!;
  const rpName = process.env.RP_NAME!;
  const rpId = process.env.RP_ID!;
  const origin = process.env.ORIGIN!;
  const databaseUrl = process.env.DATABASE_URL!;
  const databaseEncryptionKey = process.env.DATABASE_ENCRYPTION_KEY!;

  // Validate JWT secret strength
  validateJwtSecret(jwtSecret);

  // Validate database encryption key
  validateDatabaseEncryptionKey(databaseEncryptionKey);

  // Validate FIDO2 configuration
  validateFidoConfig(rpId, origin);

  // Validate database URL format
  if (!databaseUrl.startsWith("postgresql://")) {
    throw new Error(
      "DATABASE_URL must be a valid PostgreSQL connection string starting with 'postgresql://'",
    );
  }

  return {
    jwtSecret,
    rpName,
    rpId,
    origin,
    databaseUrl,
    databaseEncryptionKey,
    btcRpcUrl: process.env.BTC_RPC_URL || CRYPTO.BTC_RPC_URL,
    btcBookUrl: process.env.BTC_BOOK_URL || CRYPTO.BTC_BOOK_URL,
    hsmVaultPort: process.env.HSM_VAULT_PORT || HSM.DEFAULT_PORT,
  };
}

/**
 * Cached security configuration
 * Validates once on first access for performance
 */
let securityConfig: SecurityConfig | null = null;

export function getSecurityConfig(): SecurityConfig {
  if (!securityConfig) {
    securityConfig = validateSecurityConfig();
  }
  return securityConfig;
}

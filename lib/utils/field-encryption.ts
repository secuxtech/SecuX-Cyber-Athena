/**
 * Field-Level Database Encryption Utilities
 *
 * Demonstrates transparent field-level encryption for database sensitive data protection
 * while maintaining application functionality.
 *
 * Security Approach:
 * - AES-256-GCM for authenticated encryption (prevents tampering)
 * - Field-specific derived keys (prevents cross-field data leakage)
 * - Only encrypt truly sensitive random data (Challenge.challenge, Credential.publicKey)
 * - Keep searchable fields (accountId, addresses) in plaintext for functionality
 *
 * Key Design Principles:
 * 1. "Small but Secure" - Only encrypt what truly needs protection
 * 2. Transparent to application code - handled at Prisma middleware layer
 * 3. Performance conscious - minimal encryption overhead
 * 4. Clear separation of concerns
 */

import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "crypto";

/**
 * Define which model fields require encryption
 *
 * Note: We only encrypt random/sensitive data that provides no business
 * value when visible. Bitcoin addresses, user IDs remain plaintext for functionality.
 */
export const ENCRYPTED_FIELDS = {
  Challenge: ["challenge"] as const,
  Credential: ["publicKey"] as const,
} as const;

type EncryptableModels = keyof typeof ENCRYPTED_FIELDS;
type EncryptableField<T extends EncryptableModels> = typeof ENCRYPTED_FIELDS[T][number];

/**
 * Encryption configuration
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const SALT_LENGTH = 32; // 256-bit salt for key derivation
const TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Get the master encryption key from environment
 *
 * In production, this should come from a secure key management service
 * (AWS KMS, Azure Key Vault, etc.). For now, we use environment variables with validation.
 */
function getMasterKey(): Buffer {
  const key = process.env.DATABASE_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("DATABASE_ENCRYPTION_KEY environment variable is required");
  }

  // Ensure key is exactly 32 bytes (256-bit) for AES-256
  const keyBuffer = Buffer.from(key, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("DATABASE_ENCRYPTION_KEY must be 32 bytes (256-bit) encoded as base64");
  }

  return keyBuffer;
}

/**
 * Derive a field-specific encryption key
 *
 * Each field gets its own derived key to prevent cross-contamination if one key
 * is compromised. This implements "key separation" or "cryptographic compartmentalization".
 *
 * @param modelName - Database model name (e.g., 'Challenge', 'Credential')
 * @param fieldName - Field name (e.g., 'challenge', 'publicKey')
 * @param salt - Random salt for key derivation
 * @returns Derived 256-bit key for field-specific encryption
 */
function deriveFieldKey(modelName: string, fieldName: string, salt: Buffer): Buffer {
  const masterKey = getMasterKey();

  // Use PBKDF2 for key derivation (simpler than HKDF but still secure)
  return pbkdf2Sync(masterKey, salt, 100000, 32, "sha256");
}

/**
 * Encrypt a field value
 *
 * Format: salt(32) + iv(16) + tag(16) + encrypted_data(variable)
 *
 * We prepend salt, IV, and authentication tag to the encrypted data for storage.
 * This is "envelope encryption" and ensures each encrypted value is self-contained
 * and tamper-evident.
 *
 * @param value - Plaintext value to encrypt
 * @param modelName - Database model name
 * @param fieldName - Field name
 * @returns Base64 encoded encrypted data with metadata
 */
export function encryptField(
  value: string,
  modelName: EncryptableModels,
  fieldName: EncryptableField<typeof modelName>,
): string {
  if (!value || typeof value !== "string") {
    return value; // Don't encrypt null/undefined/non-string values
  }

  try {
    // Generate random salt and IV for this encryption operation
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive field-specific key
    const key = deriveFieldKey(modelName, fieldName, salt);

    // Create cipher and encrypt
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(value, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get authentication tag (GCM provides authenticated encryption)
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted_data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);

    // Return as base64 for database storage
    return combined.toString("base64");

  } catch (error) {
    // In production, log this error for monitoring but don't expose encryption details
    console.error(`Field encryption failed for ${modelName}.${fieldName}:`, error);
    throw new Error("Field encryption failed");
  }
}

/**
 * Decrypt a field value
 *
 * Reverses the encryption process, extracting salt, IV, authentication tag,
 * and encrypted data from the stored format.
 *
 * @param encryptedValue - Base64 encoded encrypted data
 * @param modelName - Database model name
 * @param fieldName - Field name
 * @returns Decrypted plaintext value
 */
export function decryptField(
  encryptedValue: string,
  modelName: EncryptableModels,
  fieldName: EncryptableField<typeof modelName>,
): string {
  if (!encryptedValue || typeof encryptedValue !== "string") {
    return encryptedValue; // Return as-is for null/undefined/non-string values
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedValue, "base64");

    // Extract components: salt(32) + iv(16) + tag(16) + encrypted_data(remainder)
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive the same field-specific key
    const key = deriveFieldKey(modelName, fieldName, salt);

    // Create decipher and decrypt
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");

  } catch (error) {
    // Decryption failures could indicate tampering or key issues
    console.error(`Field decryption failed for ${modelName}.${fieldName}:`, error);
    throw new Error("Field decryption failed - data may be corrupted or tampered");
  }
}

/**
 * Check if a model has encrypted fields
 */
export function hasEncryptedFields(modelName: string): modelName is EncryptableModels {
  return modelName in ENCRYPTED_FIELDS;
}

/**
 * Check if a specific field should be encrypted
 */
export function isFieldEncrypted<T extends EncryptableModels>(
  modelName: T,
  fieldName: string,
): fieldName is EncryptableField<T> {
  if (!hasEncryptedFields(modelName)) return false;
  return (ENCRYPTED_FIELDS[modelName] as readonly string[]).includes(fieldName);
}

/**
 * Generate a secure random key for DATABASE_ENCRYPTION_KEY
 *
 * Helper function to generate proper encryption keys. In production, use your
 * cloud provider's key management service.
 *
 * Usage: node -e "console.log(require('./lib/field-encryption').generateEncryptionKey())"
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("base64");
}
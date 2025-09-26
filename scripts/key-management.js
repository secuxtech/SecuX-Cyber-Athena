#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Database Encryption Key Management
 *
 * This script helps generate and manage encryption keys for the database field-level
 * encryption feature. It provides utilities for key generation, validation, and rotation.
 *
 * Security Best Practices:
 * 1. Keys should be stored in secure environment variable stores (not in code)
 * 2. Use different keys for different environments (dev, staging, production)
 * 3. Implement key rotation schedule (quarterly or biannually)
 * 4. Keep backup of keys in secure vault (AWS KMS, Azure Key Vault, etc.)
 * 5. Never commit keys to version control
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Generate a secure 256-bit encryption key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Validate an encryption key format
 */
function validateEncryptionKey(key) {
  try {
    const keyBuffer = Buffer.from(key, "base64");
    if (keyBuffer.length !== 32) {
      return { valid: false, error: "Key must be exactly 32 bytes (256-bit)" };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid base64 format" };
  }
}

/**
 * Display key management help
 */
function showHelp() {
  console.log(`
🔐 Database Encryption Key Management

Usage: node scripts/key-management.js [command]

Commands:
  generate        Generate a new encryption key
  validate <key>  Validate an existing encryption key
  help           Show this help message

Examples:
  node scripts/key-management.js generate
  node scripts/key-management.js validate "YourBase64KeyHere=="

Environment Setup:
  1. Generate a key using this script
  2. Add to your .env file: DATABASE_ENCRYPTION_KEY="generated_key_here"
  3. Keep backup in secure location (AWS KMS, Azure Key Vault, etc.)
  4. Never commit keys to version control

Security Notes:
  - Use different keys for dev/staging/production environments
  - Rotate keys quarterly or biannually
  - Test key rotation process in non-production environments first
  - Monitor application logs for encryption/decryption errors after key rotation
`);
}

/**
 * Generate and display new encryption key
 */
function generateCommand() {
  const key = generateEncryptionKey();

  console.log("🔑 New Database Encryption Key Generated:\n");
  console.log(`DATABASE_ENCRYPTION_KEY="${key}"`);
  console.log("\n📋 Setup Instructions:");
  console.log("1. Copy the above line to your .env file");
  console.log("2. Restart your application to pick up the new key");
  console.log("3. Store backup copy in secure key management service");
  console.log("4. Document key generation date for rotation tracking");

  console.log("\n⚠️  Security Reminders:");
  console.log("- Never commit this key to version control");
  console.log("- Use different keys for each environment");
  console.log("- Keep secure backup of this key");
  console.log("- Plan for key rotation in 3-6 months");
}

/**
 * Validate provided encryption key
 */
function validateCommand(key) {
  if (!key) {
    console.error("❌ Error: Please provide a key to validate");
    console.error("Usage: node scripts/key-management.js validate \"your_key_here\"");
    process.exit(1);
  }

  const result = validateEncryptionKey(key);

  if (result.valid) {
    console.log("✅ Key is valid!");
    console.log(`   Length: ${Buffer.from(key, "base64").length} bytes (256-bit)`);
    console.log("   Format: Base64 encoded");
    console.log("   Ready for use in DATABASE_ENCRYPTION_KEY environment variable");
  } else {
    console.error(`❌ Key validation failed: ${result.error}`);
    console.error("\nTo generate a valid key, run:");
    console.error("node scripts/key-management.js generate");
    process.exit(1);
  }
}

/**
 * Check if .env file needs updating
 */
function checkEnvFile() {
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.log("\n💡 Tip: No .env file found. Create one with your encryption key:");
    console.log("DATABASE_ENCRYPTION_KEY=\"your_generated_key_here\"");
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");

  if (!envContent.includes("DATABASE_ENCRYPTION_KEY")) {
    console.log("\n💡 Tip: Add the following line to your .env file:");
    console.log("DATABASE_ENCRYPTION_KEY=\"your_generated_key_here\"");
  } else {
    console.log("\n✅ DATABASE_ENCRYPTION_KEY found in .env file");
  }
}

// Main command processing
const command = process.argv[2];

switch (command) {
  case "generate":
    generateCommand();
    checkEnvFile();
    break;

  case "validate":
    validateCommand(process.argv[3]);
    break;

  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;

  default:
    if (!command) {
      showHelp();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.error("Run \"node scripts/key-management.js help\" for available commands");
      process.exit(1);
    }
}
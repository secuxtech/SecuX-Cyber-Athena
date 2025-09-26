/**
 * Participant Validation Functions
 *
 * This module extracts and organizes common participant validation logic, achieving:
 * 1. Code reuse - Avoid duplicating the same logic across multiple API endpoints
 * 2. Consistency - Ensure the same business rules are uniformly executed throughout the application
 * 3. Testability - Separate validation logic into independent functions for easier unit testing
 * 4. Maintainability - Centralize validation rules for easier updates and modifications
 *
 * Design principles:
 * - Maintain single responsibility for each function
 * - Explicit input/output types
 * - Unified error handling strategy
 * - Comprehensive documentation
 */

import { db } from "@/lib/db/prisma";
import { throwBusinessError } from "@/lib/utils/error-handler";
import { getHSMPublicKey } from "@/lib/feature/hsm/hsm-connection";

/**
 * Participant credentials information interface
 *
 * Design rationale: Clear type definitions help with:
 * - Ensuring data consistency between APIs
 * - Providing better TypeScript support
 * - Clearly showing the structure of business entities
 */
export interface ParticipantCredentials {
  userId: string;
  fidoPublicKey: string;
  hsmPublicKey?: string;
  passphraseHash?: string;
}

/**
 * Multisig participant information interface
 */
export interface MultisigParticipant {
  multisigWalletId: number;
  userAid: string;
  hsmVault: string;
  walletId: string;
}

/**
 * Validate FIDO credential existence and validity
 *
 * Features:
 * 1. Unified credential validation logic - Avoid repeating the same queries and validations across multiple APIs
 * 2. Security considerations - Ensure every operation is based on valid FIDO credentials
 * 3. Clear error messages - Help developers and users understand validation failure reasons
 *
 * Use cases:
 * - User validation before HSM wallet creation
 * - Initiator validation before transaction initiation
 * - Approver validation before signature submission
 *
 * @param userId - User ID to validate
 * @param context - Operation context for generating specific error messages
 * @returns User's FIDO credential public key (Base64 format)
 * @throws BusinessLogicError when credential doesn't exist or is invalid
 */
export async function validateUserFidoCredential(
  userId: string,
  context: string = "operation",
): Promise<string> {
  // Use select to query only needed fields, improving query performance
  const fidoRecord = await db.credential.findFirst({
    where: { userAid: userId },
    select: { publicKey: true },
    orderBy: { createdAt: "asc" }, // Use earliest credential (consistency strategy for multi-device scenarios)
  });

  if (!fidoRecord || !fidoRecord.publicKey) {
    // Provide specific context information to help diagnose issues
    throwBusinessError(
      `FIDO credential not found for user ${userId} in ${context}`,
      "FIDO_CREDENTIAL_NOT_FOUND",
      400,
    );
  }

  return fidoRecord.publicKey;
}

/**
 * Validate multisig wallet participant identity
 *
 * Features:
 * 1. Authorization validation - Ensure users have permission to operate on specific multisig wallets
 * 2. Security boundaries - Prevent users from operating on wallets they don't belong to
 * 3. Composite query logic - Design secure database query conditions
 *
 * Business rules:
 * - User must be a registered participant of the specified wallet
 * - HSM vault and wallet ID must match
 * - Wallet serial number must correspond to the correct wallet instance
 *
 * @param userId - User ID
 * @param hsmVault - HSM vault URL
 * @param walletId - Wallet ID
 * @param walletSN - Wallet serial number (optional, for additional verification)
 * @returns Participant's multisig wallet information
 * @throws BusinessLogicError when participant validation fails
 */
export async function validateMultisigParticipant(
  userId: string,
  hsmVault: string,
  walletId: string,
  walletSN?: number,
): Promise<MultisigParticipant> {
  // Build secure query conditions ensuring all parameters match
  const whereCondition: any = {
    multisigWallet: {
      hsmVault,
      walletId,
    },
    userAid: userId,
  };

  // Optional additional validation layer providing stronger security guarantees
  if (walletSN !== undefined) {
    whereCondition.multisigWallet.id = walletSN;
  }

  const participant = await db.multisigParticipant.findFirst({
    where: whereCondition,
    select: {
      multisigWalletId: true,
      userAid: true,
      multisigWallet: {
        select: {
          hsmVault: true,
          walletId: true,
        },
      },
    },
  });

  if (!participant) {
    throwBusinessError(
      "User is not a participant of this multisig wallet",
      "PARTICIPANT_NOT_FOUND",
      404,
    );
  }

  // Return flattened data structure for easier usage
  return {
    multisigWalletId: participant.multisigWalletId,
    userAid: participant.userAid,
    hsmVault: participant.multisigWallet.hsmVault,
    walletId: participant.multisigWallet.walletId,
  };
}

/**
 * Comprehensive validation: FIDO credential + HSM public key retrieval
 *
 * Features:
 * 1. Function composition - Combine multiple smaller functions to complete complex business processes
 * 2. Atomic operations - Ensure related validation steps either all succeed or all fail
 * 3. Error propagation - Properly handle and propagate errors in function composition
 *
 * Business process:
 * 1. Validate user has valid FIDO credential
 * 2. Retrieve corresponding public key from HSM
 * 3. Return complete participant credential information
 *
 * Use cases:
 * - Complete user validation before transaction initiation
 * - Authorization confirmation before signing operations
 * - Participant validation during wallet creation process
 *
 * @param userId - User ID
 * @param hsmVault - HSM vault URL
 * @param passphraseHash - User passphrase hash
 * @param context - Operation context (for error messages)
 * @returns Complete participant credential information
 * @throws BusinessLogicError when any validation step fails
 */
export async function validateParticipantWithHSM(
  userId: string,
  hsmVault: string,
  passphraseHash: string,
  context: string = "HSM operation",
): Promise<ParticipantCredentials> {
  // Execute validations in order, fail-fast principle
  // 1. First validate FIDO credential (local fast check)
  const fidoPublicKey = await validateUserFidoCredential(userId, context);

  // 2. Then communicate with HSM to get public key (potentially slower external operation)
  const hsmPublicKey = await getHSMPublicKey(hsmVault, userId, passphraseHash);

  // Return structured result containing all relevant credential information
  return {
    userId,
    fidoPublicKey,
    hsmPublicKey,
    passphraseHash,
  };
}

/**
 * Comprehensive validation: Multisig participant + FIDO credential + HSM public key
 *
 * Features:
 * 1. Complete business process encapsulation - Combine multiple validation steps into a single high-level function
 * 2. Layered security - Complete security chain from authorization, authentication to key management
 * 3. Performance considerations - Optimize validation order, placing fast local checks first
 *
 * This function represents the standard validation process for multisig wallet operations:
 * 1. Validate user is a legitimate participant of the wallet (authorization layer)
 * 2. Validate user has valid FIDO credential (authentication layer)
 * 3. Retrieve HSM public key for cryptographic operations (key management layer)
 *
 * @param userId - User ID
 * @param hsmVault - HSM vault URL
 * @param walletId - Wallet ID
 * @param passphraseHash - User passphrase hash
 * @param walletSN - Wallet serial number (optional)
 * @returns Combination of participant information and credential information
 */
export async function validateMultisigParticipantWithCredentials(
  userId: string,
  hsmVault: string,
  walletId: string,
  passphraseHash: string,
  walletSN?: number,
): Promise<{ participant: MultisigParticipant; credentials: ParticipantCredentials }> {
  // Execute independent validation steps in parallel for better performance
  const [participant, credentials] = await Promise.all([
    validateMultisigParticipant(userId, hsmVault, walletId, walletSN),
    validateParticipantWithHSM(userId, hsmVault, passphraseHash, "multisig operation"),
  ]);

  return {
    participant,
    credentials,
  };
}

/**
 * Usage example: How to use these participant validation functions in API endpoints
 *
 * // Previous duplicated code:
 * const fidoRecord = await db.credential.findFirst({
 *   where: { userAid: userId },
 *   select: { publicKey: true },
 *   orderBy: { createdAt: "asc" },
 * });
 * if (!fidoRecord || !fidoRecord.publicKey) {
 *   throwBusinessError(`FIDO credential not found for ${userId}`, "FIDO_CREDENTIAL_NOT_FOUND", 400);
 * }
 * const publicKey = await getHSMPublicKey(hsmVault, userId, passphraseHash);
 *
 * // Current simplified code:
 * const { credentials } = await validateMultisigParticipantWithCredentials(
 *   userId, hsmVault, walletId, passphraseHash, walletSN
 * );
 *
 * Benefits of this extraction:
 * 1. Code reuse - Multiple APIs can use the same validation logic
 * 2. Consistency - Ensure all places use the same validation rules
 * 3. Maintainability - Validation logic changes only need to be made in one place
 * 4. Testability - Can independently test each validation function
 * 5. Readability - API endpoint code becomes more concise and semantic
 */
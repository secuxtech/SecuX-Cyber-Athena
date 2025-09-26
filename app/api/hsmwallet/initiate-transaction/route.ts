/**
 * Multi-signature Transaction Initiation API - Creates and signs Bitcoin transactions
 * Handles complete transaction flow from creation to signature submission via HSM
 */

import { NextRequest, NextResponse } from "next/server";
import { submitSignature } from "@/lib/btc-multisig/wallet";
import { initiateTransaction, getUnsignedTransaction } from "@/lib/btc-multisig/transaction";
import { TransactionStatus as txStatus } from "@/lib/btc-multisig/interface";
import { withAuth } from "@/lib/middleware/middleware";
import { validateRequestBody, TransactionAmountSchema, BitcoinAddressSchema } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { signWithHSM } from "@/lib/feature/hsm/hsm-connection";
import { validateMultisigParticipantWithCredentials } from "@/lib/feature/participant/participant-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS, CRYPTO } from "@/config";
import { z } from "zod";

// Input validation schema
const InitiateTransactionSchema = z.object({
  initiatorId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  operation: z.string().min(LIMITS.OPERATION_NAME.MIN).max(LIMITS.OPERATION_NAME.MAX),
  asset: z.string().min(LIMITS.ASSET_NAME.MIN).max(LIMITS.ASSET_NAME.MAX),
  amount: TransactionAmountSchema,
  recipient: BitcoinAddressSchema,
  hsmVault: z.string().url(),
  walletId: z.string().min(LIMITS.WALLET_ID.MIN).max(LIMITS.WALLET_ID.MAX),
  walletSN: z.number().int().positive(),
  passphraseHash: z.string().regex(/^[a-f0-9]{64}$/i, "Must be 64-character hex string"),
  feeRate: z.number().int().min(LIMITS.BTC_FEE_RATE.MIN).max(LIMITS.BTC_FEE_RATE.MAX).optional().default(1000),
});

// Core handler function
async function handleInitiateTransaction(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const {
    initiatorId, operation, asset, amount, recipient,
    hsmVault, walletId, walletSN, passphraseHash, feeRate,
  } = await validateRequestBody(req, InitiateTransactionSchema);

  // Simplify validation process using participant validation functions
  // This function encapsulates three common validation steps:
  // 1. Validate user is a legitimate participant of the multisig wallet
  // 2. Validate user has valid FIDO credentials
  // 3. Retrieve user's public key from HSM
  const { credentials } = await validateMultisigParticipantWithCredentials(
    initiatorId,
    hsmVault,
    walletId,
    passphraseHash,
    walletSN,
  );

  const publicKey = credentials.hsmPublicKey!;

  // Business logic validation
  if (amount < CRYPTO.BTC_MIN_AMOUNT) {
    throwBusinessError(`Amount must be greater than ${CRYPTO.BTC_MIN_AMOUNT}`, "AMOUNT_TOO_SMALL", 400);
  }

  const note = `${initiatorId}:${operation}-${asset}-${amount}:${recipient}`;
  const initiateTxResponse = await initiateTransaction(walletId, {
    recipientAddress: recipient,
    amount: Math.floor(amount * 1e8), // Convert BTC to satoshi
    feeRate,
    note,
  });
  const signTxId = initiateTxResponse.transactionId;

  const unsignedTxResponse = await getUnsignedTransaction(signTxId);
  if (!unsignedTxResponse || !unsignedTxResponse.unsignedTransactions) {
    throwBusinessError("Failed to get unsigned transactions", "UNSIGNED_TX_FAILED", 500);
  }

  const unsignedTransactions = unsignedTxResponse.unsignedTransactions;

  const signatures = [];
  for (const unsignedTx of unsignedTransactions) {
    const hash = Buffer.from(unsignedTx, "hex");
    // Use unified HSM signing with enhanced error handling
    const signature = await signWithHSM(hsmVault, hash.toString("hex"), passphraseHash, initiatorId);
    signatures.push(signature.toString("hex"));
  }

  if (!signTxId || !publicKey || !signatures) {
    throwBusinessError("transactionId, publicKey, and signatures are required", "MISSING_SIGNATURE_PARAMS", 400);
  }

  const submitResult = await submitSignature(signTxId, { publicKey, signatures });
  if (!submitResult || !submitResult.status || submitResult.status !== txStatus.pending) {
    throwBusinessError("Failed to submit signature", "SIGNATURE_SUBMIT_FAILED", 500);
  }

  return NextResponse.json(initiateTxResponse);
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const POST = composeAuthenticatedAPI(
  strictRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleInitiateTransaction);

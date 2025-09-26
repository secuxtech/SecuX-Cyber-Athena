/**
 * HSM Transaction Cancellation API - Cancel pending multisig Bitcoin transactions
 * Cancels transactions in HSM vault and updates database status with proper authorization checks
 */
import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@prisma/client";
import { cancelTransaction } from "@/lib/btc-multisig/transaction";
import { withAuth } from "@/lib/middleware/middleware";
import { validateRequestBody } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS } from "@/config";
import { z } from "zod";

// Input validation schema
const CancelTransactionSchema = z.object({
  id: z.coerce.number().int().positive(),
  initiatorId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  transactionId: z.string().min(LIMITS.TRANSACTION_ID.MIN).max(LIMITS.TRANSACTION_ID.MAX),
  hsmVault: z.string().url(),
});

// Core handler function
async function handleCancelTransaction(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { id, initiatorId, transactionId, hsmVault } =
    await validateRequestBody(req, CancelTransactionSchema);

  // Find participant by initiatorId (for checking)
  const participants = await db.multisigParticipant.findMany({
    where: { userAid: initiatorId },
    select: { multisigWallet: true },
  });
  if (!participants || !participants.length) {
    throwBusinessError("Multisig participant not found", "PARTICIPANT_NOT_FOUND", 404);
  }

  // Find multisigWallet from participant by hsmVault (for checking)
  const multisigWallet = participants
    .map((participant) => participant.multisigWallet)
    .find((wallet) => wallet && wallet.hsmVault === hsmVault);
  if (!multisigWallet) {
    throwBusinessError("Multisig wallet not found for given hsmVault", "WALLET_NOT_FOUND", 404);
  }

  const transaction = await db.transaction.findUnique({
    where: { id: Number(id), initiatorId },
  });
  if (!transaction) {
    throwBusinessError("Transaction not found or access denied", "TRANSACTION_NOT_FOUND", 404);
  }
  if (transaction.hsmVault !== hsmVault) {
    throwBusinessError("Transaction HSM vault mismatch", "HSM_VAULT_MISMATCH", 400);
  }

  await db.transaction.update({
    where: { id: Number(id) },
    data: {
      status: TransactionStatus.CANCELLED,
      transactionId: "N/A",
      transactionHash: "N/A",
    },
  });

  const cancelTxResponse = await cancelTransaction(transactionId);
  if (!cancelTxResponse) {
    throwBusinessError("Failed to cancel transaction", "CANCEL_TRANSACTION_FAILED", 500);
  }

  return NextResponse.json({ response: cancelTxResponse, message: "Transaction cancelled" });
}

// Apply security middlewares: unified error handling + auth + strict rate limiting + security headers
export const POST = composeAuthenticatedAPI(
  strictRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleCancelTransaction);


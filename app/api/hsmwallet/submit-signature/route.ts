/**
 * Multi-signature Transaction Approval API - Handles cosigner transaction approval
 * Manages signature collection and automatic transaction broadcasting when complete
 */

import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus, ApprovalStatus } from "@prisma/client";
import { getTransactionStatus, getUnsignedTransaction, broadcastTransaction } from "@/lib/btc-multisig/transaction";
import { getWalletBalance, submitSignature } from "@/lib/btc-multisig/wallet";
import { TransactionStatus as txStatus } from "@/lib/btc-multisig/interface";
import { withAuth } from "@/lib/middleware/middleware";
import { validateRequestBody } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { signWithHSM } from "@/lib/feature/hsm/hsm-connection";
import { validateMultisigParticipantWithCredentials } from "@/lib/feature/participant/participant-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS } from "@/config";
import { z } from "zod";

// Input validation schema
const SubmitSignatureSchema = z.object({
  id: z.coerce.number().int().positive(),
  initiatorId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  approverId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  hsmVault: z.string().url(),
  walletId: z.string().min(LIMITS.WALLET_ID.MIN).max(LIMITS.WALLET_ID.MAX),
  passphraseHash: z.string().regex(/^[a-f0-9]{64}$/i, "Must be 64-character hex string"),
});

// Core handler function
async function handleSubmitSignature(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { id, initiatorId, approverId, hsmVault, walletId, passphraseHash } =
    await validateRequestBody(req, SubmitSignatureSchema);

  // Validate initiator exists
  const initiatorCredential = await db.credential.findFirst({
    where: { userAid: initiatorId },
  });
  if (!initiatorCredential) {
    throwBusinessError("Invalid initiator", "INVALID_INITIATOR", 403);
  }

  // Validate approver exists
  const approverCredential = await db.credential.findFirst({
    where: { userAid: approverId },
  });
  if (!approverCredential) {
    throwBusinessError("Invalid approver", "INVALID_APPROVER", 403);
  }

  const transaction = await db.transaction.findUnique({
    where: { id: Number(id), initiatorId },
  });
  if (!transaction) {
    throwBusinessError("Transaction not found or access denied", "TRANSACTION_NOT_FOUND", 404);
  }

  const signTxId = transaction.transactionId;
  if (!signTxId) {
    throwBusinessError("Transaction ID in HSM not found", "HSM_TRANSACTION_ID_MISSING", 400);
  }
  if (transaction.hsmVault !== hsmVault) {
    throwBusinessError("Transaction HSM vault mismatch", "HSM_VAULT_MISMATCH", 400);
  }

  // Reuse participant validation functions for signature approver validation
  // This shows how to use the same validation logic across different API endpoints
  const { credentials } = await validateMultisigParticipantWithCredentials(
    approverId,
    hsmVault,
    walletId,
    passphraseHash,
  );

  const publicKey = credentials.hsmPublicKey!;

  const statusResponse = await getTransactionStatus(signTxId);

  if (statusResponse.status === txStatus.pending) {
    const unsignedTxResponse = await getUnsignedTransaction(signTxId);
    if (!unsignedTxResponse || !unsignedTxResponse.unsignedTransactions) {
      throwBusinessError("Failed to get unsigned transactions", "UNSIGNED_TX_FAILED", 500);
    }

    const unsignedTransactions = unsignedTxResponse.unsignedTransactions;

    console.log(
      `[${new Date().toISOString()}] submit-signature`,
      {
        signTxId,
        publicKey,
        unsignedTransactions,
        label: passphraseHash,
        id: approverId,
      },
    );

    const signatures = [];
    for (const unsignedTx of unsignedTransactions) {
      const hash = Buffer.from(unsignedTx, "hex");
      // Use unified HSM signing with enhanced error handling
      const signature = await signWithHSM(hsmVault, hash.toString("hex"), passphraseHash, approverId);
      signatures.push(signature.toString("hex"));
    }

    if (!signTxId || !publicKey || !signatures) {
      throwBusinessError("transactionId, publicKey, and signatures are required", "MISSING_SIGNATURE_PARAMS", 400);
    }

    const submitResult = await submitSignature(signTxId, { publicKey, signatures });
    if (!submitResult || !submitResult.status || submitResult.status !== txStatus.allsigned) {
      throwBusinessError("Failed to submit signature", "SIGNATURE_SUBMIT_FAILED", 500);
    }
  }

  const statusResult = await getTransactionStatus(signTxId);
  const { signaturesReceived, status } = statusResult;
  if (status === txStatus.pending) {
    await updateTransactionApproval(Number(id), approverId, signaturesReceived);
    return NextResponse.json(statusResult);
  }

  console.log(
    `[${new Date().toISOString()}] broadcast-transaction`,
    {
      walletId,
      signTxId,
    },
  );

  const broadcastResponse = await broadcastTransaction(signTxId);
  if (!broadcastResponse || !broadcastResponse.status || broadcastResponse.status !== txStatus.broadcasted) {
    throwBusinessError("Failed to broadcast transaction", "BROADCAST_FAILED", 500);
  }

  const txHash = broadcastResponse.txHash;
  await updateTransactionApproval(Number(id), approverId, signaturesReceived, TransactionStatus.COMPLETED, txHash);

  const remainingBalance = await getWalletBalance(walletId);
  return NextResponse.json({...broadcastResponse, balance: remainingBalance.confirmedBalance});
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const POST = composeAuthenticatedAPI(
  strictRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleSubmitSignature);

async function createTransactionApproval(approverId: string, txSN: number) {
  await db.transactionApproval.create({
    data: {
      approverId,
      status: ApprovalStatus.APPROVED,
      txSN,
    },
  });
}

async function updateTransactionApproval(
  id: number,
  approverId: string,
  approvalCount: number,
  status?: TransactionStatus,
  transactionHash?: string,
) {
  await db.transaction.update({
    where: { id },
    data: {
      approvalCount,
      ...(status && { status }),
      ...(transactionHash && { transactionHash }),
    },
  });

  await createTransactionApproval(approverId, id);
}

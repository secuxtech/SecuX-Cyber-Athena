import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@prisma/client";
import { withAuth } from "@/lib/middleware/middleware";
import { validateRequestBody, TransactionAmountSchema, BitcoinAddressSchema } from "@/lib/utils/input-validation";
import { unifiedRateLimiter, strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS } from "@/config";
import { z } from "zod";

// Query validation schema for GET
const TransactionQuerySchema = z.object({
  accountId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  status: z.nativeEnum(TransactionStatus).optional(),
});

// Body validation schema for POST
const CreateTransactionSchema = z.object({
  initiatorId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  asset: z.enum(["BTC"]), // Restrict to supported assets
  amount: TransactionAmountSchema,
  recipient: BitcoinAddressSchema,
  approvalCount: z.number().int().min(LIMITS.APPROVAL_COUNT.MIN).max(LIMITS.APPROVAL_COUNT.MAX),
  requiredCount: z.number().int().min(LIMITS.REQUIRED_SIGNATURES.MIN).max(LIMITS.REQUIRED_SIGNATURES.MAX),
  transactionId: z.string().min(LIMITS.TRANSACTION_ID.MIN).max(LIMITS.TRANSACTION_ID.MAX),
  hsmVault: z.string().url(),
  walletId: z.string().min(LIMITS.WALLET_ID.MIN).max(LIMITS.WALLET_ID.MAX),
});

// Core handler function for GET
async function handleGetTransactions(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // Validate query parameters using Zod (errors automatically handled by withErrorHandler)
  const { accountId, status } = TransactionQuerySchema.parse({
    accountId: searchParams.get("accountId"),
    status: searchParams.get("status"),
  });

  // Get multisig wallets related to accountId
  const participants = await db.multisigParticipant.findMany({
    where: { userAid: accountId },
    select: { multisigWallet: { select: { id: true, hsmVault: true, walletId: true } } },
  });

  if (!participants || !participants.length) {
    throwBusinessError("Multisig participant not found", "PARTICIPANT_NOT_FOUND", 404);
  }

  // Get all related multisigWalletIds
  const multisigWalletIds = participants.map(p => p.multisigWallet.walletId);

  const transactions = await db.transaction.findMany({
    where: {
      AND: [
        status ? { status: status as TransactionStatus } : {},
        { walletId: { in: multisigWalletIds } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(transactions);
}

// Core handler function for POST
async function handleCreateTransaction(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const {
    initiatorId, asset, amount, recipient, approvalCount, requiredCount, transactionId, hsmVault, walletId,
  } = await validateRequestBody(req, CreateTransactionSchema);

  // Business validation
  if (approvalCount > requiredCount) {
    throwBusinessError("Approval count cannot exceed required count", "INVALID_APPROVAL_COUNT", 400);
  }

  // Validate initiator exists
  const initiatorCredential = await db.credential.findFirst({
    where: { userAid: initiatorId },
  });
  if (!initiatorCredential) {
    throwBusinessError("Invalid initiator", "INVALID_INITIATOR", 403);
  }

  const transaction = await db.transaction.create({
    data: {
      initiatorId,
      asset,
      amount,
      recipient,
      approvalCount,
      requiredCount,
      transactionId,
      hsmVault,
      walletId,
      approvals: {
        create: {
          approverId: initiatorId,
          status: "INITIATED",
        },
      },
    },
  });

  return NextResponse.json(transaction);
}

// Apply security middlewares with unified error handling
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetTransactions);

export const POST = composeAuthenticatedAPI(
  strictRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleCreateTransaction);

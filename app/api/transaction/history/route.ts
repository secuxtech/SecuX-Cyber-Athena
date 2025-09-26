import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { TransactionStatus } from "@prisma/client";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetTransactionHistory(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  // Validate accountId
  if (!accountId || accountId.length < 1 || accountId.length > 100) {
    throwBusinessError("Invalid or missing accountId", "INVALID_ACCOUNT_ID", 400);
  }

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
      walletId: { in: multisigWalletIds },
      NOT: {
        status: TransactionStatus.PENDING,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(transactions);
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetTransactionHistory);

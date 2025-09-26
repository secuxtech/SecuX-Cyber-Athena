import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@prisma/client";
import { getPendingTransactions, getTransactionHistory } from "@/lib/btc-multisig/transaction";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { validateAccountIdFromPath } from "@/lib/utils/input-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS } from "@/config";
import { z } from "zod";

// Query parameter validation schema
const QueryTransactionsParamsSchema = z.object({
  status: z.enum([TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.FAILED]).optional(),
  page: z.coerce.number().int().min(LIMITS.PAGE_NUMBER.MIN).optional().default(1),
});

// Core handler function
async function handleQueryTransactions(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);

  // Validate accountId from path using Zod schema
  const accountId = validateAccountIdFromPath(url.pathname);

  // Validate query parameters using Zod (errors automatically handled by withErrorHandler)
  const { searchParams } = url;
  const { status, page } = QueryTransactionsParamsSchema.parse({
    status: searchParams.get("status"),
    page: searchParams.get("page"),
  });

  const participants = await db.multisigParticipant.findMany({
    where: { userAid: accountId },
    select: { multisigWallet: true },
  });
  if (!participants || participants.length === 0) {
    throwBusinessError("Multisig participant not found", "PARTICIPANT_NOT_FOUND", 404);
  }

  const txList: { hsmVault: string; walletId: string; response: any }[] = [];
  await Promise.all(
    participants.map(async (participant) => {
      const multisigWallet = participant.multisigWallet;
      const walletId = multisigWallet.walletId;
      const hsmVault = multisigWallet.hsmVault;
      if (!hsmVault || !walletId) {
        throwBusinessError("Missing required wallet parameters", "MISSING_WALLET_PARAMS", 400);
      }

      let response;
      if (status === TransactionStatus.PENDING) {
        response = await getPendingTransactions(walletId);
      } else {
        response = await getTransactionHistory(walletId, page);
      }

      txList.push({ hsmVault, walletId, response });
    }),
  );

  return NextResponse.json(txList);
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleQueryTransactions);

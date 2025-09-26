import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getWalletBalance, getWalletDetails } from "@/lib/btc-multisig/wallet";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { validateAccountIdFromPath } from "@/lib/utils/input-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetBalance(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);

  // Validate accountId from path using Zod schema
  const accountId = validateAccountIdFromPath(url.pathname);

  const participants = await db.multisigParticipant.findMany({
    where: { userAid: accountId },
    select: { multisigWallet: true },
  });
  if (!participants || !participants.length) {
    throwBusinessError("Multisig participant not found", "PARTICIPANT_NOT_FOUND", 404);
  }

  const balanceList = [];
  for (const participant of participants) {
    const multisigWallet = participant.multisigWallet;
    const walletId = multisigWallet.walletId;
    if (!walletId) {
      console.error("Missing walletId for participant");
      continue; // Skip this participant instead of throwing
    }

    try {
      const response = await getWalletBalance(walletId);
      if (!response) {
        console.error(`Wallet balance not found for ${walletId}`);
        continue;
      }

      const details = await getWalletDetails(walletId);
      if (!details) {
        console.error(`Wallet details not found for ${walletId}`);
        continue;
      }

      balanceList.push({
        walletId: response.walletId,
        address: response.address,
        balance: response.confirmedBalance,
        name: details.name,
        participants: details.participants.map((p) => p.userId),
        creationTime: details.creationTime,
      });
    } catch (walletError) {
      console.error(`Error fetching wallet data for ${walletId}:`, walletError);
      // Continue with other wallets instead of failing completely
    }
  }

  return NextResponse.json({ balanceList });
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetBalance);

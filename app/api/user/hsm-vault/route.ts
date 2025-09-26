import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler } from "@/lib/utils/error-handler";
import { validateAccountIdFromQuery } from "@/lib/utils/input-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetHsmVaults(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // Validate accountId using Zod schema
  const accountId = validateAccountIdFromQuery(searchParams);

  // Find all multisig wallets where the user is a participant
  const participants = await db.multisigParticipant.findMany({
    where: { userAid: accountId },
    select: { multisigWallet: { select: { id: true, hsmVault: true, walletId: true, name: true } } },
  });
  if (!participants || !participants.length) {
    return NextResponse.json({ hsmVaults: [] });
  }

  // Extract unique hsmVault/walletId pairs
  const hsmVaults = [
    ...new Map(
      participants.map((p) => [p.multisigWallet.hsmVault + p.multisigWallet.walletId, p.multisigWallet]),
    ).values(),
  ];
  return NextResponse.json({ hsmVaults });
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetHsmVaults);

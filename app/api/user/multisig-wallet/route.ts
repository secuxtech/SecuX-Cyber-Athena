import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetMultisigWallet(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  // Validate accountId
  if (!accountId || accountId.length < 1 || accountId.length > 100) {
    throwBusinessError("Invalid or missing accountId", "INVALID_ACCOUNT_ID", 400);
  }

  const user = await db.user.findUnique({
    where: { accountId },
    select: { multisigSigners: true },
  });
  if (!user) {
    throwBusinessError("User not found", "USER_NOT_FOUND", 404);
  }
  return NextResponse.json({ multisigSignersLength: user.multisigSigners.length });
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetMultisigWallet);

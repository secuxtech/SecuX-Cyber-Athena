/**
 * User Account Information API - Retrieve user account details and credential status
 * Returns account information including FIDO2 credential count for registration state checks
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler } from "@/lib/utils/error-handler";
import { validateAccountIdFromPath } from "@/lib/utils/input-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetUser(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);

  // Validate accountId from path using Zod schema
  const accountId = validateAccountIdFromPath(url.pathname);

  const user = await db.user.findUnique({
    where: { accountId },
    include: { credentials: true },
  });

  // Return user information if exists, otherwise indicate user needs registration
  if (!user) {
    return NextResponse.json({
      accountId,
      credentialCount: 0,
    });
  }

  return NextResponse.json({
    accountId: user.accountId,
    credentialCount: user.credentials.length,
  });
}

// Apply security middlewares using composition pattern
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetUser);

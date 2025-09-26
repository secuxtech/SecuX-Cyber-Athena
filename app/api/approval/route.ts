/**
 * Transaction Approvals API - Retrieve pending transaction approvals by account
 * Returns list of transactions requiring approval from the authenticated user
 */
import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetApprovals(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  // Validate accountId
  if (!accountId || accountId.length < 1 || accountId.length > 100) {
    throwBusinessError("Invalid or missing accountId", "INVALID_ACCOUNT_ID", 400);
  }

  const approvals = await db.transactionApproval.findMany({
    include: { transaction: true },
    where: { approverId: accountId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(approvals);
}

// Apply security middlewares using composition pattern
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetApprovals);

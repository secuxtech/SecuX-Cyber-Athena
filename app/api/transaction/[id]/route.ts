import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleGetTransactionById(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const rawId = pathSegments[pathSegments.length - 1];
  const id = Number(rawId);

  if (isNaN(id) || id <= 0) {
    throwBusinessError("Invalid transaction ID (SN)", "INVALID_TRANSACTION_ID", 400);
  }

  const transaction = await db.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throwBusinessError("Transaction not found", "TRANSACTION_NOT_FOUND", 404);
  }

  return NextResponse.json(transaction);
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleGetTransactionById);

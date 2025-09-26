import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/btc-multisig/transaction";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";

// Core handler function
async function handleTransactionStatus(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  const initiatorId = pathSegments[pathSegments.length - 1];
  const id = pathSegments[pathSegments.length - 2];

  // Validate path parameters
  if (!id || !initiatorId) {
    throwBusinessError("Missing transaction ID or initiator ID", "MISSING_PATH_PARAMS", 400);
  }

  // Validate ID is numeric
  const transactionId = parseInt(id, 10);
  if (isNaN(transactionId) || transactionId <= 0) {
    throwBusinessError("Invalid transaction ID", "INVALID_TRANSACTION_ID", 400);
  }

  // Validate initiatorId format
  if (initiatorId.length < 1 || initiatorId.length > 100) {
    throwBusinessError("Invalid initiator ID", "INVALID_INITIATOR_ID", 400);
  }

  // Verify credential exists
  const credential = await db.credential.findFirst({
    where: { userAid: initiatorId },
  });
  if (!credential) {
    throwBusinessError("Credential not found", "CREDENTIAL_NOT_FOUND", 403);
  }

  // Find transaction and verify ownership
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId, initiatorId },
  });
  if (!transaction || !transaction.transactionId) {
    throwBusinessError("Transaction not found or access denied", "TRANSACTION_NOT_FOUND", 404);
  }

  const response = await getTransactionStatus(transaction.transactionId);
  return NextResponse.json({ response });
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleTransactionStatus);

import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import {
  healthCheck,
  getFeeRateRecommendations,
  estimateVirtualSize,
} from "@/lib/btc-multisig/utils";
import { withAuth } from "@/lib/middleware/middleware";
import { unifiedRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS, HSM } from "@/config";
import { z } from "zod";

// Query validation schema
const UtilsQuerySchema = z.object({
  action: z.enum(["health", "fee-rates", "estimate-vsize", "faucet"]),
  walletId: z.string().min(LIMITS.WALLET_ID.MIN).max(LIMITS.WALLET_ID.MAX).optional(),
  recipientAddress: z.string().min(LIMITS.RECIPIENT_ADDRESS.MIN).max(LIMITS.RECIPIENT_ADDRESS.MAX).optional(),
});

// Core handler function
async function handleUtils(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  // Validate query parameters using Zod (errors automatically handled by withErrorHandler)
  // Convert null to undefined for optional parameters
  const { action, walletId, recipientAddress } = UtilsQuerySchema.parse({
    action: searchParams.get("action"),
    walletId: searchParams.get("walletId") || undefined,
    recipientAddress: searchParams.get("recipientAddress") || undefined,
  });

  switch (action) {
    case "health":
      const health = await healthCheck();
      return NextResponse.json(health);

    case "fee-rates":
      const feeRates = await getFeeRateRecommendations();
      return NextResponse.json(feeRates);

    case "estimate-vsize":
      if (!walletId || !recipientAddress) {
        throwBusinessError(
          "walletId and recipientAddress are required for estimate-vsize",
          "MISSING_PARAMETERS",
          400,
        );
      }
      const vsize = await estimateVirtualSize(walletId, recipientAddress);
      return NextResponse.json({ vsize });

    case "faucet":
      if (!recipientAddress) {
        throwBusinessError("recipientAddress is required for faucet", "MISSING_RECIPIENT", 400);
      }

      const res = await axios.post(HSM.FAUCET_URL, {
        walletAddress: recipientAddress,
      });

      return NextResponse.json({ message: "Faucet request sent", txid: res.data.txid });

    default:
      throwBusinessError("Invalid action", "INVALID_ACTION", 400);
  }
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const GET = composeAuthenticatedAPI(
  unifiedRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleUtils);

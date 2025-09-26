/**
 * FIDO2 Authentication Options API - WebAuthn authentication challenge generation
 * Generates challenge options for registered users to authenticate with FIDO2 credentials
 */
import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { setChallenge } from "@/lib/feature/fido/challenge-store";
import { getSecurityConfig } from "@/lib/utils/env-validation";
import { validateRequestBody, AccountIdSchema } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withFidoSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeFidoAPI } from "@/lib/middleware/middleware-compose";
import { z } from "zod";

const AuthOptionsSchema = z.object({
  accountId: AccountIdSchema,
});

// Core handler function
async function handleAuthOptions(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { accountId } = await validateRequestBody(req, AuthOptionsSchema);

  const user = await db.user.findUnique({
    where: { accountId },
    include: { credentials: true },
  });

  if (!user || !user.credentials.length) {
    throwBusinessError("Account not registered", "ACCOUNT_NOT_REGISTERED", 404);
  }

  const securityConfig = getSecurityConfig();
  const options = await generateAuthenticationOptions({
    rpID: securityConfig.rpId,
    allowCredentials: user.credentials.map((cred) => ({
      id: cred.credentialId,
      type: "public-key",
    })),
    userVerification: "required",
  });

  await setChallenge(user.accountId, options.challenge);

  return NextResponse.json(options);
}

// Apply middlewares: unified error handling + rate limiting + security headers
export const POST = composeFidoAPI(
  strictRateLimiter,
  withErrorHandler,
  withFidoSecurityHeaders,
)(handleAuthOptions);

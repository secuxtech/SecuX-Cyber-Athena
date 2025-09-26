/**
 * FIDO2 Registration Options API - WebAuthn credential creation setup
 * Generates challenge for passwordless authentication registration
 */

import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { setChallenge } from "@/lib/feature/fido/challenge-store";
import { getSecurityConfig } from "@/lib/utils/env-validation";
import { validateRequestBody, AccountIdSchema } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withFidoSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeFidoAPI } from "@/lib/middleware/middleware-compose";
import { TIMEOUT, ERROR_CODES, HTTP_STATUS } from "@/config";
import { z } from "zod";

const RegisterOptionsSchema = z.object({
  accountId: AccountIdSchema,
  appendMode: z.boolean().optional(),
});

// Core handler function
async function handleRegisterOptions(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { accountId, appendMode } = await validateRequestBody(req, RegisterOptionsSchema);

  const existingCredential = await db.credential.findFirst({ where: { userAid: accountId } });
  if (existingCredential && !appendMode) {
    throwBusinessError(
      "Already registered. Please login and add new device from settings.",
      ERROR_CODES.ALREADY_REGISTERED,
      HTTP_STATUS.FORBIDDEN,
    );
  }

  let user = await db.user.findUnique({ where: { accountId } });
  if (!user) user = await db.user.create({ data: { accountId } });

  const securityConfig = getSecurityConfig();
  const options = await generateRegistrationOptions({
    rpName: securityConfig.rpName,
    rpID: securityConfig.rpId,
    userID: new TextEncoder().encode(user.accountId),
    userDisplayName: user.accountId,
    userName: user.accountId,
    attestationType: "none",
    timeout: TIMEOUT.FIDO_REGISTER,
  });

  await setChallenge(user.accountId, options.challenge);
  return NextResponse.json(options);
}

// Apply middlewares using FIDO composition pattern
export const POST = composeFidoAPI(
  strictRateLimiter,
  withErrorHandler,
  withFidoSecurityHeaders,
)(handleRegisterOptions);

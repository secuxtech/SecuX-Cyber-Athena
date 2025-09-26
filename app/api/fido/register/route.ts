/**
 * FIDO2 Registration Verification API - Completes WebAuthn credential creation
 * Verifies and stores FIDO2 credentials for passwordless authentication
 */

import base64url from "base64url";
import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getChallenge, clearChallenge } from "@/lib/feature/fido/challenge-store";
import { getSecurityConfig } from "@/lib/utils/env-validation";
import { validateRequestBody, AccountIdSchema } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withFidoSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeFidoAPI } from "@/lib/middleware/middleware-compose";
import { encryptField } from "@/lib/utils/field-encryption";
import { z } from "zod";

// FIDO2 credential schema validation
const FidoCredentialSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    attestationObject: z.string(),
    clientDataJSON: z.string(),
  }),
  type: z.literal("public-key"),
  clientExtensionResults: z.object({}).optional(),
});

const RegisterSchema = z.object({
  accountId: AccountIdSchema,
  credential: FidoCredentialSchema,
  appendMode: z.boolean().optional(),
});

// Core handler function
async function handleRegister(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { accountId, credential, appendMode } = await validateRequestBody(req, RegisterSchema);

  const existingCredential = await db.credential.findFirst({ where: { userAid: accountId } });
  if (existingCredential && !appendMode) {
    throwBusinessError(
      "Already registered. Please login and add new device from settings.",
      "ALREADY_REGISTERED",
      403,
    );
  }

  const user = await db.user.findUnique({ where: { accountId } });
  if (!user) {
    throwBusinessError("Account not found", "ACCOUNT_NOT_FOUND", 404);
  }

  const expectedChallenge = await getChallenge(user.accountId);
  await clearChallenge(user.accountId);

  if (!expectedChallenge) {
    throwBusinessError("Challenge expired or missing", "CHALLENGE_EXPIRED", 400);
  }

  const securityConfig = getSecurityConfig();
  const verification = await verifyRegistrationResponse({
    response: credential as any, // Type assertion for FIDO2 credential structure
    expectedRPID: securityConfig.rpId,
    expectedOrigin: securityConfig.origin,
    expectedChallenge,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throwBusinessError("Registration failed", "REGISTRATION_VERIFICATION_FAILED", 400);
  }

  const { id, publicKey, counter } = verification.registrationInfo.credential;

  // Encrypt the public key before storing
  const publicKeyBase64 = base64url.encode(Buffer.from(publicKey));
  const encryptedPublicKey = encryptField(publicKeyBase64, "Credential", "publicKey");

  await db.credential.create({
    data: {
      credentialId: id,
      userAid: accountId,
      publicKey: encryptedPublicKey,
      counter,
    },
  });

  return NextResponse.json({ verified: true });
}

// Apply middlewares: unified error handling + rate limiting + security headers
export const POST = composeFidoAPI(
  strictRateLimiter,
  withErrorHandler,
  withFidoSecurityHeaders,
)(handleRegister);

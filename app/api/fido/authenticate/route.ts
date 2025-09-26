/**
 * FIDO2 Authentication API - WebAuthn credential verification endpoint
 * Verifies FIDO2 authentication responses and issues JWT tokens for authenticated users
 */
import base64url from "base64url";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getChallenge, clearChallenge } from "@/lib/feature/fido/challenge-store";
import { getSecurityConfig } from "@/lib/utils/env-validation";
import { validateRequestBody, AccountIdSchema } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withFidoSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { composeFidoAPI } from "@/lib/middleware/middleware-compose";
import { TIMEOUT, LIMITS } from "@/config";
import { decryptField } from "@/lib/utils/field-encryption";
import { z } from "zod";
import jwt from "jsonwebtoken";

// FIDO2 authentication credential schema
const AuthCredentialSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  type: z.literal("public-key"),
  clientExtensionResults: z.object({}).optional(),
});

const AuthenticateSchema = z.object({
  accountId: AccountIdSchema,
  credential: AuthCredentialSchema,
  service: z.string().min(LIMITS.SERVICE_NAME.MIN).max(LIMITS.SERVICE_NAME.MAX),
});

// Core handler function
async function handleAuthenticate(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { accountId, credential, service } = await validateRequestBody(req, AuthenticateSchema);

  const account = await db.user.findUnique({
    where: { accountId },
    include: { credentials: true },
  });
  if (!account) {
    throwBusinessError("Account not found", "ACCOUNT_NOT_FOUND", 404);
  }

  const expectedChallenge = await getChallenge(account.accountId);
  await clearChallenge(account.accountId);

  if (!expectedChallenge) {
    throwBusinessError("Challenge expired or missing", "CHALLENGE_EXPIRED", 400);
  }

  const storedCred = account.credentials.find((cred) => cred.credentialId === credential.id);
  if (!storedCred) {
    throwBusinessError("Credential not found", "CREDENTIAL_NOT_FOUND", 400);
  }

  const securityConfig = getSecurityConfig();
  // Decrypt the stored public key before use
  const decryptedPublicKey = decryptField(storedCred.publicKey, "Credential", "publicKey");

  const verification = await verifyAuthenticationResponse({
    response: credential as any, // Type assertion for FIDO2 credential structure
    expectedRPID: securityConfig.rpId,
    expectedOrigin: securityConfig.origin,
    expectedChallenge: expectedChallenge,
    credential: {
      id: storedCred.credentialId,
      publicKey: new Uint8Array(base64url.toBuffer(decryptedPublicKey)),
      counter: storedCred.counter,
    },
  });

  if (!verification.verified || !verification.authenticationInfo) {
    throwBusinessError("Authentication failed", "AUTH_VERIFICATION_FAILED", 401);
  }

  await db.credential.update({
    where: { credentialId: storedCred.credentialId },
    data: { counter: verification.authenticationInfo.newCounter },
  });

  const userWithMultisig = await db.user.findUnique({
    where: { accountId: account.accountId },
    include: { multisigSigners: true },
  });
  const isNewUser = userWithMultisig?.multisigSigners.length === 0;

  const token = jwt.sign(
    {
      accountId: account.accountId,
      authService: service,
      new: isNewUser,
    },
    securityConfig.jwtSecret,
    { expiresIn: TIMEOUT.JWT_TOKEN },
  );

  return NextResponse.json({ verified: true, token, isNewUser });
}

// Apply middlewares using FIDO composition pattern
export const POST = composeFidoAPI(
  strictRateLimiter,
  withErrorHandler,
  withFidoSecurityHeaders,
)(handleAuthenticate);
/**
 * Multi-signature Wallet Creation API - HSM-secured Bitcoin wallet setup
 * Creates M-of-N wallets with hardware security module integration
 */

import { db } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createMultisigWallet } from "@/lib/btc-multisig/wallet";
import { withAuth } from "@/lib/middleware/middleware";
import { validateRequestBody } from "@/lib/utils/input-validation";
import { strictRateLimiter } from "@/lib/utils/rate-limiter";
import { withApiSecurityHeaders } from "@/lib/middleware/security-headers";
import { withErrorHandler, throwBusinessError } from "@/lib/utils/error-handler";
import { validateParticipantWithHSM } from "@/lib/feature/participant/participant-validation";
import { composeAuthenticatedAPI } from "@/lib/middleware/middleware-compose";
import { LIMITS } from "@/config";
import { z } from "zod";

// Input validation schema
const ParticipantInputSchema = z.object({
  userId: z.string().min(LIMITS.ACCOUNT_ID.MIN).max(LIMITS.ACCOUNT_ID.MAX),
  passphraseHash: z.string().regex(/^[a-f0-9]{64}$/i, "Must be 64-character hex string"),
});

const CreateWalletSchema = z.object({
  m: z.number().int().min(LIMITS.REQUIRED_SIGNATURES.MIN).max(LIMITS.REQUIRED_SIGNATURES.MAX),
  n: z.number().int().min(LIMITS.MULTISIG_COUNT.MIN).max(LIMITS.MULTISIG_COUNT.MAX),
  name: z.string().min(LIMITS.WALLET_NAME.MIN).max(LIMITS.WALLET_NAME.MAX),
  participants: z.array(ParticipantInputSchema),
  hsmVault: z.string().url(),
});

// Extended participant type for internal processing
interface ParticipantWithPublicKey {
  userId: string;
  passphraseHash: string;
  publicKey: string;
}

// Core handler function
async function handleCreateWallet(req: NextRequest): Promise<NextResponse> {
  // Input validation using validateRequestBody (errors automatically handled by withErrorHandler)
  const { m, n, name, participants, hsmVault } = await validateRequestBody(req, CreateWalletSchema);

  // Business logic validation
  if (participants.length !== n) {
    throwBusinessError("Invalid participants data", "INVALID_PARTICIPANTS", 400);
  }

  if (m > n) {
    throwBusinessError(
      "Required signatures M must be less than or equal to total participants N",
      "INVALID_THRESHOLD",
      400,
    );
  }

  const blockchain = "BTC"; // NOTE: blockchain is fixed to BTC for this API

  // Transform participants to include public keys using unified HSM connection
  const participantsWithKeys: ParticipantWithPublicKey[] = [];

  // Simplify participant validation using participant validation functions
  // This shows how to validate multiple participants during wallet creation
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];

    // Use unified validation function to ensure each participant has valid credentials
    const credentials = await validateParticipantWithHSM(
      participant.userId,
      hsmVault,
      participant.passphraseHash,
      "wallet creation",
    );

    participantsWithKeys.push({
      userId: participant.userId,
      passphraseHash: participant.passphraseHash,
      publicKey: credentials.hsmPublicKey!,
    });
  }

  const createResponse = await createMultisigWallet({
    m,
    n,
    name,
    participants: participantsWithKeys.map(p => ({ publicKey: p.publicKey, userId: p.userId })),
  });

  const existingWallet = await db.multisigWallet.findUnique({
    where: { walletId: createResponse.walletId },
  });
  if (existingWallet) {
    throwBusinessError("Wallet already exists. Change signer or passphrase.", "WALLET_EXISTS", 409);
  }

  const multisigWallet = await db.multisigWallet.create({
    data: {
      name,
      walletId: createResponse.walletId,
      address: createResponse.address,
      hsmVault,
      blockchain,
      totalParticipants: n,
      threshold: m,
    },
  });

  await Promise.all(
    participantsWithKeys.map(async (participant) => {
      await db.multisigParticipant.create({
        data: {
          multisigWalletId: multisigWallet.id,
          userAid: participant.userId,
        },
      });
    }),
  );

  return NextResponse.json(createResponse);
}

// Apply security middlewares: unified error handling + auth + rate limiting + security headers
export const POST = composeAuthenticatedAPI(
  strictRateLimiter,
  withErrorHandler,
  withApiSecurityHeaders,
  withAuth,
)(handleCreateWallet);

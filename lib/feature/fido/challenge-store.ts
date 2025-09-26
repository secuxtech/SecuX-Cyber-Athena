/**
 * Challenge Store Module - FIDO2 challenge management with encryption
 * Securely stores and manages temporary challenges for WebAuthn authentication
 */

import { db } from "@/lib/db/prisma";
import { encryptField, decryptField } from "@/lib/utils/field-encryption";
import { TIMEOUT } from "@/config";

export async function setChallenge(userId: string, challenge: string) {
  const key = userId.trim();

  // Encrypt the challenge before storing
  const encryptedChallenge = encryptField(challenge, "Challenge", "challenge");

  await db.challenge.upsert({
    where: { accountId: key },
    update: { challenge: encryptedChallenge, createdAt: new Date() },
    create: { accountId: key, challenge: encryptedChallenge },
  });
}

export async function getChallenge(userId: string): Promise<string | undefined> {
  const key = userId.trim();
  const record = await db.challenge.findUnique({
    where: {
      accountId: key,
      createdAt: { gte: new Date(Date.now() - TIMEOUT.CHALLENGE) },
    },
  });

  // Decrypt the challenge before returning
  if (record?.challenge) {
    return decryptField(record.challenge, "Challenge", "challenge");
  }
  return undefined;
}

export async function clearChallenge(userId: string) {
  const key = userId.trim();
  await db.challenge.delete({ where: { accountId: key } }).catch(() => {});
}

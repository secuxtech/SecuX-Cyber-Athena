/**
 * Bitcoin Multi-signature Wallet Module - Wallet creation and management
 * Handles multisig wallet setup, signature collection, and balance tracking
 */

import { SecuxPsbt } from "@secux/app-btc/lib/psbt";
import { HexString, Transaction, TransactionStatus, Wallet } from "./interface";
import { kvStore, generateWalletId, config } from "./utils";
import * as utils from "./utils";

export async function createMultisigWallet(params: {
  m: number,
  n: number,
  name?: string,
  participants: Array<{ publicKey: HexString, userId?: string }>
}) {
  const { m, n, name, participants } = params;

  if (!Number.isInteger(m) || !Number.isInteger(n)) {
    throw new Error("m and n must be integers");
  }
  if (m > n || m <= 0 || n <= 0) {
    throw new Error("Invalid m-of-n values. m must be <= n, and both must be > 0");
  }
  if (participants.length !== n) {
    throw new Error(`Expected ${n} participants, but got ${participants.length}`);
  }

  const publicKeys = participants.map(p => p.publicKey);
  if (new Set(publicKeys).size !== n) {
    throw new Error("Duplicate public keys found among participants.");
  }

  const publicKeyHash = utils.customHash(Buffer.from(participants.map(p => p.publicKey).join("-")));
  const walletId = await generateWalletId(publicKeyHash);

  // Use SecuxPsbt for address/redeem script generation
  const psbt = new SecuxPsbt(config.network);
  const { address, redeemScript } = psbt.initializeMultiSig(m, publicKeys);

  const walletData: Wallet = {
    walletId,
    address,
    redeemScript,
    m,
    n,
    name: name || "",
    creationTime: new Date().toISOString(),
    participants: participants.map(p => ({ publicKey: p.publicKey, userId: p.userId || "" })),
  };

  await kvStore.put(`wallet:${walletId}`, walletData);

  return {
    walletId: walletData.walletId,
    address: walletData.address,
    redeemScript: walletData.redeemScript,
    m: walletData.m,
    n: walletData.n,
    name: walletData.name,
    creationTime: walletData.creationTime,
  };
}

export async function submitSignature(transactionId: string, params: {
  publicKey: HexString,
  signatures: Array<HexString>,
}) {
  const { publicKey, signatures } = params;

  if (typeof publicKey !== "string" || publicKey.length === 0) {
    throw new Error("publicKey MUST be a non-empty string.");
  }

  const txKey = `tx:${transactionId}`;
  const transaction = await kvStore.get(txKey) as Transaction;

  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status !== TransactionStatus.pending) {
    throw new Error(`Transaction is not in pending_signatures state. Current: ${transaction.status}`);
  }

  const walletData = await kvStore.get(`wallet:${transaction.walletId}`);
  if (!walletData) {
    throw new Error(`Wallet not found: ${transaction.walletId}`);
  }

  const psbt = SecuxPsbt.FromBuffer(Buffer.from(transaction.psbt, "hex"), config.network);

  if (!transaction.signatures) {
    transaction.signatures = {};
  }

  const existingSig = Object.keys(transaction.signatures).find(key => key === publicKey);
  if (existingSig) {
    throw new Error(`User with public key ${publicKey} has already signed this transaction.`);
  }

  for (const [i, signature] of signatures.entries()) {
    psbt.submitSignature(i, {
      publickey: Buffer.from(publicKey, "hex"),
      signature: Buffer.from(signature, "hex"),
    });
  }

  transaction.signatures[publicKey] = signatures;
  transaction.signaturesReceived = Object.keys(transaction.signatures).length;

  transaction.psbt = psbt.toBuffer().toString("hex");
  if (transaction.signaturesReceived >= transaction.requiredSignatures) {
    transaction.status = TransactionStatus.allsigned;
    transaction.signedTransaction = psbt
      .finalizeAllInputs()
      .extractTransaction()
      .toHex();
  }

  await kvStore.put(txKey, transaction);

  return {
    transactionId: transaction.transactionId,
    status: transaction.status,
    signaturesReceived: transaction.signaturesReceived,
    requiredSignatures: transaction.requiredSignatures - transaction.signaturesReceived,
  };
}

export async function getWalletDetails(walletId: string) {
  const walletData = await kvStore.get(`wallet:${walletId}`);
  return walletData ? walletData as Wallet : null;
}

export async function getWalletBalance(walletId: string) {
  const walletData = await kvStore.get(`wallet:${walletId}`) as Wallet;
  if (!walletData) {
    throw new Error(`Wallet not found: ${walletId}`);
  }

  try {
    const response = await fetch(config.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(process.env.BTC_RPC_SECRET!).toString("base64")}`,
      },
      body: JSON.stringify({
        method: "scantxoutset",
        params: ["start", [`addr(${walletData.address})`]],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    const result = await response.json();
    const confirmedBalance = result.result.unspents.reduce((sum: number, utxo: { amount: number }) => sum + utxo.amount, 0);

    return {
      walletId,
      address: walletData.address,
      confirmedBalance,
    };

  } catch (error: any) {
    console.error("Error getting balance from RPC:", error);
    throw new Error(error.message);
  }
}

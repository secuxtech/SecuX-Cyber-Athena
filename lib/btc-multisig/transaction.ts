/**
 * Bitcoin Multi-signature Transaction Module - Transaction lifecycle management
 * Handles transaction creation, signing, broadcasting, and status tracking
 */

import { SecuxPsbt } from "@secux/app-btc/lib/psbt";
import { sha256 } from "hash.js";
import * as utils from "./utils";
import { config, customHash, kvStore, dbGetKeysWithPrefix, getUTXOsBlockbook } from "./utils";
import { Wallet, TransactionStatus, Transaction } from "./interface";

export async function initiateTransaction(walletId: string, params: {
	recipientAddress: string,
	amount: number,
	feeRate?: number,
	note?: string,
}) {
  const { recipientAddress, amount, feeRate = 1.0, note } = params;

  if (typeof recipientAddress !== "string" || recipientAddress.length === 0) {
    throw new Error("recipientAddress MUST be a non-empty string.");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new Error("amount MUST be a positive number.");
  }
  if (feeRate != null && (typeof feeRate !== "number" || feeRate <= 0)) {
    throw new Error("feeRate, if provided, MUST be a positive number.");
  }

  const walletData = await kvStore.get(`wallet:${walletId}`) as Wallet;
  if (!walletData) {
    throw new Error(`Wallet not found: ${walletId}`);
  }

  const requiredSignatures = walletData.m;

  // 1. Get UTXOs for the wallet address
  const utxos = await getUTXOsBlockbook(walletData.address);

  // If no unconfirmed UTXOs, you might:
  if (utxos.length === 0) {
    throw new Error("No confirmed UTXOs available. Cannot create a transaction.");
  }

  // 2. Create a SecuxPsbt instance
  const psbt = new SecuxPsbt(config.network);
  psbt.initializeMultiSig(walletData.m, walletData.participants.map(p => p.publicKey));

  // 3. Add inputs to the PSBT
  let totalInputAmount = 0, inputCount = 0;
  for (const utxo of utxos) {
    psbt.addMultiSigInput(utxo);
    totalInputAmount += utxo.satoshis;
    inputCount++;
  }

  // 4. Calculate the transaction fee
  const vSize = await utils.estimateVirtualSize(walletId, recipientAddress);
  const estimatedFee = Math.ceil(vSize * feeRate);

  // 5. Check if we have enough funds
  if (totalInputAmount < amount + estimatedFee) {
    throw new Error(`Insufficient funds.  Available: ${totalInputAmount}, Required (amount + fee): ${amount + estimatedFee}`);
  }

  // 6. Add the recipient output
  psbt.AddOutput({
    address: recipientAddress,
    satoshis: amount,
  });

  // 7. Add a change output (if necessary)
  const changeAmount = totalInputAmount - amount - estimatedFee;
  if (changeAmount > 0) {
    psbt.AddOutput({
      address: walletData.address, // Send change back to the multisig wallet
      satoshis: changeAmount,
    });
  }

  const psbtBuffer = psbt.toBuffer();
  const transactionId = customHash(psbtBuffer);

  // 8. Store PSBT
  const transaction: Transaction = {
    transactionId,
    walletId,
    recipientAddress,
    amount,
    status: TransactionStatus.pending,
    psbt: psbtBuffer.toString("hex"),
    inputCount,
    requiredSignatures,
    signatures: {},
    signaturesReceived: 0,
    initiatedTime: new Date().toISOString(),
    note,
  };
  await kvStore.put(`tx:${transactionId}`, transaction);

  return transaction;
}

export async function getUnsignedTransaction(transactionId: string) {
  const transaction = await kvStore.get(`tx:${transactionId}`) as Transaction;
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  const psbt = SecuxPsbt.FromBuffer(Buffer.from(transaction.psbt, "hex"), config.network);
  const unsignedTransactions: Array<string> = [];
  for (let i = 0; i < transaction.inputCount; i++) {
    const unsignedTransaction = psbt.getDataForSig(i);
    const hash = sha256().update(
      sha256().update(unsignedTransaction).digest(),
    ).digest();
    unsignedTransactions.push(Buffer.from(hash).toString("hex"));
  }

  return {
    transactionId: transaction.transactionId,
    unsignedTransactions,
  };
}

export async function broadcastTransaction(transactionId: string) {
  const transaction = await kvStore.get(`tx:${transactionId}`) as Transaction;
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status !== TransactionStatus.allsigned) {
    throw new Error(`Transaction is not complete. Current status: ${transaction.status}`);
  }

  const txHash = await utils.broadcastTransaction(transaction.signedTransaction!);
  transaction.txHash = txHash;
  transaction.status = TransactionStatus.broadcasted;
  transaction.broadcastTime = new Date().toISOString();

  await kvStore.put(`tx:${transactionId}`, transaction);

  return {
    transactionId: transaction.transactionId,
    status: transaction.status,
    txHash,
    broadcastTime: transaction.broadcastTime,
    message: "Transaction broadcast successfully",
  };
}

export async function getTransactionStatus(transactionId: string) {
  const transaction = await kvStore.get(`tx:${transactionId}`) as Transaction;
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status === "broadcasted" && transaction.txHash) {
    try {
      const txDetails = await utils.getTransactionStatus(transaction.txHash);

      if (txDetails && txDetails.confirmations > 0) {
        transaction.status = TransactionStatus.finished;
        await kvStore.put(`tx:${transactionId}`, transaction);
      }
    } catch (error) {
      // Handle errors (e.g., transaction not found on the blockchain)
      console.error("Error fetching transaction details:", error);
      //  Don't throw here; return the existing transaction data.
    }
  }

  return {
    transactionId: transaction.transactionId,
    walletId: transaction.walletId,
    status: transaction.status,
    initiatedTime: transaction.initiatedTime,
    txHash: transaction.txHash,
    broadcastTime: transaction.broadcastTime,
    requiredSignatures: transaction.requiredSignatures,
    signaturesReceived: transaction.signaturesReceived,
  };
}

export async function cancelTransaction(transactionId: string) {
  const transaction = await kvStore.get(`tx:${transactionId}`) as Transaction;
  if (!transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status !== TransactionStatus.pending) {
    throw new Error(`Transaction can only be cancelled if status is pending_signatures. Current: ${transaction.status}`);
  }

  transaction.status = TransactionStatus.cancelled;
  await kvStore.put(`tx:${transactionId}`, transaction);

  return {
    transactionId: transaction.transactionId,
    status: transaction.status,
  };
}

export async function getPendingTransactions(walletId: string) {
  const walletData = await kvStore.get(`wallet:${walletId}`) as Wallet;
  if (!walletData) {
    throw new Error(`Wallet not found: ${walletId}`);
  }
  try {
    const txRecords = await dbGetKeysWithPrefix("tx:");

    const transactions = txRecords
      .map(record => record.value as Transaction)
      .filter(tx => tx.walletId === walletId && tx.status === TransactionStatus.pending);

    return {
      walletId,
      address: walletData.address,
      transactions: transactions.map(tx => ({
        transactionId: tx.transactionId,
        recipientAddress: tx.recipientAddress,
        amount: tx.amount,
        status: tx.status,
        requiredSignatures: tx.requiredSignatures,
        signaturesReceived: tx.signaturesReceived,
        initiatedTime: tx.initiatedTime,
      })),
    };
  } catch (error) {
    console.error("Error fetching pending transactions:", error);
    throw error;
  }
}

export async function getTransactionHistory(walletId: string, page = 1) {
  const walletData = await kvStore.get(`wallet:${walletId}`) as Wallet;
  if (!walletData) {
    throw new Error(`Wallet not found: ${walletId}`);
  }

  try {
    const txRecords = await dbGetKeysWithPrefix("tx:");

    const transactions = txRecords
      .map(record => record.value as Transaction)
      .filter(tx => tx.walletId === walletId && tx.status !== TransactionStatus.pending)
      .sort((a, b) => new Date(b.initiatedTime).getTime() - new Date(a.initiatedTime).getTime())
      .slice((page - 1) * 10, page * 10);

    return {
      walletId,
      address: walletData.address,
      transactions: transactions.map(tx => ({
        transactionId: tx.transactionId,
        recipientAddress: tx.recipientAddress,
        amount: tx.amount,
        status: tx.status,
        requiredSignatures: tx.requiredSignatures,
        signaturesReceived: tx.signaturesReceived,
        initiatedTime: tx.initiatedTime,
        broadcastTime: tx.broadcastTime || "",
        txHash: tx.txHash || "",
        note: tx.note || "",
      })),
      pagination: {
        page,
        pageSize: 10,
        totalCount: transactions.length,
      },
    };
  } catch (error: any) {
    console.error("Error getting history:", error);
    throw new Error(error.message);
  }
}

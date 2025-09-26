/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios";
import { db } from "@/lib/db/prisma";
import { sha256 } from "hash.js";
import { CoinType, ScriptType, SecuxBTC } from "@secux/app-btc";
import { Base58 } from "@secux/utility/lib/bs58";
import { HexString, Wallet } from "./interface";
import { getByteCount } from "./getByteCount";

export const config = {
  network: CoinType.REGTEST, // NOTE: Use CoinType.BITCOIN for mainnet
  rpcUrl: process.env.BTC_RPC_URL || "https://bitcoin-rpc.publicnode.com",
  blockbookUrl: process.env.BTC_BOOK_URL || "https://btc1.trezor.io",
};

export const kvStore = {
  get: async (key: string) => {
    try {
      const result = await db.keyValue.findUnique({
        where: { key },
      });
      if (!result) return null;
      return result.value;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  put: async (key: string, value: any) => {
    try {
      await db.keyValue.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  del: async (key: string) => {
    try {
      await db.keyValue.delete({
        where: { key },
      });
    } catch (error) {
      // Ignore non-existent key
    }
  },
  close: async () => {
    await db.$disconnect();
  },
};

// Helper function to query keys with prefix using Prisma
export async function dbGetKeysWithPrefix(prefix: string): Promise<Array<{ key: string; value: any }>> {
  try {
    const result = await db.keyValue.findMany({
      where: {
        key: {
          startsWith: prefix,
        },
      },
    });
    return result.map((record: any) => ({
      key: record.key,
      value: record.value,
    }));
  } catch (error) {
    console.error("Error querying keys with prefix:", error);
    throw error;
  }
}

async function bitcoinRpcCall(method: string, params: any[]) {
  const response = await fetch(config.rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(process.env.BTC_RPC_SECRET!).toString("base64")}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1, // Can be any unique ID
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bitcoin RPC error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Bitcoin RPC error: ${data.error.message}`);
  }

  return data.result;
}

async function blockbookApiCall(path: string) {
  const response = await fetch(`${config.blockbookUrl}/api/v2/${path}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Blockbook API error: ${response.status} - ${errorText}`);
  }
  return await response.json();
}

export async function broadcastTransaction(signedTransaction: HexString) {
  const response = await fetch(config.rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(process.env.BTC_RPC_SECRET!).toString("base64")}`,
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: "sendrawtransaction",
      method: "sendrawtransaction",
      params: [signedTransaction],
    }),
  });

  if (!response.ok) {
    throw new Error(`❌ Failed to broadcast transaction: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.result) {
    throw new Error("❌ No TXID returned from broadcast.");
  }

  const txid = result.result;
  console.log("✅ Transaction broadcasted! TX Hash:", txid.trim());
  return txid;
}

export async function getTransactionStatus(txHash: HexString) {
  try {
    // Fetch transaction details from the blockchain
    const txDetails = await bitcoinRpcCall("getrawtransaction", [txHash, true]);
    return txDetails;
  } catch (error) {
    // Handle errors (e.g., transaction not found on the blockchain)
    console.error("Error fetching transaction details:", error);
  }
}

export async function getFeeRateRecommendations() {
  try {
    const estimatesmartfee = await bitcoinRpcCall("estimatesmartfee", [6]); // Estimate fee for 6 blocks confirmation
    // estimatesmartfee.feerate is in BTC/kB, convert to sat/vbyte
    const feeRateSatVByte = Math.ceil(estimatesmartfee.feerate * 100000000 / 1000);
    return {
      fastest: feeRateSatVByte * 2,     // Example values
      normal: feeRateSatVByte,
      economical: Math.max(1, Math.floor(feeRateSatVByte * 0.8)), // Ensure at least 1 sat/vbyte
      unit: "sat/vbyte",
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error to get fee:", error);
    throw error;
  }
}

export async function healthCheck() {
  try {
    const blockchainInfo = await bitcoinRpcCall("getblockchaininfo", []);
    if (blockchainInfo && blockchainInfo.blocks) { // Basic check for a valid response
      return {
        status: "ok",
        blocks: blockchainInfo.blocks, //  Include blockchain height
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: "error",
        message: "Invalid response from Bitcoin RPC",
        timestamp: new Date().toISOString(),
      };
    }

  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ==================================================

async function getUTXOs(address: string) {
  const rpcUser = "secux";
  const rpcPass = "4296";
  const rpcUrl = config.rpcUrl;

  const requestData = {
    jsonrpc: "1.0",
    id: "scantxoutset",
    method: "scantxoutset",
    params: ["start", [`addr(${address})`]],
  };

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${rpcUser}:${rpcPass}`).toString("base64")}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch UTXOs: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.result;
    if (!result.success || result.unspents.length === 0) {
      throw new Error("❌ No usable UTXOs found.");
    }

    return result.unspents;

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching UTXOs:", error.message);
    } else {
      console.error("Error fetching UTXOs:", error);
    }
    throw error;
  }
}

export async function getUTXOsBlockbook(address: string) {
  try {
    const data = (await getUTXOs(address)).filter((u: { amount: number }) => u.amount > 0.02);
    const utxos = [];
    for (const utxo of data) {
      utxos.push({
        hash: utxo.txid,
        vout: utxo.vout,
        satoshis: Math.round(Number(utxo.amount) * 100000000),
      });
    }

    return utxos;
  }
  catch (error) {
    console.error("Error fetching UTXOs from Blockbook:", error);
    throw error;
  }
}

export async function getAddressBalanceBlockbook(address: string) {
  try {
    const data = await blockbookApiCall(`address/${address}?details=basic`);
    return {
      confirmedBalance: data.balance,
      unconfirmedBalance: data.unconfirmedBalance,
    };
  } catch (error) {
    console.error("Error to get balance from Blockbook", error);
    throw error;
  }
}

export async function getAddressTransactions(address: string, page: number) {
  try {
    const rpcUser = "secux";
    const rpcPass = "4296";
    const rpcUrl = `${config.rpcUrl}/wallet/test_wallet`;

    const requestData = {
      jsonrpc: "1.0",
      id: "curltest",
      method: "listtransactions",
      params: ["*", 10, 0],
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${rpcUser}:${rpcPass}`).toString("base64")}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Error from RPC: ${data.error.message}`);
    }

    const transactions = data.result.map((tx: any) => {
      return {
        txHash: tx.txid,
        amount: tx.amount,
        fee: tx.fee || 0,
        status: tx.confirmations > 0 ? "confirmed" : "unconfirmed",
        confirmationTime: tx.confirmations > 0 && tx.blocktime ? new Date(tx.blocktime * 1000).toISOString() : undefined,
        confirmations: tx.confirmations,
        direction: tx.category === "send" ? "sent" : "received",
      };
    });

    return transactions;
  } catch (error) {
    console.error(`Error fetching transactions for address ${address}:`, error);
    throw error;
  }
}

export async function estimateVirtualSize(walletId: string, recipientAddress: string) {
  const walletData = await kvStore.get(`wallet:${walletId}`) as Wallet;
  if (!walletData) {
    throw new Error(`Wallet not found: ${walletId}`);
  }

  let scriptType = "";
  switch (SecuxBTC.getScriptType(recipientAddress, config.network)) {
    case ScriptType.P2PKH:
      scriptType = "P2PKH";
      break;
    case ScriptType.P2SH:
      scriptType = "P2SH";
      break;
    case ScriptType.P2WPKH:
      scriptType = "P2WPKH";
      break;
    case ScriptType.P2WSH:
      scriptType = "P2WSH";
      break;
    case ScriptType.P2TR:
      scriptType = "P2TR";
      break;

    default:
      throw Error("unsupported address");
  }

  const inputCount = (await getUTXOsBlockbook(walletData.address)).length;
  const outputs = {
    [scriptType]: 1,
  };
  if (outputs["P2WSH"]) {
    outputs["P2WSH"] = 2;
  }
  else {
    outputs["P2WSH"] = 1;
  }

  const vSize = getByteCount(
    { [`MULTISIG-P2WSH:${walletData.m}-${walletData.n}`]: inputCount },
    outputs,
  );
  return vSize;
}

export async function generateWalletId(prefix: string) {
  const key = `_id:${prefix}`;
  try {
    // NOTE: derive same wallet ID with same public keys
    const walletId = customHash(Buffer.from(`${prefix}#secux_btc_multisig`));
    await kvStore.put(key, { walletId });
    return walletId;
  } catch (error: any) {
    throw error;
  }
}

export function customHash(data: Buffer) {
  const hex = data.toString("hex");
  const hash = sha256().update(hex).digest("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const encoded = Base58.encode(hashBuffer);

  if (!encoded || typeof encoded !== "string") {
    throw new Error(`Failed to encode hash with Base58. Got: ${typeof encoded}, value: ${encoded}`);
  }

  return encoded;
}

/**
 * @deprecated Use signWithHSM from @/lib/hsm-connection instead
 * This legacy function is kept for backward compatibility
 */
export async function signWithHSM(hsmVault: string, hash: string, label: string, id: string) {
  // Import the new unified function
  const { signWithHSM: unifiedSignWithHSM } = await import("@/lib/feature/hsm/hsm-connection");

  // Use the new unified function with enhanced error handling
  return unifiedSignWithHSM(hsmVault, hash, label, id);
}
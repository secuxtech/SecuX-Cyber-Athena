/**
 * Common Utilities Module - Shared helper functions and types
 * Provides authentication, data formatting, and Bitcoin wallet interfaces
 */

// BTC Multisig API types and interfaces
export interface CreateWalletRequest {
  m: number;
  n: number;
  name?: string;
  participants: Array<{
    publicKey: string;
    userId?: string;
  }>;
}

export interface CreateWalletResponse {
  walletId: string;
  address: string;
  redeemScript: string;
  m: number;
  n: number;
  name: string;
  creationTime: string;
}

export interface InitiateTransactionRequest {
  walletId: string;
  recipientAddress: string;
  amount: number;
  feeRate?: number;
  note?: string;
}

export interface InitiateTransactionResponse {
  transactionId: string;
  walletId: string;
  recipientAddress: string;
  amount: number;
  status: string;
  psbt: string;
  inputCount: number;
  requiredSignatures: number;
  signatures: Record<string, string[]>;
  signaturesReceived: number;
  initiatedTime: string;
  note?: string;
}

export interface SubmitSignatureRequest {
  transactionId: string;
  publicKey: string;
  signatures: string[];
}

export interface SubmitSignatureResponse {
  transactionId: string;
  status: string;
  signaturesReceived: number;
  requiredSignatures: number;
}

export interface BroadcastTransactionRequest {
  transactionId: string;
}

export interface BroadcastTransactionResponse {
  transactionId: string;
  status: string;
  txHash: string;
  broadcastTime: string;
  message: string;
}

export interface CancelTransactionRequest {
  transactionId: string;
}

export interface CancelTransactionResponse {
  transactionId: string;
  status: string;
}

export interface TransactionStatusResponse {
  transactionId: string;
  walletId: string;
  status: string;
  initiatedTime: string;
  txHash?: string;
  broadcastTime?: string;
  requiredSignatures: number;
  signaturesReceived: number;
}

export interface UnsignedTransactionResponse {
  transactionId: string;
  unsignedTransactions: string[];
}

export interface PendingTransactionsResponse {
  walletId: string;
  pendingTransactions: Array<{
    transactionId: string;
    recipientAddress: string;
    amount: number;
    status: string;
    requiredSignatures: number;
    signaturesReceived: number;
    initiatedTime: string;
  }>;
}

export interface WalletBalanceResponse {
  walletId: string;
  address: string;
  confirmedBalance: number;
}

export interface TransactionHistoryResponse {
  walletId: string;
  address: string;
  transactions: Array<{
    note: string;
    amount: number;
    status: string;
    txHash: string;
    walletId: string;
    broadcastTime: string;
    initiatedTime: string;
    transactionId: string;
    recipientAddress: string;
    requiredSignatures: number;
    signaturesReceived: number;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
}

export interface FeeRecommendationsResponse {
  fastest: number;
  normal: number;
  economical: number;
  unit: string;
  lastUpdated: string;
}

export interface HealthCheckResponse {
  status: "ok" | "error";
  blocks?: number;
  message?: string;
  timestamp: string;
}

export interface EstimateVsizeResponse {
  vsize: number;
}

export interface ApiErrorResponse {
  error: string;
}

// FIDO API types and interfaces
export interface FidoRegisterOptionsRequest {
  accountId: string;
  appendMode?: boolean;
}

export interface FidoRegisterOptionsResponse {
  requestOptions?: any;
  challenge?: string;
  [key: string]: any;
}

export interface FidoRegisterRequest {
  accountId: string;
  credential: any;
  appendMode?: boolean;
}

export interface FidoRegisterResponse {
  verified: boolean;
  [key: string]: any;
}

export interface FidoAuthenticateOptionsRequest {
  accountId: string;
}

export interface FidoAuthenticateOptionsResponse {
  requestOptions?: any;
  challenge?: string;
  [key: string]: any;
}

export interface FidoAuthenticateRequest {
  accountId: string;
  credential: any;
  service: string;
}

export interface FidoAuthenticateResponse {
  verified: boolean;
  token?: string;
  isNewUser?: boolean;
  [key: string]: any;
}

// User API types and interfaces
export interface UserResponse {
  accountId: string;
  credentialCount: number;
  error?: string;
  [key: string]: any;
}

export interface UserHsmVaultResponse {
  hsmVaults: Array<{
    hsmVault: string;
    walletId: string;
    id: number;
    name: string;
  }>;
}

// Transaction API types and interfaces
export interface TransactionRequest {
  initiatorId: string;
  operation: string;
  asset: string;
  amount: string;
  hsmVault: string;
  walletId: string;
  recipient: string;
  approvalCount: number;
  requiredCount: number;
  transactionId: string;
}

export interface TransactionResponse {
  id: number;
  initiatorId: string;
  operation: string;
  asset: string;
  amount: string;
  hsmVault: string;
  walletId: string;
  recipient: string;
  status: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalResponse {
  txSN: number;
  accountId: string;
  operation: string;
  asset: string;
  amount: string;
  recipient: string;
  status: string;
  createdAt: string;
}

// HSM Wallet API types and interfaces
export interface HsmWalletCreateRequest {
  m: number;
  n: number;
  name: string;
  hsmVault: string;
  participants: Array<{
    userId: string;
    passphraseHash: string;
  }>;
}

export interface HsmWalletCreateResponse {
  walletId: string;
  address: string;
  [key: string]: any;
}

export interface HsmWalletInitiateTransactionRequest {
  initiatorId: string;
  operation: string;
  asset: string;
  amount: string;
  hsmVault: string;
  walletId: string;
  recipient: string;
  passphraseHash: string;
}

export interface HsmWalletInitiateTransactionResponse {
  signaturesReceived: number;
  requiredSignatures: number;
  transactionId: string;
  [key: string]: any;
}

export interface HsmWalletSubmitSignatureRequest {
  id: number;
  initiatorId: string;
  approverId: string;
  hsmVault: string;
  walletId: string;
  passphraseHash: string;
}

export interface HsmWalletSubmitSignatureResponse {
  [key: string]: any;
}

export interface HsmWalletCancelTransactionRequest {
  id: number;
  initiatorId: string;
  transactionId: string;
  hsmVault: string;
}

export interface HsmWalletCancelTransactionResponse {
  [key: string]: any;
}

export interface BtcBalanceResponse {
  balanceList: BalanceItem[];
}

// API Client Interface
export interface BtcMultisigApiClient {
  // GET methods
  healthCheck(): Promise<HealthCheckResponse>;
  getFeeRecommendations(): Promise<FeeRecommendationsResponse>;
  estimateVsize(walletId: string, recipientAddress: string): Promise<EstimateVsizeResponse>;
  getUnsignedTransaction(transactionId: string): Promise<UnsignedTransactionResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse>;
  getPendingTransactions(walletId: string): Promise<PendingTransactionsResponse>;
  getWalletDetails(walletId: string): Promise<CreateWalletResponse>;
  getWalletBalance(walletId: string): Promise<WalletBalanceResponse>;
  getTransactionHistory(walletId: string, page?: number): Promise<TransactionHistoryResponse>;

  // POST methods
  createWallet(data: CreateWalletRequest): Promise<CreateWalletResponse>;
  initiateTransaction(data: InitiateTransactionRequest): Promise<InitiateTransactionResponse>;
  submitSignature(data: SubmitSignatureRequest): Promise<SubmitSignatureResponse>;
  broadcastTransaction(data: BroadcastTransactionRequest): Promise<BroadcastTransactionResponse>;
  cancelTransaction(data: CancelTransactionRequest): Promise<CancelTransactionResponse>;
}

export type BalanceItem = {
  hsmVault: string;
  walletId: string;
  balance: number;
  address: string;
  name: string;
  participants: string[];
  creationTime: string;
};

// JWT Token utilities
export interface JWTPayload {
  accountId: string;
  authService: string;
  new: boolean;
  exp: number;
  iat: number;
}

export interface TokenInfo {
  accountId: string;
  authService: string;
  new: boolean;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1])) as JWTPayload;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

// Internal function for token parsing - used by apiClient
function parseTokenInfo(token: string): TokenInfo | null {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1])) as JWTPayload;
    return {
      accountId: decoded.accountId,
      authService: decoded.authService,
      new: decoded.new,
    };
  } catch {
    return null;
  }
}

// Public async function to get user info from secure token storage
export async function getCurrentUserInfo(): Promise<TokenInfo | null> {
  if (typeof window === "undefined") return null;

  // Dynamically import secure storage
  const { secureStorage } = await import("./secure-storage");

  const token = await secureStorage.getToken();
  if (!token) return null;

  if (isTokenExpired(token)) {
    secureStorage.clearToken();
    return null;
  }

  return parseTokenInfo(token);
}

// Error handling utilities
export function getErrorMessage(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "Unknown error";
}

export function formatErrorMessage(error: any, prefix?: string): string {
  const message = getErrorMessage(error);
  return prefix ? `${prefix}: ${message}` : message;
}
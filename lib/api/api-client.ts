// Unified API client with automatic JWT token handling
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { isTokenExpired } from "../utils/common";

// Internal token validation and cleanup
async function validateAndCleanupToken(token: string): Promise<boolean> {
  if (isTokenExpired(token)) {
    // Use new secure storage for cleanup
    if (typeof window !== "undefined") {
      const { secureStorage } = await import("../utils/secure-storage");
      secureStorage.clearToken();
    }
    return false;
  }
  return true;
}

// Automatically get JWT token using secure storage
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Use new secure storage system
  const { secureStorage } = await import("../utils/secure-storage");
  const token = await secureStorage.getToken();
  if (!token) return null;

  // Check if expired and cleanup if needed
  if (!(await validateAndCleanupToken(token))) return null;

  return token;
}

// Unified API call function
export async function apiCall(
  endpoint: string,
  options: AxiosRequestConfig = {},
  requireAuth: boolean = true,
): Promise<AxiosResponse> {
  let token = null;
  if (requireAuth) {
    token = await getAuthToken();
    if (!token) {
      throw new Error("No valid JWT token found. Please login again.");
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requireAuth && token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: AxiosRequestConfig = {
    url: endpoint,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token may be expired or invalid, clean up and redirect to login page
      if (typeof window !== "undefined") {
        const { secureStorage } = await import("../utils/secure-storage");
        secureStorage.clearToken();
        window.location.href = "/";
      }
      throw new Error("Authentication failed. Please login again.");
    }

    console.error("API call failed:", error);
    throw error;
  }
}

// Convenient API methods
export const api = {
  get: (endpoint: string) => apiCall(endpoint, { method: "GET" }),

  post: (endpoint: string, data?: any) => apiCall(endpoint, {
    method: "POST",
    data: data,
  }),

  put: (endpoint: string, data?: any) => apiCall(endpoint, {
    method: "PUT",
    data: data,
  }),

  delete: (endpoint: string) => apiCall(endpoint, { method: "DELETE" }),
};

// Specific API functions (using the new unified client)
export async function fetchTransactions(accountId: string) {
  const response = await api.get(`/api/transaction?accountId=${accountId}`);
  return response;
}

export async function createTransaction(transactionData: any) {
  const response = await api.post("/api/transaction", transactionData);
  return response;
}

export async function createWallet(walletData: any) {
  const response = await api.post("/api/hsmwallet/create-wallet", walletData);
  return response;
}

export async function fetchUser(accountId: string) {
  const response = await api.get(`/api/user/${accountId}`);
  return response;
}

export async function fetchUserMultisigWallet(accountId: string) {
  const response = await api.get(`/api/user/multisig-wallet?accountId=${accountId}`);
  return response;
}

export async function fetchApprovals(accountId: string) {
  const response = await api.get(`/api/approval?accountId=${accountId}`);
  return response;
}

export async function submitSignature(data: any) {
  const response = await api.post("/api/hsmwallet/submit-signature", data);
  return response;
}

export async function initiateTransaction(data: any) {
  const response = await api.post("/api/hsmwallet/initiate-transaction", data);
  return response;
}

export async function fetchTransactionHistory(accountId: string) {
  const response = await api.get(`/api/transaction/history?accountId=${accountId}`);
  return response;
}

export async function cancelTransaction(data: any) {
  const response = await api.post("/api/hsmwallet/cancel-transaction", data);
  return response;
}

export async function fetchUserHsmVault(accountId: string) {
  const response = await api.get(`/api/user/hsm-vault?accountId=${accountId}`);
  return response;
}

export async function createFidoRegisterOptions(data: any) {
  const response = await apiCall("/api/fido/register-options", { method: "POST", data }, false);
  return response;
}

export async function fidoRegister(data: any) {
  const response = await apiCall("/api/fido/register", { method: "POST", data }, false);
  return response;
}

export async function createFidoAuthenticateOptions(data: any) {
  const response = await apiCall("/api/fido/authenticate-options", { method: "POST", data }, false);
  return response;
}

export async function fidoAuthenticate(data: any) {
  const response = await apiCall("/api/fido/authenticate", { method: "POST", data }, false);
  return response;
}

export async function fetchBtcBalance(accountId: string) {
  const response = await api.get(`/api/hsmwallet/btc/balance/${accountId}`);
  return response;
}

export async function fetchHsmWalletUtils(action: string, recipientAddress?: string) {
  let url = `/api/hsmwallet/utils?action=${action}`;
  if (recipientAddress) {
    url += `&recipientAddress=${recipientAddress}`;
  }
  const response = await api.get(url);
  return response;
}

export async function fetchPendingTransactions(accountId: string) {
  const response = await api.get(`/api/transaction?accountId=${accountId}&status=PENDING`);
  return response;
}

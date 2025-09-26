/**
 * Bitcoin Multi-signature Module - Core cryptocurrency wallet functionality
 * Provides wallet management, transaction processing, and utility functions for Bitcoin operations
 */

export * from "./wallet";
export * from "./transaction";
export { CoinType } from "@secux/app-btc";
export { config, estimateVirtualSize, getFeeRateRecommendations, healthCheck } from "./utils";
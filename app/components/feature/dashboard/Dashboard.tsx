/**
 * Dashboard Component - Multi-signature wallet management interface
 * Displays portfolio balances, transaction history, and market data
 */

"use client";

import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BalanceItem, getCurrentUserInfo } from "@/lib/utils/common";
import { fetchBtcBalance } from "@/lib/api/api-client";

import Header from "../../layout/Header";
import Footer from "../../layout/Footer";
import ScrollTop from "../../common/ScrollTop";
import SidebarDesktop from "../../layout/SidebarDesktop";
import SidebarMobile from "../../layout/SidebarMobile";
import WalletInfo from "../wallet/WalletInfo";
import AssetBalance from "../wallet/AssetBalance";
import AssetDistribution from "../wallet/AssetDistribution";
import ReservePerformance from "../wallet/ReservePerformance";
import PendingTransactions from "../wallet/PendingTransactions";
import TransactionHistory from "../wallet/TransactionHistory";
import TransactionApprovals from "../wallet/TransactionApproval";

export default function Dashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState("");
  const [btcPrices, setBtcPrices] = useState([] as number[]);
  const [btcTotalBalance, setTotalBalance] = useState(0);
  const [btcTotalInUSD, setBtcTotalInUSD] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [btcBalances, setBtcBalances] = useState([] as BalanceItem[]);
  const [walletInfo, setWalletInfo] = useState([] as BalanceItem[]);

  // Initialize user authentication and redirect if not authenticated
  // This effect runs once on mount and handles the initial authentication check
  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      if (userInfo) {
        setAccountId(userInfo.accountId);
      } else {
        router.push("/");
      }
    }
    loadAccountId();
  }, [router]);

  // Load user data and wallet information once accountId is available
  // Separating concerns: user info, wallet balance, and market data
  useEffect(() => {
    if (!accountId) return;

    async function fetchUserInfo() {
      try {
        setUserInfo(accountId || "");
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    }

    async function fetchWalletData() {
      try {
        const res = await fetchBtcBalance(accountId!);
        const balanceList = res.data.balanceList;

        // Calculate total balance from all wallets
        const totalBalance = balanceList.reduce((sum: number, item: BalanceItem) => sum + item.balance, 0);
        setTotalBalance(totalBalance);

        // Extract balance data for charts
        setBtcBalances(balanceList.map((item: BalanceItem) => ({ balance: item.balance })));

        // Extract wallet metadata for display
        setWalletInfo(balanceList.map((item: BalanceItem) => ({
          walletId: item.walletId,
          address: item.address,
          name: item.name,
          participants: item.participants,
          creationTime: item.creationTime,
        })));
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      }
    }

    async function fetchMarketData() {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365",
          { headers: { "Content-Type": "application/json" } },
        );

        if (!res.data?.prices) return;

        // Extract monthly Bitcoin prices for the last 12 months
        // This provides historical context for portfolio performance
        const prices = res.data.prices; // Format: [[timestamp(ms), price], ...]
        const now = new Date();

        // Generate timestamps for the first day of each month
        const monthStarts: number[] = [];
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
          monthStarts.push(monthStart.getTime());
        }

        // Find closest price for each month start
        const monthlyPrices = monthStarts.map((targetTs, idx) => {
          // Use current price for the latest month
          if (idx === monthStarts.length - 1) {
            return prices[prices.length - 1][1];
          }

          // Find price closest to target timestamp
          let minDiff = Infinity;
          let closestPrice = prices[0][1];
          for (const [ts, price] of prices) {
            const diff = Math.abs(ts - targetTs);
            if (diff < minDiff) {
              minDiff = diff;
              closestPrice = price;
            }
          }
          return closestPrice;
        });

        setBtcPrices(monthlyPrices);
      } catch (error) {
        console.error("Failed to fetch Bitcoin market data:", error);
      }
    }

    // Execute all data fetching operations in parallel for better performance
    // Each operation is independent and can fail without affecting others
    Promise.allSettled([
      fetchUserInfo(),
      fetchWalletData(),
      fetchMarketData(),
    ]).then((results) => {
      // Log any failures for debugging, but don't block the UI
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const operations = ["user info", "wallet data", "market data"];
          console.error(`Failed to load ${operations[index]}:`, result.reason);
        }
      });
    });
  }, [accountId]);

  // Calculate USD value when both balance and current price are available
  useEffect(() => {
    if (btcPrices.length > 0) {
      const currentPrice = btcPrices[btcPrices.length - 1];
      setBtcTotalInUSD(btcTotalBalance * currentPrice);
    }
  }, [btcTotalBalance, btcPrices]);

  // Memoized calculations to avoid unnecessary re-computation on every render
  // These values are used by multiple chart components
  const chartData = useMemo(() => {
    const assetValues = btcBalances.map((item) => item.balance);
    const reserveValues = btcPrices.map((price) => btcTotalBalance * price);
    const totalValue = assetValues.reduce((sum, value) => sum + value, 0);
    const assetPercentages = assetValues.map((value) =>
      totalValue > 0 ? (value / totalValue) * 100 : 0,
    );

    return {
      assetValues,
      reserveValues,
      totalValue,
      assetPercentages,
    };
  }, [btcBalances, btcPrices, btcTotalBalance]);

  return (
    <div className="container-fluid">
      <SidebarMobile />

      <div className="d-flex flex-column flex-sm-row">
        <div className="d-md-block d-none"><SidebarDesktop /></div>

        <div className="col-md-5 fade-in flex-grow-1">
          <div className="container-fluid mt-3">

            <div className="row">
              <div className="col-md-12 mb-3 fade-in">
                <Header userInfo={userInfo} usdValue={btcTotalInUSD}/>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6 col-md-6 mb-3 d-flex fade-in">
                <WalletInfo info={walletInfo} />
              </div>
              <div className="col-md-6 col-md-6 mb-3 d-flex fade-in">
                <ReservePerformance values={chartData.reserveValues} />
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6 col-md-6 mb-3 d-flex fade-in">
                <AssetBalance values={chartData.assetValues} />
              </div>
              <div className="col-lg-6 col-md-6 mb-3 d-flex fade-in">
                <AssetDistribution values={chartData.assetPercentages} />
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-3 d-flex fade-in">
                <PendingTransactions />
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-3 d-flex fade-in">
                <TransactionHistory />
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 mb-3 d-flex fade-in">
                <TransactionApprovals />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollTop />
    </div>
  );
}

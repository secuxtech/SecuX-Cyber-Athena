/**
 * Transaction History Component - Displays completed Bitcoin transactions
 * Shows historical transaction data with search and filtering capabilities
 */

"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { TableColumn } from "react-data-table-component";
import { TransactionStatus } from "@prisma/client";
import { getCurrentUserInfo } from "@/lib/utils/common";
import { fetchTransactionHistory as fetchTransactionHistoryAPI } from "@/lib/api/api-client";
import { SearchComponent, useSearch } from "../../common/SearchComponent";
import ViewButton from "../../common/ViewButton";

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false });

let fetchTransactionHistory: () => Promise<void>;
interface TransactionHistory extends Record<string, unknown> {
  id: number;
  initiatorId: string;
  operation: string;
  asset: string;
  amount: string;
  recipient: string;
  hsmVault: string;
  walletId: string;
  transactionId: string;
  transactionHash: string;
  status: string;
  dateTime: string;
  statusIcon?: string;
}

interface Column extends TableColumn<TransactionHistory> {
  selector: (row: TransactionHistory) => string | number;
}

const columns: Column[] = [
  { name: "ID", selector: (row) => row.id, width: "90px", sortable: true },
  { name: "Initiator", selector: (row) => row.initiatorId, width: "150px", sortable: true },
  { name: "Operation", selector: (row) => row.operation, width: "120px", sortable: true },
  { name: "Asset", selector: (row) => row.asset, width: "90px", sortable: true },
  { name: "Amount", selector: (row) => row.amount, width: "120px", sortable: true },
  { name: "Datetime", selector: (row) => row.dateTime.split(".")[0].replace("T", " "), width: "180px", sortable: true },
  { name: "Status", selector: (row) => row.statusIcon || "", width: "100px", sortable: true },
  {
    name: "Details",
    width: "90px",
    selector: (row) => row.id.toString(),
    cell: (row) => {
      const showHistoryDetails = () => {
        let formattedDetails = [
          ...Object.entries(row).filter(
            ([key]) => key !== "recipient" && key !== "walletId" &&
              key !== "transactionId" && key!== "transactionHash" &&
              key !== "statusIcon" && key !== "hsmVault",
          ),
          ["recipient", `<br>${row.recipient}`],
          ["hsmVault", `<br>${row.hsmVault}`],
          ["walletId", `<br>${row.walletId}`],
          ["transactionId", `<br>${row.transactionId}` || "N/A"],
          ["transactionHash", `<br>${row.transactionHash}` || "N/A"],
        ]
          .map(([key, value]) => `${key}: ${value}`)
          .join("<br>");
        formattedDetails = `<span class='font-monospace'>${formattedDetails}</span>`;

        return <ViewButton formattedDetails={formattedDetails} title="History Details" />;
      };

      const initializePopover = async () => {
        const { Popover } = await import("bootstrap");
        const popoverTriggerList = document.querySelectorAll("[data-bs-toggle=\"popover\"]");
        [...popoverTriggerList].forEach(popoverTriggerEl => new Popover(popoverTriggerEl, {
          trigger: "focus",
          html: true,
          customClass: "custom-popover",
        }));
      };
      initializePopover();

      return (
        <div className="d-flex gap-2">
          {showHistoryDetails()}
        </div>
      );
    },
  },
];

export default function TransactionHistory() {
  const [data, setData] = useState<TransactionHistory[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      setAccountId(userInfo?.accountId || null);
    }
    loadAccountId();
  }, []);

  fetchTransactionHistory = async () => {
    try {
      if (!accountId) return;
      const res = await fetchTransactionHistoryAPI(accountId);
      if (!res.data) return;

      const allTransactions: TransactionHistory[] = res.data.map((item: TransactionHistory) => ({
        id: item.id,
        initiatorId: item.initiatorId,
        operation: item.operation,
        asset: item.asset,
        amount: item.amount,
        recipient: item.recipient,
        transactionId: item.transactionId,
        transactionHash: item.transactionHash,
        status: item.status,
        hsmVault: item.hsmVault,
        walletId: item.walletId,
        dateTime: item.createdAt,
        statusIcon: item.status === TransactionStatus.COMPLETED ? "🟢" :
          item.status === TransactionStatus.FAILED ? "🔴" : "🟡",
      }));
      setData(allTransactions);
    } catch (error) {
      console.error("Failed to fetch TX history:", error);
    }
  };

  useEffect(() => {
    if (accountId) fetchTransactionHistory();
  }, [accountId]);

  const { filterText, filteredData, handleSearch } = useSearch(data);

  return (
    <div className="card d-flex flex-grow-1 shadow-sm">
      <div className="card-header">
        <div className="d-flex flex-md-row justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-clock-history me-2"></i> Transaction History
          </div>
          <div className="d-flex">
            <div className="d-flex align-items-center">
              <button onClick={fetchTransactionHistory} className="btn btn-outline-secondary mx-2">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
            <SearchComponent filterText={filterText} handleSearch={handleSearch} />
          </div>
        </div>
      </div>
      <div className="card-body">
        {!data ? (
          <div className="d-flex justify-content-center align-items-center">
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns as TableColumn<unknown>[]}
            data={filterText.length > 0 ? filteredData : data}
            pagination
            paginationPerPage={5}
            paginationRowsPerPageOptions={[5, 10, 15, 20]}
            highlightOnHover
            striped
            responsive
            className="fade-in"
          />
        )}
      </div>
    </div>
  );
}

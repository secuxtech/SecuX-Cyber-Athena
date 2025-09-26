/**
 * Transaction Approval Component - Shows user's approval history
 * Displays transactions approved by current user with status tracking
 */

"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { TableColumn } from "react-data-table-component";
import { getCurrentUserInfo } from "@/lib/utils/common";
import { fetchApprovals } from "@/lib/api/api-client";
import { SearchComponent, useSearch } from "../../common/SearchComponent";

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false });

let fetchTransactionApprovals: () => Promise<void>;
interface Approval extends Record<string, unknown> {
  id: number;
  txSN: number;
  operation: string;
  asset: string;
  amount: string;
  approverId: string;
  status: string;
  dateTime: string;
}

interface Column extends TableColumn<Approval> {
  selector: (row: Approval) => string | number;
}

const columns: Column[] = [
  { name: "ID", selector: (row) => row.txSN, width: "90px", sortable: true },
  { name: "Approver", selector: (row) => row.approverId, width: "150px", sortable: true },
  { name: "Operation", selector: (row) => row.operation, width: "120px", sortable: true },
  { name: "Asset", selector: (row) => row.asset, width: "90px", sortable: true },
  { name: "Amount", selector: (row) => row.amount, width: "120px", sortable: true },
  { name: "Datetime", selector: (row) => row.dateTime.split(".")[0].replace("T", " "), width: "180px", sortable: true },
  { name: "Status", selector: (row) => row.status, width: "100px", sortable: true },
];

export default function TransactionApprovals() {
  const [data, setData] = useState<Approval[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      setAccountId(userInfo?.accountId || null);
    }
    loadAccountId();
  }, []);

  fetchTransactionApprovals = async () => {
    try {
      if (!accountId) return;
      const res = await fetchApprovals(accountId);
      if (!res.data) return;

      setData(res.data.map((item: Approval, index: number) => ({
        id: index,
        txSN: item.txSN,
        operation: (item.transaction as { operation: string }).operation,
        asset: (item.transaction as { asset: string }).asset,
        amount: (item.transaction as { amount: string }).amount,
        approverId: item.approverId,
        status: item.status,
        dateTime: item.createdAt,
      })));
    } catch (error) {
      console.error("Failed to fetch TX approvals:", error);
    }
  };

  useEffect(() => {
    if (accountId) fetchTransactionApprovals();
  }, [accountId]);

  const { filterText, filteredData, handleSearch } = useSearch(data);

  return (
    <div className="card d-flex flex-grow-1 shadow-sm">
      <div className="card-header">
        <div className="d-flex flex-md-row justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-bookmark-check me-2"></i> Transaction Approvals
          </div>
          <div className="d-flex">
            <div className="d-flex align-items-center">
              <button onClick={fetchTransactionApprovals} className="btn btn-outline-secondary mx-2">
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

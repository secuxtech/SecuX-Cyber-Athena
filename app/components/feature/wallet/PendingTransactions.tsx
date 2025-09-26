/**
 * Pending Transactions Component - Multi-signature transaction approval interface
 * Manages transaction approvals with FIDO2 authentication and passphrase validation
 */

"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { TableColumn } from "react-data-table-component";
import { getCurrentUserInfo, formatErrorMessage } from "@/lib/utils/common";
import { cancelTransaction, submitSignature, fetchPendingTransactions } from "@/lib/api/api-client";
import ViewButton from "../../common/ViewButton";
import InitiateButtonModal from "../../modals/InitiateButtonModal";
import { SearchComponent, useSearch } from "../../common/SearchComponent";
import toast from "react-hot-toast";
import ConfirmModal from "../../modals/ConfirmModal";
import PassphraseModal from "../../modals/PassphraseModal";
import { validatePassphrase } from "@/lib/utils/form-validation";

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false });

let retrievePendingTransactions: () => Promise<void>;

interface Transaction extends Record<string, unknown> {
  id: number;
  initiatorId: string;
  operation: string;
  asset: string;
  amount: string;
  recipient: string;
  status: string;
  approvalCount: number;
  requiredCount: number;
  transactionId: string;
  hsmVault: string;
  walletId: string;
  dateTime: string;
}

interface Column extends TableColumn<Transaction> {
  selector: (row: Transaction) => string | number;
}

const columns: Column[] = [
  { name: "ID", selector: (row) => row.id, width: "90px", sortable: true },
  { name: "Operation", selector: (row) => row.operation, width: "120px", sortable: true },
  { name: "Asset", selector: (row) => row.asset, width: "90px", sortable: true },
  { name: "Amount", selector: (row) => row.amount.toString(), width: "120px", sortable: true },
  { name: "Approval", selector: (row) => `${row.approvalCount} / ${row.requiredCount}`, width: "120px", sortable: true },
  { name: "Datetime", selector: (row) => row.dateTime.split(".")[0].replace("T", " "), width: "180px", sortable: true },
  {
    name: "Details",
    width: "230px",
    selector: (row) => row.id.toString(),
    cell: (row) => <PendingTransactionActions row={row} onAction={retrievePendingTransactions} />,
  },
];

function PendingTransactionActions({ row, onAction }: { row: Transaction, onAction: () => void }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Show confirm modal helper
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalData({ title, message, onConfirm });
    setShowConfirmModal(true);
  };


  // Hash passphrase function for security
  const hashPassphrase = async (passphrase: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };
  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      setAccountId(userInfo?.accountId || null);
    }
    loadAccountId();
  }, []);

  useEffect(() => {
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
  }, []);

  const showTransactionDetails = () => {
    let formattedDetails = [
      ...Object.entries(row).filter(
        ([key]) => key !== "recipient" && key !== "hsmVault" && key !== "walletId" && key !== "transactionId",
      ),
      ["recipient", `<br>${row.recipient}`],
      ["hsmVault", `<br>${row.hsmVault}`],
      ["walletId", `<br>${row.walletId}`],
      ["transactionId", `<br>${row.transactionId}`],
    ]
      .map(([key, value]) => `${key}: ${value}`)
      .join("<br>");
    formattedDetails = `<span class='font-monospace'>${formattedDetails}</span>`;
    return <ViewButton formattedDetails={formattedDetails} title="Transaction Details" />;
  };

  const handleCancelTransaction = async () => {
    showConfirm(
      "Cancel Transaction",
      `Are you sure to cancel transaction #${row.id}?`,
      async () => {
        setShowConfirmModal(false);
        try {
          const response = await cancelTransaction({
            id: row.id,
            initiatorId: row.initiatorId,
            transactionId: row.transactionId,
            hsmVault: row.hsmVault,
          });
          if (response.status !== 200) {
            throw new Error("Failed to cancel transaction");
          }
          toast.success(`Transaction #${row.id} has been cancelled!`);
        } catch (error: any) {
          console.error(error);
          toast.error(formatErrorMessage(error, "Cancel TX Failed"));
        } finally {
          onAction();
        }
      },
    );
  };

  const handleApproveTransaction = async () => {
    setShowPassphraseModal(true);
  };

  const submitApprovalWithPassphrase = async () => {
    if (!passphrase) {
      toast.error("Please enter your passphrase.");
      return;
    }

    // Validate passphrase
    const passphraseValidation = validatePassphrase(passphrase);
    if (!passphraseValidation.isValid) {
      toast.error(`Invalid passphrase: ${passphraseValidation.message}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Hash passphrase before sending
      const passphraseHash = await hashPassphrase(passphrase);

      const response = await submitSignature({
        id: row.id,
        initiatorId: row.initiatorId,
        approverId: accountId,
        hsmVault: row.hsmVault,
        walletId: row.walletId,
        passphraseHash,
      });
      if (!response.data) {
        throw new Error("Failed to submit signature");
      }
      toast.success(`Transaction #${row.id} has been approved!\nBalance: ${response.data.balance}`);
      setShowPassphraseModal(false);
      setPassphrase("");
    } catch (error: any) {
      console.error(error);
      toast.error("Approving transaction failed. Please check signers' passphrases are correct.");
    } finally {
      setIsSubmitting(false);
      onAction();
    }
  };

  return (
    <>
      <div className="d-flex gap-2">
        {showTransactionDetails()}
        <button
          onClick={handleCancelTransaction}
          className="btn btn-sm btn-outline-primary"
          hidden={accountId !== row.initiatorId}
        >
          Cancel
        </button>
        <button
          onClick={handleApproveTransaction}
          className="btn btn-sm btn-outline-success"
          hidden={accountId === row.initiatorId}
        >
          Approve
        </button>
      </div>

      {/* Passphrase Modal */}
      <PassphraseModal
        isOpen={showPassphraseModal}
        title="Enter Passphrase"
        transactionId={row.id}
        passphrase={passphrase}
        showPassphrase={showPassphrase}
        isLoading={isSubmitting}
        onPassphraseChange={setPassphrase}
        onToggleShowPassphrase={() => setShowPassphrase(!showPassphrase)}
        onSubmit={submitApprovalWithPassphrase}
        onCancel={() => {
          setShowPassphraseModal(false);
          setPassphrase("");
        }}
        validatePassphrase={validatePassphrase}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalData.title}
        message={confirmModalData.message}
        onConfirm={confirmModalData.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </>
  );
}

export default function PendingTransactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      setAccountId(userInfo?.accountId || null);
    }
    loadAccountId();
  }, []);

  retrievePendingTransactions = async () => {
    if (!accountId) return;
    try {
      const res = await fetchPendingTransactions(accountId);
      if (!res.data) return;

      const allTransactions: Transaction[] = res.data.map((item: Transaction) => ({
        id: item.id,
        initiatorId: item.initiatorId,
        operation: item.operation,
        asset: item.asset,
        amount: item.amount,
        recipient: item.recipient,
        status: item.status,
        approvalCount: item.approvalCount,
        requiredCount: item.requiredCount,
        hsmVault: item.hsmVault,
        walletId: item.walletId,
        transactionId: item.transactionId,
        dateTime: item.createdAt,
      }));

      setData(allTransactions);
    } catch (error) {
      console.error("Failed to fetch pending TXs:", error);
    }
  };

  const handleModalClose = useCallback(async () => {
    await retrievePendingTransactions();
  }, []);

  useEffect(() => {
    if (accountId) retrievePendingTransactions();
  }, [accountId]);

  const { filterText, filteredData, handleSearch } = useSearch(data);

  return (
    <div className="card d-flex flex-grow-1 shadow-sm">
      <div className="card-header">
        <div className="d-flex flex-md-row justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-joystick me-2"></i> Pending Transactions
          </div>
          <div className="d-flex">
            <div className="d-flex align-items-center">
              {accountId && (
                <InitiateButtonModal
                  accountId={accountId}
                  onClose={handleModalClose}
                />
              )}
              <button onClick={retrievePendingTransactions} className="btn btn-outline-secondary mx-2">
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
            className="fade-in"
          />
        )}
      </div>
    </div>
  );
}

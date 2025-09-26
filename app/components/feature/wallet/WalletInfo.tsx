"use client";

import { BalanceItem } from "@/lib/utils/common";
import { useState } from "react";

export default function WalletInfo({ info }: { info: BalanceItem[] }) {
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);

  if (!info || info.length === 0) {
    return (
      <div className="card flex-grow-1 shadow-sm">
        <div className="card-header bg-light text-white">
          <span className="text-dark"><i className="bi bi-info-circle me-2"></i>Wallet Information</span>
        </div>
        <div className="card-body d-flex justify-content-center align-items-center">
          <div className="d-flex justify-content-center align-items-center">
            <div className="spinner-border text-secondary" style={{ width: "3rem", height: "3rem" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedWallet = info[selectedWalletIndex];

  return (
    <div className="card flex-grow-1 shadow-sm">
      <div className="card-header bg-light text-white d-flex justify-content-between align-items-center">
        <div>
          <span className="text-dark"><i className="bi bi-info-circle me-2"></i>Wallet Information</span>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="p-4">
          <div className="row mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 w-100">
                <i className="bi bi-wallet-fill text-secondary fs-4 flex-shrink-0"></i>
                {info.length > 0 && (
                  <>
                    <select
                      className="form-select form-select-sm"
                      style={{ minWidth: "0", width: "0", flexGrow: "1" }}
                      value={selectedWalletIndex}
                      onChange={(e) => setSelectedWalletIndex(Number(e.target.value))}
                    >
                      {info.map((wallet, index) => (
                        <option key={index} value={index}>
                          {wallet.name}
                        </option>
                      ))}
                    </select>
                    <span className="badge bg-secondary text-light flex-shrink-0 small">
                      {info.length} wallet{info.length > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <small className="text-muted fw-semibold">
                  <i className="bi bi-wallet me-1"></i>
                  Wallet ID
                </small>
                {/* <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigator.clipboard.writeText(selectedWallet.walletId)}
                  title="Copy Wallet ID"
                >
                  <i className="bi bi-copy"></i>
                </button> */}
              </div>
              <div className="bg-light rounded p-1 position-relative">
                <code
                  className="small d-block font-monospace text-truncate"
                  style={{ maxWidth: "100%" }}
                  title={selectedWallet.walletId}
                >
                  {selectedWallet.walletId}
                </code>
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <small className="text-muted fw-semibold">
                  <i className="bi bi-geo-alt me-1"></i>
                  Wallet Address
                </small>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigator.clipboard.writeText(selectedWallet.address)}
                  title="Copy Wallet Address"
                >
                  <i className="bi bi-copy"></i>
                </button>
              </div>
              <div className="bg-light rounded p-1 position-relative">
                <code
                  className="small d-block font-monospace text-truncate"
                  style={{ maxWidth: "100%" }}
                  title={selectedWallet.address}
                >
                  {selectedWallet.address}
                </code>
              </div>
            </div>

            <div className="col-md-12">
              <small className="text-muted fw-semibold d-block mb-2">
                <i className="bi bi-people me-1"></i>
                Participants ({selectedWallet.participants.length})
              </small>
              <div className="d-flex flex-wrap gap-1">
                {selectedWallet.participants.map((participant, idx) => (
                  <h5 key={idx}>
                    <span className="badge bg-light text-info border border-info">
                      {participant}
                    </span>
                  </h5>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

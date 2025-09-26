import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { fetchUserHsmVault, initiateTransaction, createTransaction } from "@/lib/api/api-client";
import { formatErrorMessage } from "@/lib/utils/common";
import { validatePassphrase } from "@/lib/utils/form-validation";

interface InitiateButtonModalProps {
  accountId: string;
  onClose?: () => void;
}

type HsmVaultItem = { hsmVault: string; walletId: string, id: number, name: string };

export default function InitiateButtonModal({ accountId, onClose }: InitiateButtonModalProps) {
  const [formData, setFormData] = useState({
    initiatorId: accountId, operation: "", asset: "", amount: "", hsmVault: "", walletId: "", walletSN: 0,
    recipient: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hsmVaultList, setHsmVaultList] = useState<HsmVaultItem[]>([]);
  const [selectedHsmVault, setSelectedHsmVault] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);


  // Hash passphrase function for security
  const hashPassphrase = async (passphrase: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && modalRef.current) {
      import("bootstrap").then(({ Modal }) => {
        if (!modalRef.current) return;
        Modal.getOrCreateInstance(modalRef.current);
        modalRef.current.addEventListener("show.bs.modal", () => {
          modalRef.current?.removeAttribute("inert");
          setFormData({
            initiatorId: accountId, operation: "", asset: "", amount: "", hsmVault: "", walletId: "", walletSN: 0,
            recipient: "",
          });
          setSelectedHsmVault("");
          setSelectedWalletId("");
          setPassphrase("");
        });
        modalRef.current.addEventListener("hide.bs.modal", () => {
          modalRef.current?.setAttribute("inert", "");
          if (onClose) onClose();
        });
      });
    }

    fetchUserHsmVault(accountId).then(res => {
      if (res && Array.isArray(res.data.hsmVaults)) {
        setHsmVaultList(
          res.data.hsmVaults.map((item: HsmVaultItem) => ({
            hsmVault: item.hsmVault,
            walletId: item.walletId,
            id: item.id,
            name: item.name,
          })),
        );
      }
    });
  }, [accountId, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      if (!formData.operation ||
          !formData.asset ||
          !formData.hsmVault ||
          !formData.walletId ||
          !formData.amount ||
          !formData.recipient ||
          !passphrase
      ) {
        toast.error("Please fill in all fields including passphrase before submitting.");
        setIsSubmitting(false);
        return;
      } else if (isNaN(Number(formData.amount))) {
        toast.error("Invalid amount format.");
        setIsSubmitting(false);
        return;
      }

      // Validate passphrase
      const passphraseValidation = validatePassphrase(passphrase);
      if (!passphraseValidation.isValid) {
        toast.error(`Invalid passphrase: ${passphraseValidation.message}`);
        setIsSubmitting(false);
        return;
      }

      // Hash passphrase before sending
      const passphraseHash = await hashPassphrase(passphrase);

      // Convert amount to number once
      const inputFormData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const initRes = await initiateTransaction({
        ...inputFormData,
        passphraseHash,
      });
      if (!initRes.data) {
        throw new Error("Failed to initiate transaction");
      }

      const { signaturesReceived, requiredSignatures, transactionId } = initRes.data;
      const response = await createTransaction({
        ...inputFormData,
        approvalCount: signaturesReceived + 1,
        requiredCount: requiredSignatures,
        transactionId,
      });
      if (response.status !== 200) {
        throw new Error("Failed to initiate transaction");
      }
      toast.success("Transaction submitted successfully!");

      if (modalRef.current) {
        const { Modal } = await import("bootstrap");
        const modalInstance = Modal.getInstance(modalRef.current);
        modalInstance?.hide();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(formatErrorMessage(error, "Submit TX Failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="d-flex justify-content-center">
      <button type="button" className="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#initiateModal">
        <i className="bi bi-plus-lg"></i>
      </button>
      <div
        className="modal fade"
        id="initiateModal"
        tabIndex={-1}
        aria-labelledby="initiateModalLabel"
        ref={modalRef}
        inert
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="initiateModalLabel">Initiate New Transaction</h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-6">
                  <div className="input-group">
                    <div className="input-group-text">
                      <i className="bi bi-gear"></i>
                    </div>
                    <select className="form-select" id="operation" value={formData.operation} onChange={handleInputChange}>
                      <option value="">Operation</option>
                      <option value="TRANSFER">Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="input-group">
                    <div className="input-group-text">
                      <i className="bi bi-currency-bitcoin"></i>
                    </div>
                    <select className="form-select" id="asset" value={formData.asset} onChange={handleInputChange}>
                      <option value="">Asset</option>
                      <option value="BTC">BTC</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-7">
                  <div className="input-group mb-2">
                    <div className="input-group-text">
                      <i className="bi bi-link-45deg"></i>
                    </div>
                    <select
                      className="form-select"
                      id="hsmVault"
                      value={selectedHsmVault}
                      onChange={e => {
                        setSelectedHsmVault(e.target.value);
                        setSelectedWalletId("");
                      }}
                    >
                      <option value="">Select HSM</option>
                      {[...new Set(hsmVaultList.map(v => v.hsmVault))].map(hsm => (
                        <option key={hsm} value={hsm} style={{fontSize: "0.8rem"}}>{hsm}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="input-group">
                    <div className="input-group-text">
                      <i className="bi bi-cash-coin"></i>
                    </div>
                    <input type="text" className="form-control" id="amount" placeholder="Amount"
                      value={formData.amount} onChange={handleInputChange} />
                  </div>
                </div>
                {selectedHsmVault && (
                  <div className="col-md-12">
                    <div className="input-group mb-2">
                      <div className="input-group-text">
                        <i className="bi bi-building"></i>
                      </div>
                      <select
                        className="form-select"
                        id="walletId"
                        value={selectedWalletId}
                        onChange={e => {
                          setSelectedWalletId(e.target.value);
                          const found = hsmVaultList.find(
                            v => v.hsmVault === selectedHsmVault && v.walletId === e.target.value,
                          );
                          setFormData(prev => ({
                            ...prev,
                            hsmVault: selectedHsmVault,
                            walletId: e.target.value,
                            walletSN: found ? found.id : 0,
                          }));
                        }}
                      >
                        <option value="">Sender Wallet</option>
                        {hsmVaultList.filter(v => v.hsmVault === selectedHsmVault).map(v => (
                          <option key={v.walletId} value={v.walletId}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <div className="col-md-12">
                  <div className="input-group">
                    <div className="input-group-text">
                      <i className="bi bi-wallet2"></i>
                    </div>
                    <input type="text" className="form-control" id="recipient" placeholder="Recipient Address"
                      value={formData.recipient} onChange={handleInputChange} />
                  </div>
                </div>

                {/* Passphrase input */}
                <div className="col-md-12">
                  <div className="input-group">
                    <div className="input-group-text">
                      <i className="bi bi-key"></i>
                    </div>
                    <input
                      type={showPassphrase ? "text" : "password"}
                      className={`form-control ${passphrase ? (validatePassphrase(passphrase).isValid ? "is-valid" : "is-invalid") : ""}`}
                      placeholder="Enter your wallet passphrase"
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                    >
                      <i className={`bi ${showPassphrase ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                  {passphrase && !validatePassphrase(passphrase).isValid && (
                    <div className="invalid-feedback d-block" style={{ fontSize: "0.8rem" }}>
                      {validatePassphrase(passphrase).message}
                    </div>
                  )}
                </div>
                {selectedWalletId && (
                  <div className="col-md-12">
                    <div className="form-text text-break" style={{ fontSize: "0.85rem" }}>
                      Selected Wallet ID: {selectedWalletId}
                    </div>
                  </div>
                )}
                <div className="modal-footer">
                  Initiator: <span className="text-primary">{accountId}</span>
                  <i className="bi bi-play text-dark"></i>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
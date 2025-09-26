import React, { useEffect, useState } from "react";

interface PassphraseModalProps {
  isOpen: boolean;
  title: string;
  transactionId: number;
  passphrase: string;
  showPassphrase: boolean;
  isLoading?: boolean;
  onPassphraseChange: (value: string) => void;
  onToggleShowPassphrase: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  validatePassphrase: (passphrase: string) => { isValid: boolean; message: string };
}

export default function PassphraseModal({
  isOpen,
  title,
  transactionId,
  passphrase,
  showPassphrase,
  isLoading = false,
  onPassphraseChange,
  onToggleShowPassphrase,
  onSubmit,
  onCancel,
  validatePassphrase,
}: PassphraseModalProps) {
  const [show, setShow] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure DOM is updated before adding show class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShow(true);
        });
      });
    } else {
      setShow(false);
      // Wait for fade out animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 150);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const validation = validatePassphrase(passphrase);

  return (
    <>
      {/* Modal Backdrop */}
      <div className={`modal-backdrop fade ${show ? "show" : ""}`} onClick={onCancel}></div>

      {/* Modal */}
      <div
        className={`modal fade ${show ? "show" : ""} d-block`}
        tabIndex={-1}
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Please enter your wallet passphrase to approve transaction #{transactionId}:</p>
              <div className="input-group mb-3">
                <span className="input-group-text">
                  <i className="bi bi-key"></i>
                </span>
                <input
                  type={showPassphrase ? "text" : "password"}
                  className={`form-control ${passphrase ? (validation.isValid ? "is-valid" : "is-invalid") : ""}`}
                  placeholder="Enter your wallet passphrase"
                  value={passphrase}
                  onChange={e => onPassphraseChange(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  onKeyPress={e => {
                    if (e.key === "Enter" && validation.isValid && !isLoading) {
                      onSubmit();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onToggleShowPassphrase}
                  disabled={isLoading}
                >
                  <i className={`bi ${showPassphrase ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {passphrase && !validation.isValid && (
                <div className="text-danger" style={{ fontSize: "0.8rem" }}>
                  {validation.message}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={onSubmit}
                disabled={!validation.isValid || isLoading}
              >
                {isLoading && (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                )}
                Approve Transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import React from "react";
import { LoadingButton } from "../ui";

interface CosignerData {
  id: string;
  service: string;
  passphrase: string;
  passphraseConfirm: string;
  hasCredentials: boolean;
  isRegistering: boolean;
  isChecking: boolean;
}

interface CosignerFormProps {
  /** Cosigner number (1 or 2) for display purposes */
  cosignerNumber: 1 | 2;
  /** Current cosigner data */
  cosigner: CosignerData;
  /** Update function for cosigner data */
  onUpdate: (updates: Partial<CosignerData>) => void;
  /** FIDO registration handler */
  onRegister: () => void;
  /** Whether passwords are visible */
  showPasswords: boolean;
  /** Passphrase validation function */
  validatePassphrase: (passphrase: string) => { isValid: boolean; message: string };
  /** Passphrase match validation function */
  validatePassphraseMatch: (pass: string, confirm: string) => { isValid: boolean; message: string };
}

/**
 * Reusable cosigner form component
 *
 * Handles the repeated UI pattern for cosigner registration and passphrase entry.
 * Maintains the same structure for both Cosigner 1 and Cosigner 2 while avoiding
 * code duplication. The main CreateWallet logic remains intact for learning clarity.
 */
export default function CosignerForm({
  cosignerNumber,
  cosigner,
  onUpdate,
  onRegister,
  showPasswords,
  validatePassphrase,
  validatePassphraseMatch,
}: CosignerFormProps) {
  return (
    <div className="col-lg-6 col-md-6 mb-3">
      <div className="card h-100 shadow-sm">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bi bi-person-check"></i> Cosigner {cosignerNumber}
          </h6>
        </div>
        <div className="card-body">
          {/* Account ID and FIDO Registration */}
          <div className="d-flex">
            <input
              type="text"
              placeholder="Insert Account ID"
              value={cosigner.id}
              onChange={(e) => onUpdate({ id: e.target.value })}
              className="form-control me-2"
              style={{ minWidth: 0, flex: 1, fontSize: "1rem" }}
              autoComplete="username"
            />
            <LoadingButton
              onClick={onRegister}
              variant="dark"
              loading={cosigner.isRegistering || cosigner.isChecking}
              disabled={cosigner.hasCredentials}
              style={{ whiteSpace: "nowrap", fontSize: "1rem" }}
            >
              {cosigner.hasCredentials ? "Registered" : "FIDO Register"}
            </LoadingButton>
          </div>

          {/* Passphrase Section */}
          <div className="mt-2 mb-2">
            <label
              className="form-label text-muted text-start"
              style={{ fontSize: "0.9rem", display: "block" }}
            >
              Cosigner {cosignerNumber} ({cosigner.id || "Not set"}) Passphrase
            </label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="At least 8 chars, A-Z, a-z, 0-9"
                  value={cosigner.passphrase}
                  onChange={(e) => onUpdate({ passphrase: e.target.value })}
                  className={`form-control ${
                    cosigner.passphrase
                      ? (validatePassphrase(cosigner.passphrase).isValid ? "is-valid" : "is-invalid")
                      : ""
                  }`}
                  style={{ fontSize: "0.9rem" }}
                  autoComplete="new-password"
                  disabled={!cosigner.id}
                />
                {cosigner.passphrase && !validatePassphrase(cosigner.passphrase).isValid && (
                  <div className="invalid-feedback" style={{ fontSize: "0.8rem" }}>
                    {validatePassphrase(cosigner.passphrase).message}
                  </div>
                )}
              </div>
              <div className="col-6">
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirm wallet passphrase"
                  value={cosigner.passphraseConfirm}
                  onChange={(e) => onUpdate({ passphraseConfirm: e.target.value })}
                  className={`form-control ${
                    cosigner.passphraseConfirm
                      ? (validatePassphraseMatch(cosigner.passphrase, cosigner.passphraseConfirm).isValid ? "is-valid" : "is-invalid")
                      : ""
                  }`}
                  style={{ fontSize: "0.9rem" }}
                  autoComplete="new-password"
                  disabled={!cosigner.id || !cosigner.passphrase}
                />
                {cosigner.passphraseConfirm && !validatePassphraseMatch(cosigner.passphrase, cosigner.passphraseConfirm).isValid && (
                  <div className="invalid-feedback" style={{ fontSize: "0.8rem" }}>
                    {validatePassphraseMatch(cosigner.passphrase, cosigner.passphraseConfirm).message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
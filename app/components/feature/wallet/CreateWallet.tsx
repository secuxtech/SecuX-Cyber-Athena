/**
 * Multi-signature Wallet Creation Component
 * Handles 2-of-3 Bitcoin wallet setup with FIDO2 cosigner verification
 */

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { getCurrentUserInfo, formatErrorMessage } from "@/lib/utils/common";
import { fetchUser, createFidoRegisterOptions, fidoRegister, createWallet, fetchHsmWalletUtils } from "@/lib/api/api-client";
import toast from "react-hot-toast";
import ConfirmModal from "../../modals/ConfirmModal";
import { LoadingButton } from "../../ui";
import CosignerForm from "../../form/CosignerForm";
import { validatePassphrase, validatePassphraseMatch } from "@/lib/utils/form-validation";

export default function CreateWallet({ isNewUser = false }: { isNewUser?: boolean }) {
  const router = useRouter();

  // Primary signer state group
  const [primarySigner, setPrimarySigner] = useState({
    id: "",
    service: "",
    passphrase: "",
    passphraseConfirm: "",
  });

  // Cosigner 1 state group
  const [cosigner1, setCosigner1] = useState({
    id: "",
    service: "",
    passphrase: "",
    passphraseConfirm: "",
    hasCredentials: false,
    isRegistering: false,
    isChecking: false,
  });

  // Cosigner 2 state group
  const [cosigner2, setCosigner2] = useState({
    id: "",
    service: "",
    passphrase: "",
    passphraseConfirm: "",
    hasCredentials: false,
    isRegistering: false,
    isChecking: false,
  });

  // UI state group
  const [uiState, setUiState] = useState({
    showPassphrases: false,
    showConfirmModal: false,
    isCreatingWallet: false,
    confirmModalData: {
      title: "",
      message: "",
      onConfirm: () => {},
    },
  });

  // Configuration state group
  const [config, setConfig] = useState({
    isNew: isNewUser,
    hsmVaultUrl: "http://pufhsm2.itracxing.xyz",
  });


  // Show confirm modal helper
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setUiState(prev => ({
      ...prev,
      confirmModalData: { title, message, onConfirm },
      showConfirmModal: true,
    }));
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
    async function loadUserInfo() {
      const tokenInfo = await getCurrentUserInfo();
      if (!tokenInfo) {
        router.push("/");
        return;
      }

      if (isNewUser) setConfig(prev => ({ ...prev, isNew: tokenInfo.new }));
      setPrimarySigner(prev => ({ ...prev, id: tokenInfo.accountId, service: tokenInfo.authService }));
      setCosigner1(prev => ({ ...prev, service: tokenInfo.authService }));
      setCosigner2(prev => ({ ...prev, service: tokenInfo.authService }));
      setUiState(prev => ({ ...prev, showPassphrases: false }));
    }

    loadUserInfo();
  }, [router, isNewUser]);

  // use debounce to check after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cosigner1.id.trim()) {
        checkUserCredentials(cosigner1.id, "cosigner1");
      } else {
        setCosigner1(prev => ({ ...prev, hasCredentials: false }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [cosigner1.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (cosigner2.id.trim()) {
        checkUserCredentials(cosigner2.id, "cosigner2");
      } else {
        setCosigner2(prev => ({ ...prev, hasCredentials: false }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [cosigner2.id]);

  // check credentials when component mounts
  const checkUserCredentials = async (accountId: string, cosignerType: "cosigner1" | "cosigner2") => {
    const trimmedAccountId = accountId.trim();

    if (!trimmedAccountId) {
      if (cosignerType === "cosigner1") {
        setCosigner1(prev => ({ ...prev, hasCredentials: false }));
      } else {
        setCosigner2(prev => ({ ...prev, hasCredentials: false }));
      }
      return;
    }

    // Validate account ID length
    if (trimmedAccountId.length < 3) {
      toast.error(`${cosignerType === "cosigner1" ? "Cosigner 1" : "Cosigner 2"} Account ID must be at least 3 characters`);
      if (cosignerType === "cosigner1") {
        setCosigner1(prev => ({ ...prev, hasCredentials: false }));
      } else {
        setCosigner2(prev => ({ ...prev, hasCredentials: false }));
      }
      return;
    }

    try {
      if (cosignerType === "cosigner1") {
        setCosigner1(prev => ({ ...prev, isChecking: true }));
      } else {
        setCosigner2(prev => ({ ...prev, isChecking: true }));
      }

      const response = await fetchUser(trimmedAccountId);
      const user = response.data;

      if (user) {
        const hasCredentials = user.credentialCount > 0;
        if (cosignerType === "cosigner1") {
          setCosigner1(prev => ({ ...prev, hasCredentials }));
        } else {
          setCosigner2(prev => ({ ...prev, hasCredentials }));
        }
      }
    } catch (error: any) {
      console.error(`Error checking credentials for ${trimmedAccountId}:`, error);

      if (cosignerType === "cosigner1") {
        setCosigner1(prev => ({ ...prev, hasCredentials: false }));
      } else {
        setCosigner2(prev => ({ ...prev, hasCredentials: false }));
      }
    } finally {
      if (cosignerType === "cosigner1") {
        setCosigner1(prev => ({ ...prev, isChecking: false }));
      } else {
        setCosigner2(prev => ({ ...prev, isChecking: false }));
      }
    }
  };

  const handleRegistration1 = async () => {
    setCosigner1(prev => ({ ...prev, isRegistering: true }));
    try {
      if (!cosigner1.id.trim() || !cosigner1.service.trim()) {
        toast.error("Please enter all fields.");
        return;
      }
      const res = await createFidoRegisterOptions({ accountId: cosigner1.id });
      const raw = res.data.requestOptions || res.data;
      const optionsJSON = { ...raw };
      if (!optionsJSON.challenge) {
        throw new Error("Invalid WebAuthn challenge");
      }
      const credential = await startRegistration({ optionsJSON });
      const verifyRes = await fidoRegister({ accountId: cosigner1.id, credential });
      if (!verifyRes.data.verified) throw new Error("Verification failed");
      toast.success("Cosigner 1: Register Successfully.");
      setCosigner1(prev => ({ ...prev, hasCredentials: true }));
    } catch (error: any) {
      console.error(error);
      toast.error(formatErrorMessage(error, "Register Failed"));
    } finally {
      setCosigner1(prev => ({ ...prev, isRegistering: false }));
    }
  };

  const handleRegistration2 = async () => {
    setCosigner2(prev => ({ ...prev, isRegistering: true }));
    try {
      if (!cosigner2.id.trim() || !cosigner2.service.trim()) {
        toast.error("Please enter all fields.");
        return;
      }
      const res = await createFidoRegisterOptions({ accountId: cosigner2.id });
      const raw = res.data.requestOptions || res.data;
      const optionsJSON = { ...raw };
      if (!optionsJSON.challenge) {
        throw new Error("Invalid WebAuthn challenge");
      }
      const credential = await startRegistration({ optionsJSON });
      const verifyRes = await fidoRegister({ accountId: cosigner2.id, credential });
      if (!verifyRes.data.verified) throw new Error("Verification failed");
      toast.success("Cosigner 2: Register Successfully.");
      setCosigner2(prev => ({ ...prev, hasCredentials: true }));
    } catch (error: any) {
      console.error(error);
      toast.error(formatErrorMessage(error, "Register Failed"));
    } finally {
      setCosigner2(prev => ({ ...prev, isRegistering: false }));
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="d-flex justify-content-center align-items-center gap-3 mb-1">
          <span className="fw-bold">Account ID:</span> <span>{primarySigner.id}</span>
          <span className="fw-bold ms-4">Service:</span> <span>{primarySigner.service}</span>
        </div>
      </div>
      <div className="row mb-4 g-4">
        <div className="col-12">
          {/* HSM Vault URL input */}
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className="fw-bold align-middle" style={{ minWidth: 0, fontSize: "1rem" }}>HSM Vault: </span>
            <input
              type="text"
              placeholder="e.g., http://pufhsm2.itracxing.xyz"
              value={config.hsmVaultUrl}
              onChange={e => setConfig(prev => ({ ...prev, hsmVaultUrl: e.target.value }))}
              className="form-control"
              style={{ minWidth: 0, flex: 1, fontSize: "1rem" }}
              autoComplete="off"
            />
          </div>

          {/* Passphrase Section */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="fw-bold" style={{ fontSize: "1rem" }}>Wallet Passphrases</span>
            </div>

            {/* Primary Signer Passphrase */}
            <div className="mt-2 mb-2">
              <label
                className="form-label text-muted text-start"
                style={{ fontSize: "0.9rem", display: "block" }}
              >
                Primary Signer ({primarySigner.id}) Passphrase
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <input
                    type={uiState.showPassphrases ? "text" : "password"}
                    placeholder="At least 8 chars, A-Z, a-z, 0-9"
                    value={primarySigner.passphrase}
                    onChange={e => setPrimarySigner(prev => ({ ...prev, passphrase: e.target.value }))}
                    className={`form-control ${
                      primarySigner.passphrase
                        ? (validatePassphrase(primarySigner.passphrase).isValid ? "is-valid" : "is-invalid")
                        : ""
                    }`}
                    style={{ fontSize: "0.9rem" }}
                    autoComplete="new-password"
                  />
                  {primarySigner.passphrase && !validatePassphrase(primarySigner.passphrase).isValid && (
                    <div className="invalid-feedback" style={{ fontSize: "0.8rem" }}>
                      {validatePassphrase(primarySigner.passphrase).message}
                    </div>
                  )}
                </div>
                <div className="col-6">
                  <input
                    type={uiState.showPassphrases ? "text" : "password"}
                    placeholder="Confirm wallet passphrase"
                    value={primarySigner.passphraseConfirm}
                    onChange={e => setPrimarySigner(prev => ({ ...prev, passphraseConfirm: e.target.value }))}
                    className={`form-control ${primarySigner.passphraseConfirm ?
                      (validatePassphraseMatch(primarySigner.passphrase, primarySigner.passphraseConfirm).isValid ? "is-valid" : "is-invalid") : ""}`}
                    style={{ fontSize: "0.9rem" }}
                    autoComplete="new-password"
                  />
                  {primarySigner.passphraseConfirm && !validatePassphraseMatch(primarySigner.passphrase, primarySigner.passphraseConfirm).isValid && (
                    <div className="invalid-feedback" style={{ fontSize: "0.8rem" }}>
                      {validatePassphraseMatch(primarySigner.passphrase, primarySigner.passphraseConfirm).message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cosigner Forms - Extracted to avoid duplication */}
          <hr className="my-4" />
          <div className="row">
            <CosignerForm
              cosignerNumber={1}
              cosigner={cosigner1}
              onUpdate={(updates) => setCosigner1(prev => ({ ...prev, ...updates }))}
              onRegister={handleRegistration1}
              showPasswords={uiState.showPassphrases}
              validatePassphrase={validatePassphrase}
              validatePassphraseMatch={validatePassphraseMatch}
            />

            <CosignerForm
              cosignerNumber={2}
              cosigner={cosigner2}
              onUpdate={(updates) => setCosigner2(prev => ({ ...prev, ...updates }))}
              onRegister={handleRegistration2}
              showPasswords={uiState.showPassphrases}
              validatePassphrase={validatePassphrase}
              validatePassphraseMatch={validatePassphraseMatch}
            />
          </div>
        </div>
      </div>
      <hr className="my-4" />
      <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
        <LoadingButton
          variant="info"
          loading={uiState.isCreatingWallet}
          onClick={async () => {
            try {
              if (!primarySigner.id || !cosigner1.id || !cosigner2.id) {
                toast.error("Please complete registration for all three members.");
                return;
              }

              // Check that cosigners are not the same as primary signer
              if (cosigner1.id === primarySigner.id) {
                toast.error("Cosigner 1 cannot be the same as Primary Signer.");
                return;
              }
              if (cosigner2.id === primarySigner.id) {
                toast.error("Cosigner 2 cannot be the same as Primary Signer.");
                return;
              }
              if (cosigner1.id === cosigner2.id) {
                toast.error("Cosigner 1 and Cosigner 2 cannot be the same.");
                return;
              }

              // Check that both cosigners are registered
              if (!cosigner1.hasCredentials) {
                toast.error("Cosigner 1 must complete FIDO registration before creating wallet.");
                return;
              }
              if (!cosigner2.hasCredentials) {
                toast.error("Cosigner 2 must complete FIDO registration before creating wallet.");
                return;
              }

              for (const id of [primarySigner.id, cosigner1.id, cosigner2.id]) {
                const userRes = await fetchUser(id);
                if (!userRes || userRes.data.error) {
                  toast.error(`User not found: ${id}`);
                  return;
                }
                if (userRes.data.credentialCount === 0) {
                  toast.error(`User ${id} has not completed FIDO register (no credentials).`);
                  return;
                }
              }

              if (!config.hsmVaultUrl) {
                toast.error("Please enter a valid HSM Vault URL.");
                return;
              }

              // Validate all passphrases
              if (!primarySigner.passphrase || !validatePassphrase(primarySigner.passphrase).isValid) {
                toast.error("Please enter a valid passphrase for Primary Signer.");
                return;
              }
              if (!cosigner1.passphrase || !validatePassphrase(cosigner1.passphrase).isValid) {
                toast.error("Please enter a valid passphrase for Cosigner 1.");
                return;
              }
              if (!cosigner2.passphrase || !validatePassphrase(cosigner2.passphrase).isValid) {
                toast.error("Please enter a valid passphrase for Cosigner 2.");
                return;
              }

              // Validate passphrase confirmations
              if (!validatePassphraseMatch(primarySigner.passphrase, primarySigner.passphraseConfirm).isValid) {
                toast.error("Primary Signer passphrase confirmation does not match.");
                return;
              }
              if (!validatePassphraseMatch(cosigner1.passphrase, cosigner1.passphraseConfirm).isValid) {
                toast.error("Cosigner 1 passphrase confirmation does not match.");
                return;
              }
              if (!validatePassphraseMatch(cosigner2.passphrase, cosigner2.passphraseConfirm).isValid) {
                toast.error("Cosigner 2 passphrase confirmation does not match.");
                return;
              }

              // Show confirmation modal before creating wallet
              const confirmMsg = `HSM Vault URL: ${config.hsmVaultUrl}\nPrimary Signer: ${primarySigner.id}\n` +
                `Cosigner 1: ${cosigner1.id}\nCosigner 2: ${cosigner2.id}\n\nProceed to create the wallet?`;

              showConfirm(
                "Confirm Wallet Creation",
                confirmMsg,
                async () => {
                  setUiState(prev => ({ ...prev, showConfirmModal: false }));
                  setUiState(prev => ({ ...prev, isCreatingWallet: true }));

                  try {
                    // Hash all passphrases before sending
                    const primaryPassphraseHash = await hashPassphrase(primarySigner.passphrase);
                    const cosigner1PassphraseHash = await hashPassphrase(cosigner1.passphrase);
                    const cosigner2PassphraseHash = await hashPassphrase(cosigner2.passphrase);

                    const res = await createWallet({
                      m: 2,
                      n: 3,
                      name: `${primarySigner.id}-${new Date().getTime()}`,
                      hsmVault: config.hsmVaultUrl,
                      participants: [
                        { userId: primarySigner.id, passphraseHash: primaryPassphraseHash },
                        { userId: cosigner1.id, passphraseHash: cosigner1PassphraseHash },
                        { userId: cosigner2.id, passphraseHash: cosigner2PassphraseHash },
                      ],
                    });

                    if (res.data && res.data.walletId) {
                      toast.success("Multisig wallet created successfully!\nBack to previous page.");

                      try {
                        await fetchHsmWalletUtils("faucet", res.data.address);
                        toast.success("System has sent 1 testnet BTC to the new wallet.");
                      } catch (faucetError) {
                        console.error("Faucet call failed:", faucetError);
                      }

                      if (config.isNew) {
                        setTimeout(() => router.push("/"), 2000);
                      } else {
                        setTimeout(() => window.location.reload(), 2000);
                      }
                    }
                  } catch (error: any) {
                    console.error(error);
                    toast.error(formatErrorMessage(error, "CreateWallet Failed"));
                  } finally {
                    setUiState(prev => ({ ...prev, isCreatingWallet: false }));
                  }
                },
              );
            } catch (error: any) {
              console.error(error);
              toast.error(formatErrorMessage(error, "CreateWallet Failed"));
            }
          }}
        >
          Create new Wallet
        </LoadingButton>
        <a
          href={config.isNew ? "/" : "/dashboard"}
          className="btn btn-outline-secondary"
          style={{ whiteSpace: "nowrap", fontSize: "1rem" }}
        >
          {config.isNew ? "Back to Homepage" : "Back to Dashboard"}
        </a>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={uiState.showConfirmModal}
        title={uiState.confirmModalData.title}
        message={uiState.confirmModalData.message}
        onConfirm={uiState.confirmModalData.onConfirm}
        onCancel={() => setUiState(prev => ({ ...prev, showConfirmModal: false }))}
        confirmText="Create Wallet"
        confirmButtonClass="btn-success"
      />
    </>
  );
}

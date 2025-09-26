import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import React, { useState, useEffect, useRef } from "react";
import { getCurrentUserInfo, formatErrorMessage } from "@/lib/utils/common";
import { fetchUser, createFidoRegisterOptions, fidoRegister } from "@/lib/api/api-client";

interface CredentialModalProps {
  label: string;
  icon: string;
}

export default function CredentialModal({ label, icon }: CredentialModalProps) {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [accountId, setAccountId] = useState("");
  const [authService, setAuthService] = useState("");
  const [credCount, setCredCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && modalRef.current) {
      import("bootstrap").then(({ Modal }) => {
        if (!modalRef.current) return;
        Modal.getOrCreateInstance(modalRef.current);
        modalRef.current.addEventListener("show.bs.modal", () => modalRef.current?.removeAttribute("inert"));
        modalRef.current.addEventListener("hide.bs.modal", () => {
          modalRef.current?.setAttribute("inert", "");
        });
      });
    }
  });

  useEffect(() => {
    async function loadUserData() {
      const tokenInfo = await getCurrentUserInfo();
      if (!tokenInfo) {
        router.push("/");
        return;
      }
      const { accountId, authService } = tokenInfo;

      setAccountId(accountId);
      setAuthService(authService);

      try {
        const response = await fetchUser(accountId);
        const user = response.data;
        setCredCount(user.credentialCount || 0);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    }

    loadUserData();
  }, [router]);

  const handleRegistration = async () => {
    setIsRegistering(true);
    try {
      [setAccountId, setAuthService].forEach((setter, index) => {
        const values = [accountId, authService];
        setter(values[index].trim());
      });

      const res = await createFidoRegisterOptions({
        accountId,
        appendMode: true,
      });
      const raw = res.data.requestOptions || res.data;
      const optionsJSON = { ...raw };
      if (!optionsJSON.challenge) {
        throw new Error("Invalid WebAuthn challenge");
      }
      const credential = await startRegistration({ optionsJSON });

      const verifyRes = await fidoRegister({
        accountId,
        credential,
        appendMode: true,
      });
      if (!verifyRes.data.verified) throw new Error("Verification failed");
      setMessage("Register Successfully.");
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setMessage(formatErrorMessage(error, "Register Failed"));
    } finally {
      setIsRegistering(false);
    }
  };

  const modalContent = (
    <div
      className="modal fade"
      id="credentialModal"
      tabIndex={-1}
      aria-labelledby="credentialModalLabel"
      ref={modalRef}
      inert
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="credentialModalLabel">Add new FIDO Device</h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="d-flex justify-content-center align-items-center gap-1 mb-1">
              <span className="fw-bold">Account ID:</span> <span>{accountId}</span>
              <span className="fw-bold ms-4">Service:</span> <span>{authService}</span>
            </div>
            <div className="d-flex justify-content-center align-items-center gap-1 mb-3">
              <span className="fw-bold ms-4">Number of Devices Registered:</span> <span>{credCount}</span>
            </div>
          </div>
          <div className="modal-footer">
            {message && (
              <div className="alert alert-warning py-2">{message}</div>
            )}
            <button
              onClick={handleRegistration}
              className="btn btn-info"
              disabled={isRegistering}
              style={{ whiteSpace: "nowrap", fontSize: "1rem" }}
            >
              Register FIDO Device
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="d-flex justify-content-center">
      <button type="button" className="nav-link text-secondary rounded btn btn-link w-100 text-start"
        data-bs-toggle="modal" data-bs-target="#credentialModal">
        <i className={`bi ${icon} me-2`}></i>{label}
      </button>
      {isMounted && createPortal(modalContent, document.body)}
    </div>
  );
}
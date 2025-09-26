import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CreateWallet from "../feature/wallet/CreateWallet";

interface CreateWalletModalProps {
  label: string;
  icon: string;
}

export default function CreateWalletModal({ label, icon }: CreateWalletModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

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

  const modalContent = (
    <div
      className="modal fade"
      id="createWalletModal"
      tabIndex={-1}
      aria-labelledby="createWalletModalLabel"
      ref={modalRef}
      inert
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="createWalletModalLabel">Create New MultiSig Wallet</h1>
          </div>
          <div className="modal-body">
            <CreateWallet />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="d-flex justify-content-center">
      <button type="button" className="nav-link text-secondary rounded btn btn-link w-100 text-start"
        data-bs-toggle="modal" data-bs-target="#createWalletModal">
        <i className={`bi ${icon} me-2`}></i>{label}
      </button>
      {isMounted && createPortal(modalContent, document.body)}
    </div>
  );
}
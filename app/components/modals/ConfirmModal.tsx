import React, { useEffect, useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "btn-primary",
}: ConfirmModalProps) {
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
              <div style={{ whiteSpace: "pre-line", textAlign: "left", paddingLeft: "0.5rem" }}>{message}</div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn ${confirmButtonClass}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef } from "react";
import type { WalletPhase } from "../wallet/store";
import type { WalletProviderDetail } from "../wallet/types";

export interface WalletDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  providers: readonly WalletProviderDetail[];
  phase?: WalletPhase;
  error?: string;
  onConnect: (detail: WalletProviderDetail) => Promise<void>;
  onClose: () => void;
}

export function WalletDialog({
  dialogRef,
  providers,
  phase,
  error,
  onConnect,
  onClose,
}: WalletDialogProps) {
  const isConnecting = phase === "CONNECTING";
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management when dialog opens
  useEffect(() => {
    if (dialogRef.current?.open) {
      // Focus first actionable element
      const firstBtn = dialogRef.current.querySelector<HTMLButtonElement>("button:not(:disabled)");
      firstBtn?.focus();
    }
  }, [dialogRef, providers, phase]);

  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="wallet-modal-dialog"
      onCancel={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="wallet-dialog-title"
      aria-modal="true"
    >
      <div className="wallet-modal-content">
        <div className="wallet-modal-header">
          <div className="modal-title-row">
            <span className="modal-eyebrow">Cryptographic Identity</span>
            <h2 id="wallet-dialog-title" className="modal-heading">
              Connect Supported Wallet
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close wallet selection dialog"
          >
            ✕
          </button>
        </div>

        <p className="modal-intro-text">
          Select a detected browser wallet extension. Precedent Resolver supports EIP-6963 and standard EIP-1193
          connections on GenLayer Studionet.
        </p>

        {error && (
          <div className="wallet-modal-error" role="alert">
            <span className="error-symbol" aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {isConnecting && (
          <div className="wallet-connecting-banner" role="status" aria-live="polite">
            <span className="connecting-spinner" aria-hidden="true" />
            <span>Requesting account and chain verification from wallet…</span>
          </div>
        )}

        <div className="wallet-providers-list">
          {providers.length > 0 ? (
            providers.map((detail) => (
              <button
                key={detail.info.uuid}
                type="button"
                className="wallet-provider-card-btn"
                onClick={() => void onConnect(detail)}
                disabled={isConnecting}
              >
                <div className="wallet-provider-info">
                  {detail.info.icon ? (
                    <img
                      src={detail.info.icon}
                      alt=""
                      aria-hidden="true"
                      className="wallet-provider-icon"
                      onError={(e) => {
                        // Fallback if provider icon fails to render
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="wallet-fallback-icon" aria-hidden="true">👛</span>
                  )}
                  <div className="wallet-provider-text">
                    <strong className="wallet-name">{detail.info.name}</strong>
                    <span className="wallet-rdns">{detail.info.rdns}</span>
                  </div>
                </div>
                <span className="wallet-connect-chevron" aria-hidden="true">→</span>
              </button>
            ))
          ) : (
            <div className="no-wallets-detected-box">
              <div className="no-wallets-icon" aria-hidden="true">🔌</div>
              <h3 className="no-wallets-title">No Supported Wallet Detected</h3>
              <p className="no-wallets-desc">
                No supported wallet extension is currently available to this browser. Install or enable a supported wallet,
                then refresh this page or reopen this dialog.
              </p>
            </div>
          )}
        </div>

        <div className="wallet-modal-footer">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}

import { useState } from "react";

export type TxPhase =
  | "IDLE"
  | "WAITING_FOR_WALLET"
  | "SUBMITTED"
  | "WAITING_FOR_FINALITY"
  | "VERIFYING_EXECUTION"
  | "VERIFYING_READBACK"
  | "SUCCESS"
  | "REJECTED"
  | "FAILED"
  | "RECONCILIATION_REQUIRED";

export interface TransactionHUDProps {
  phase: TxPhase;
  hash?: string;
  error?: string;
  explorerUrl?: string;
  onDismiss: () => void;
}

const PHASE_DETAILS: Record<
  TxPhase,
  { label: string; desc: string; isTerminal: boolean; isError: boolean }
> = {
  IDLE: { label: "Idle", desc: "No active transaction.", isTerminal: true, isError: false },
  WAITING_FOR_WALLET: {
    label: "Awaiting Wallet Signature",
    desc: "Please confirm the cryptographic signature in your connected wallet.",
    isTerminal: false,
    isError: false,
  },
  SUBMITTED: {
    label: "Transaction Dispatched",
    desc: "Transaction submitted to GenLayer Studionet.",
    isTerminal: false,
    isError: false,
  },
  WAITING_FOR_FINALITY: {
    label: "Awaiting Consensus Finality",
    desc: "Validators are executing intelligent contract consensus on Studionet.",
    isTerminal: false,
    isError: false,
  },
  VERIFYING_EXECUTION: {
    label: "Verifying Execution Result",
    desc: "Confirming that consensus execution completed successfully.",
    isTerminal: false,
    isError: false,
  },
  VERIFYING_READBACK: {
    label: "Verifying On-Chain Readback",
    desc: "Querying authoritative contract state history to confirm state mutation.",
    isTerminal: false,
    isError: false,
  },
  SUCCESS: {
    label: "Transaction Confirmed & Verified",
    desc: "State change proved on Studionet with authoritative historical readback.",
    isTerminal: true,
    isError: false,
  },
  REJECTED: {
    label: "Signature Rejected",
    desc: "The transaction request was rejected by the wallet user; unsigned reservation safely cleared.",
    isTerminal: true,
    isError: true,
  },
  FAILED: {
    label: "Transaction Failed",
    desc: "Transaction execution or readback failed. Inspect error details below.",
    isTerminal: true,
    isError: true,
  },
  RECONCILIATION_REQUIRED: {
    label: "Reconciliation Required",
    desc: "Ambiguous submission state preserved in durable journal; do not blindly resubmit.",
    isTerminal: true,
    isError: true,
  },
};

export function TransactionHUD({
  phase,
  hash,
  error,
  explorerUrl,
  onDismiss,
}: TransactionHUDProps) {
  const [copied, setCopied] = useState(false);

  if (phase === "IDLE") return null;

  const current = PHASE_DETAILS[phase];
  const isAlert = ["FAILED", "REJECTED", "RECONCILIATION_REQUIRED"].includes(phase);

  async function handleCopyHash() {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API unavailable
    }
  }

  // Stepped progress index: 1 to 5
  function getStepStatus(stepNum: number) {
    if (phase === "WAITING_FOR_WALLET") return stepNum === 1 ? "current" : "pending";
    if (phase === "SUBMITTED") return stepNum <= 2 ? (stepNum === 2 ? "current" : "complete") : "pending";
    if (phase === "WAITING_FOR_FINALITY") return stepNum <= 3 ? (stepNum === 3 ? "current" : "complete") : "pending";
    if (phase === "VERIFYING_EXECUTION") return stepNum <= 4 ? (stepNum === 4 ? "current" : "complete") : "pending";
    if (phase === "VERIFYING_READBACK") return stepNum <= 5 ? (stepNum === 5 ? "current" : "complete") : "pending";
    if (phase === "SUCCESS") return "complete";
    if (isAlert) return stepNum === 1 && phase === "REJECTED" ? "halted" : "failed";
    return "pending";
  }

  return (
    <aside
      className={`transaction-hud-banner phase-${phase.toLowerCase()} ${isAlert ? "hud-alert" : ""}`}
      role={isAlert ? "alert" : "status"}
      aria-live="polite"
      data-transaction-phase={phase}
    >
      <div className="hud-container">
        <div className="hud-status-row">
          <div className="hud-indicator-wrap">
            {!current.isTerminal ? (
              <span className="hud-spinner" aria-hidden="true" />
            ) : phase === "SUCCESS" ? (
              <span className="hud-seal-success" aria-hidden="true">✓</span>
            ) : phase === "REJECTED" ? (
              <span className="hud-seal-rejected" aria-hidden="true">⊘</span>
            ) : (
              <span className="hud-seal-error" aria-hidden="true">!</span>
            )}
          </div>

          <div className="hud-copy-block">
            <div className="hud-title-row">
              <strong className="hud-phase-name">{current.label}</strong>
            </div>
            <p className="hud-phase-desc">{current.desc}</p>
          </div>

          {current.isTerminal && (
            <button
              type="button"
              className="btn-dismiss-hud"
              onClick={onDismiss}
              aria-label="Dismiss transaction status"
            >
              Dismiss
            </button>
          )}
        </div>

        {/* Stepped Lifecycle Pipeline */}
        <div className="hud-pipeline-steps" aria-label="Transaction Lifecycle Progress">
          <div className={`pipe-step step-${getStepStatus(1)}`}>
            <span className="step-num">1</span>
            <span className="step-tag">Signature</span>
          </div>
          <div className="pipe-line" aria-hidden="true" />
          <div className={`pipe-step step-${getStepStatus(2)}`}>
            <span className="step-num">2</span>
            <span className="step-tag">Submission</span>
          </div>
          <div className="pipe-line" aria-hidden="true" />
          <div className={`pipe-step step-${getStepStatus(3)}`}>
            <span className="step-num">3</span>
            <span className="step-tag">Consensus Finality</span>
          </div>
          <div className="pipe-line" aria-hidden="true" />
          <div className={`pipe-step step-${getStepStatus(4)}`}>
            <span className="step-num">4</span>
            <span className="step-tag">Execution</span>
          </div>
          <div className="pipe-line" aria-hidden="true" />
          <div className={`pipe-step step-${getStepStatus(5)}`}>
            <span className="step-num">5</span>
            <span className="step-tag">State Verification</span>
          </div>
        </div>

        {/* Transaction Hash & Explorer Link */}
        {hash && (
          <div className="hud-hash-bar">
            <span className="hash-label">Transaction Hash:</span>
            <code className="hash-value" title={hash}>
              {hash}
            </code>
            <div className="hash-actions">
              <button
                type="button"
                className="btn-copy-hash"
                onClick={() => void handleCopyHash()}
                title="Copy full transaction hash to clipboard"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              {explorerUrl && (
                <a
                  href={`${explorerUrl}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-explorer-link"
                  aria-label={`View transaction ${hash} on GenLayer Explorer`}
                >
                  View on Explorer ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Detail */}
        {error && (
          <div className="hud-error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <div className="error-body">
              <strong>Details:</strong> {error}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

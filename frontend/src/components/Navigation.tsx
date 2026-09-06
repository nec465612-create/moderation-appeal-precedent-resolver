import { BrandLogo } from "./BrandLogo";
import type { ChainConfiguration, HexAddress } from "../wallet/types";

export interface NavigationProps {
  view?: {
    readonly connected: boolean;
    readonly chooserOpen: boolean;
    readonly canWrite: boolean;
    readonly action: "Disconnect" | "Switch wallet" | "Connect wallet";
    readonly badge: string;
  };
  chain?: ChainConfiguration;
  contractAddress?: HexAddress;
  onWalletAction: () => void;
  onToggleJournal: () => void;
  journalCount?: number;
}

export function Navigation({
  view,
  chain,
  contractAddress,
  onWalletAction,
  onToggleJournal,
  journalCount = 0,
}: NavigationProps) {
  const shortAddress = contractAddress
    ? `${contractAddress.slice(0, 6)}…${contractAddress.slice(-4)}`
    : undefined;

  return (
    <header className="desk-header">
      <div className="desk-header-container">
        <a href="#top" className="brand-anchor" aria-label="Precedent Resolver Home">
          <BrandLogo />
        </a>

        <nav className="desk-nav" aria-label="Main Workspaces">
          <a href="#overview" className="nav-link">Overview</a>
          <a href="#registry" className="nav-link">Precedent Registry</a>
          <a href="#appeals" className="nav-link">Appeals Casebook</a>
          <a href="#how" className="nav-link">How It Works</a>
        </nav>

        <div className="desk-meta-actions">
          {chain && (
            <div className="network-badge" title={`Connected to ${chain.name} (Chain ID: ${chain.id})`}>
              <span className="network-indicator-dot" aria-hidden="true" />
              <span className="network-name">{chain.name}</span>
              {shortAddress && (
                <span className="contract-address-chip" title={`Contract Address: ${contractAddress}`}>
                  {chain.explorerUrl ? (
                    <a
                      href={`${chain.explorerUrl}/address/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                      aria-label={`View contract ${contractAddress} on GenLayer Explorer`}
                    >
                      {shortAddress}
                    </a>
                  ) : (
                    shortAddress
                  )}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            className="journal-trigger-btn"
            onClick={onToggleJournal}
            title="Inspect local journal audit log and pending operations"
            aria-label={`Audit journal log (${journalCount} entries)`}
          >
            <span className="journal-icon" aria-hidden="true">§</span>
            <span className="journal-label">Audit Log</span>
            {journalCount > 0 && <span className="journal-badge">{journalCount}</span>}
          </button>

          <div className="wallet-actions">
            <span
              className={`wallet-status-badge ${view?.connected ? "is-connected" : "is-disconnected"}`}
              role="status"
              aria-live="polite"
            >
              {view?.badge ?? "Configuration pending"}
            </span>
            <button
              type="button"
              className={`btn-wallet-action ${view?.connected ? "btn-disconnect" : "btn-connect"}`}
              onClick={onWalletAction}
            >
              {view?.action ?? "Connect wallet"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

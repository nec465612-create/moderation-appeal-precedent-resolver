import type { Registry } from "../contract";

export interface ProductIntroProps {
  registry?: Registry;
  precedentsCount: number;
  appealsCount: number;
  isAuthority: boolean;
  userAddress?: string;
}

export function ProductIntro({
  registry,
  precedentsCount,
  appealsCount,
  isAuthority,
  userAddress,
}: ProductIntroProps) {
  return (
    <section id="overview" className="product-intro-section" aria-labelledby="intro-heading">
      <div className="intro-container">
        <div className="intro-badge-row">
          <span className="ink-eyebrow">Public Precedent Desk &amp; Moderation Casebook</span>
          <span className="guarantee-seal">Anti-Cherry-Picking Guarantee</span>
        </div>

        <h1 id="intro-heading" className="intro-headline">
          Deterministic Content Appeals Bound to Immutable Precedent Sets
        </h1>

        <p className="intro-lede">
          The core trust guarantee of <strong>Precedent Resolver</strong> is that an appellant cannot cherry-pick
          favorable precedent. Creating an appeal atomically freezes the complete active precedent set for that rule
          at the current registry revision. Independent GenLayer validators evaluate every frozen standard, and the
          contract deterministically derives the holding only after the entire record is classified.
        </p>

        {/* The Causal Chain Pipeline Visual */}
        <div className="causal-chain-card">
          <div className="causal-chain-header">
            <span className="chain-title">Legible Precedent Causality</span>
            <span className="chain-sub">How on-chain moderation precedent enforces non-selective justice</span>
          </div>

          <ol className="causal-chain-steps">
            <li className="chain-step">
              <div className="step-badge">01</div>
              <div className="step-content">
                <strong>Revisioned Registry</strong>
                <p>Authority maintains versioned rules with fixed REMOVED origin and UPHOLD or REVERSE standards.</p>
              </div>
            </li>
            <li className="chain-divider" aria-hidden="true">→</li>
            <li className="chain-step">
              <div className="step-badge">02</div>
              <div className="step-content">
                <strong>Immutable Snapshot</strong>
                <p>Filing an appeal copies all active precedents under that rule into an unalterable domain record.</p>
              </div>
            </li>
            <li className="chain-divider" aria-hidden="true">→</li>
            <li className="chain-step">
              <div className="step-badge">03</div>
              <div className="step-content">
                <strong>Consensus Labels</strong>
                <p>Validators classify every single item as MATERIAL, DISTINGUISHABLE, or UNKNOWN.</p>
              </div>
            </li>
            <li className="chain-divider" aria-hidden="true">→</li>
            <li className="chain-step">
              <div className="step-badge">04</div>
              <div className="step-content">
                <strong>Deterministic Holding</strong>
                <p>The contract reduces labels: all-UPHOLD confirms REMOVED, all-REVERSE yields RESTORED.</p>
              </div>
            </li>
            <li className="chain-divider" aria-hidden="true">→</li>
            <li className="chain-step">
              <div className="step-badge">05</div>
              <div className="step-content">
                <strong>Public Verification</strong>
                <p>Anyone inspects historical snapshot revisions, citations, and consensus records on-chain.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Quick Metrics & User Role Ledger */}
        <div className="intro-ledger-bar">
          <div className="ledger-cell">
            <span className="cell-label">Registry Revision</span>
            <span className="cell-value">v{registry?.revision ?? "0"}</span>
            <span className="cell-meta">Historical updates</span>
          </div>
          <div className="ledger-cell">
            <span className="cell-label">Active Precedents</span>
            <span className="cell-value">{precedentsCount}</span>
            <span className="cell-meta">Currently in active rule</span>
          </div>
          <div className="ledger-cell">
            <span className="cell-label">Recorded Appeals</span>
            <span className="cell-value">{appealsCount}</span>
            <span className="cell-meta">Frozen case dossiers</span>
          </div>
          <div className="ledger-cell">
            <span className="cell-label">Viewer Persona</span>
            <span className={`cell-value role-badge ${isAuthority ? "role-authority" : userAddress ? "role-appellant" : "role-public"}`}>
              {isAuthority ? "Registry Authority" : userAddress ? "Appellant / Caller" : "Public Observer"}
            </span>
            <span className="cell-meta">
              {isAuthority ? "Can add/retire standards" : userAddress ? "Can create & freeze appeals" : "Read-only inspection"}
            </span>
          </div>
        </div>

        {/* Quick Action Navigation Jumps */}
        <div className="intro-action-jumps">
          <a href="#registry" className="btn-jump btn-primary-jump">
            Inspect Precedent Registry
          </a>
          <a href="#appeals" className="btn-jump btn-secondary-jump">
            Browse Appeals Casebook
          </a>
          <a href="#how" className="btn-jump btn-tertiary-jump">
            Read Jurisprudence &amp; Docs
          </a>
        </div>
      </div>
    </section>
  );
}

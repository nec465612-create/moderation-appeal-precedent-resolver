import { useState } from "react";
import type { AppealRecord, Precedent, Registry } from "../contract";

export interface AppealsWorkspaceProps {
  appeals: AppealRecord[];
  rule: string;
  activePrecedents: Precedent[];
  registry?: Registry;
  userAddress?: string;
  canWrite: boolean;
  isAuthority: boolean;
  onCreateAppeal: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onReplaceAppeal: (item: AppealRecord, event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCaseAction: (
    item: AppealRecord,
    method: "freeze_appeal" | "resolve_appeal" | "retry_appeal",
    expectedPhase: string
  ) => Promise<void>;
}

export function AppealsWorkspace({
  appeals,
  rule,
  activePrecedents,
  registry,
  userAddress,
  canWrite,
  isAuthority,
  onCreateAppeal,
  onReplaceAppeal,
  onCaseAction,
}: AppealsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "frozen" | "resolved">("all");
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [contentLength, setContentLength] = useState(0);
  const [rationaleLength, setRationaleLength] = useState(0);

  const filteredAppeals = appeals.filter((item) => {
    if (activeTab === "draft") return item.phase === "BASE_DRAFT";
    if (activeTab === "frozen") return item.phase === "FROZEN";
    if (activeTab === "resolved") return ["DONE", "EXHAUSTED"].includes(item.phase);
    return true;
  });

  function renderOutcomeBadge(outcome: string, phase: string) {
    if (!outcome) {
      if (phase === "BASE_DRAFT") return <span className="outcome-badge outcome-draft">Draft Preparation</span>;
      if (phase === "FROZEN") return <span className="outcome-badge outcome-pending">Awaiting Consensus</span>;
      return <span className="outcome-badge outcome-pending">Awaiting Resolution</span>;
    }

    switch (outcome) {
      case "RESTORED":
        return <span className="outcome-badge outcome-restored">RESTORED (Reversal Granted)</span>;
      case "REMOVED":
        return <span className="outcome-badge outcome-removed">REMOVED (Sanction Upheld)</span>;
      case "CONFLICTING_PRECEDENTS":
        return <span className="outcome-badge outcome-conflicting">CONFLICTING PRECEDENTS</span>;
      case "NO_CONTROLLING_PRECEDENT":
        return <span className="outcome-badge outcome-no-controlling">NO CONTROLLING PRECEDENT</span>;
      case "UNRESOLVED":
        return <span className="outcome-badge outcome-unresolved">UNRESOLVED (Retry Eligible)</span>;
      case "EXHAUSTED":
        return <span className="outcome-badge outcome-exhausted">EXHAUSTED (3 Retries Reached)</span>;
      default:
        return <span className="outcome-badge">{outcome}</span>;
    }
  }

  function getDerivationNarrative(item: AppealRecord) {
    const labels = item.result?.labels;
    const snapshot = item.domain?.snapshot ?? [];
    if (!labels || labels.length === 0 || !item.outcome) {
      return null;
    }

    const materialHoldings = labels.flatMap((label, idx) => {
      if (label === "MATERIAL" && snapshot[idx]) {
        return [snapshot[idx].holding];
      }
      return [];
    });

    const hasUnknown = labels.includes("UNKNOWN");
    const upholdCount = materialHoldings.filter((h) => h === "UPHOLD").length;
    const reverseCount = materialHoldings.filter((h) => h === "REVERSE").length;

    if (hasUnknown) {
      return "Validators recorded ambiguous UNKNOWN classification on one or more items; case marked UNRESOLVED pending retry.";
    }
    if (materialHoldings.length === 0) {
      return "Zero frozen precedents were classified as MATERIAL; deterministic holding is NO_CONTROLLING_PRECEDENT.";
    }
    if (upholdCount > 0 && reverseCount > 0) {
      return `Opposing material precedents found (${upholdCount} UPHOLD, ${reverseCount} REVERSE); deterministic holding is CONFLICTING_PRECEDENTS.`;
    }
    if (reverseCount > 0 && upholdCount === 0) {
      return `All ${reverseCount} material precedent(s) held REVERSE; deterministic holding is RESTORED.`;
    }
    if (upholdCount > 0 && reverseCount === 0) {
      return `All ${upholdCount} material precedent(s) held UPHOLD; deterministic holding is REMOVED.`;
    }
    return null;
  }

  return (
    <section id="appeals" className="workspace-section appeals-workspace" aria-labelledby="appeals-heading">
      <div className="section-header-row">
        <div>
          <span className="ink-eyebrow">Frozen Casebook Dossiers</span>
          <h2 id="appeals-heading" className="section-title">Appeals Casebook</h2>
          <p className="section-subtitle">
            Every appeal locks an immutable snapshot of all active precedents under its rule at creation.
            Validators label each precedent item-by-item, and the contract derives the final outcome.
          </p>
        </div>

        <div className="appeals-stats-tag">
          <span className="stats-label">Filed Appeals</span>
          <span className="stats-number">{appeals.length}</span>
        </div>
      </div>

      {/* Appeals Filter Tabs */}
      <div className="appeals-filter-bar">
        <div className="precedent-filter-tabs" role="tablist" aria-label="Filter Appeals by Lifecycle Phase">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`filter-tab-btn ${activeTab === "all" ? "is-selected" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Appeals ({appeals.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "draft"}
            className={`filter-tab-btn ${activeTab === "draft" ? "is-selected" : ""}`}
            onClick={() => setActiveTab("draft")}
          >
            Drafts ({appeals.filter((a) => a.phase === "BASE_DRAFT").length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "frozen"}
            className={`filter-tab-btn ${activeTab === "frozen" ? "is-selected" : ""}`}
            onClick={() => setActiveTab("frozen")}
          >
            Frozen / In Review ({appeals.filter((a) => a.phase === "FROZEN").length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "resolved"}
            className={`filter-tab-btn ${activeTab === "resolved" ? "is-selected" : ""}`}
            onClick={() => setActiveTab("resolved")}
          >
            Resolved ({appeals.filter((a) => ["DONE", "EXHAUSTED"].includes(a.phase)).length})
          </button>
        </div>

        <a href="#file-appeal" className="btn-jump-file-appeal">
          + File New Appeal
        </a>
      </div>

      {/* Appeals Dossier List */}
      <div className="appeals-dossier-list">
        {filteredAppeals.length === 0 ? (
          <div className="empty-appeals-state">
            <div className="empty-icon" aria-hidden="true">📂</div>
            <h3>No Appeals Recorded</h3>
            <p>
              {activeTab !== "all"
                ? `There are no appeals matching the "${activeTab}" filter.`
                : "No moderation appeals have been filed yet. Connect as an appellant to file the first appeal."}
            </p>
          </div>
        ) : (
          filteredAppeals.map((item) => {
            const isAppellant = Boolean(
              userAddress && item.primary.toLowerCase() === userAddress.toLowerCase()
            );
            const isEditing = editingCaseId === item.id;
            const derivationNarrative = getDerivationNarrative(item);

            return (
              <article key={item.id} className={`appeal-dossier-card phase-${item.phase.toLowerCase()}`}>
                {/* Dossier Header */}
                <div className="dossier-card-header">
                  <div className="dossier-id-block">
                    <span className="dossier-citation">Appeal Case #{item.id}</span>
                    <span className={`phase-pill phase-pill-${item.phase.toLowerCase()}`}>
                      {item.phase.replace("_", " ")}
                    </span>
                    <span className="dossier-rule-tag">Rule: {item.base.rule_id}</span>
                    <span className="dossier-revision-tag">Rev. #{item.revision}</span>
                  </div>

                  <div className="dossier-parties">
                    <div className="party-chip party-appellant" title={`Appellant: ${item.primary}`}>
                      <span className="party-role">Appellant:</span>
                      <span className="party-address">
                        {item.primary.slice(0, 6)}…{item.primary.slice(-4)}
                      </span>
                      {isAppellant && <span className="you-badge">(You)</span>}
                    </div>
                    <div className="party-chip party-authority" title={`Authority: ${item.secondary}`}>
                      <span className="party-role">Authority:</span>
                      <span className="party-address">
                        {item.secondary.slice(0, 6)}…{item.secondary.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Opposing Outcome / Holdings Bar */}
                <div className="dossier-outcomes-bar">
                  <div className="disposition-original-box">
                    <span className="disposition-label">Original Disposition:</span>
                    <span className="disposition-value">{item.base.original_disposition}</span>
                  </div>

                  <div className="outcome-result-box">
                    <span className="outcome-label">Result / Holding:</span>
                    {renderOutcomeBadge(item.outcome, item.phase)}
                  </div>
                </div>

                {/* Appealed Content & Rationale */}
                <div className="dossier-content-body">
                  <div className="content-segment">
                    <span className="segment-label">Appealed Public Content:</span>
                    <blockquote className="appealed-content-quote">
                      {item.base.content}
                    </blockquote>
                  </div>

                  <div className="rationale-segment">
                    <span className="segment-label">Appellant Rationale:</span>
                    <p className="appellant-rationale-text">{item.base.rationale}</p>
                  </div>
                </div>

                {/* Immutable Precedent Snapshot Seal */}
                <div className="snapshot-seal-container">
                  <div className="snapshot-seal-header">
                    <div className="seal-meta">
                      <span className="seal-emblem" aria-hidden="true">🔒</span>
                      <span className="seal-title">Immutable Precedent Snapshot</span>
                      <span className="seal-revision-badge">
                        Registry Revision #{item.domain.snapshot_revision}
                      </span>
                    </div>
                    <div className="seal-count-badge">
                      {item.domain.snapshot.length} Precedent(s) Frozen
                    </div>
                  </div>

                  <div className="snapshot-seal-notice">
                    <small>
                      This precedent set was frozen atomically upon appeal creation. The appellant could not omit adverse
                      precedents, and subsequent registry modifications cannot alter this case record.
                    </small>
                  </div>

                  {item.domain.snapshot.length === 0 ? (
                    <div className="snapshot-empty-row">
                      <em>Zero active precedents were registered under rule &ldquo;{item.base.rule_id}&rdquo; at snapshot revision #{item.domain.snapshot_revision}.</em>
                    </div>
                  ) : (
                    <div className="frozen-precedents-ledger">
                      <div className="ledger-head">
                        <span className="col-idx">#</span>
                        <span className="col-holding">Holding</span>
                        <span className="col-text">Hypothetical Standard</span>
                        <span className="col-label">Validator Classification</span>
                      </div>

                      {item.domain.snapshot.map((prec, idx) => {
                        const validatorLabel = item.result?.labels?.[idx];
                        const isUphold = prec.holding === "UPHOLD";

                        return (
                          <div key={prec.id} className="ledger-row">
                            <span className="col-idx">{idx + 1}</span>
                            <span className="col-holding">
                              <span className={`mini-holding-pill ${isUphold ? "pill-uphold" : "pill-reverse"}`}>
                                {prec.holding}
                              </span>
                            </span>
                            <span className="col-text">
                              <strong className="prec-id-tag">§{prec.id}</strong> {prec.text}
                            </span>
                            <span className="col-label">
                              {validatorLabel ? (
                                <span
                                  className={`validator-label-pill label-${validatorLabel.toLowerCase()}`}
                                  title={`Validator Consensus: ${validatorLabel}`}
                                >
                                  {validatorLabel}
                                </span>
                              ) : (
                                <span className="validator-label-pending">
                                  {item.phase === "BASE_DRAFT" ? "Pending Freeze" : "Pending Consensus"}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {derivationNarrative && (
                    <div className="derivation-narrative-callout">
                      <strong>Consensus Derivation:</strong> {derivationNarrative}
                    </div>
                  )}
                </div>

                {/* Workflow Actions */}
                <div className="dossier-action-footer">
                  {/* Draft editing for appellant */}
                  {canWrite && isAppellant && item.phase === "BASE_DRAFT" && (
                    <div className="draft-actions-tray">
                      {!isEditing ? (
                        <div className="draft-button-row">
                          <button
                            type="button"
                            className="btn-edit-draft"
                            onClick={() => setEditingCaseId(item.id)}
                          >
                            Edit Draft Content
                          </button>
                          <button
                            type="button"
                            className="btn-freeze-appeal"
                            onClick={() => void onCaseAction(item, "freeze_appeal", "FROZEN")}
                            title="Lock this appeal permanently into FROZEN phase for consensus review"
                          >
                            Freeze Appeal (Lock Snapshot)
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            void onReplaceAppeal(item, e);
                            setEditingCaseId(null);
                          }}
                          className="replace-draft-form"
                        >
                          <h4>Edit Draft Appeal Dossier</h4>
                          <div className="form-field-group">
                            <label className="form-label">
                              Appealed Content (max 1536 bytes)
                            </label>
                            <textarea
                              name="content"
                              defaultValue={item.base.content}
                              maxLength={1536}
                              required
                              className="form-textarea"
                              rows={3}
                            />
                          </div>

                          <div className="form-field-group">
                            <label className="form-label">
                              Appellant Rationale (max 512 bytes)
                            </label>
                            <textarea
                              name="rationale"
                              defaultValue={item.base.rationale}
                              maxLength={512}
                              required
                              className="form-textarea"
                              rows={2}
                            />
                          </div>

                          <div className="form-submit-row">
                            <button
                              type="button"
                              className="btn-cancel"
                              onClick={() => setEditingCaseId(null)}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="btn-save-draft">
                              Replace Draft
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Frozen Phase: Consensus Resolution */}
                  {canWrite && item.phase === "FROZEN" && (
                    <div className="consensus-resolution-tray">
                      <div className="action-guidance">
                        <span>This case is frozen with an immutable precedent snapshot. Any actor may trigger consensus evaluation.</span>
                      </div>
                      <button
                        type="button"
                        className="btn-resolve-appeal"
                        onClick={() => void onCaseAction(item, "resolve_appeal", "DONE")}
                      >
                        Resolve Appeal (Run Consensus)
                      </button>
                    </div>
                  )}

                  {/* Unresolved Phase: Consensus Retry */}
                  {canWrite && item.phase === "UNRESOLVED" && (
                    <div className="consensus-retry-tray">
                      <div className="action-guidance">
                        <span>Ambiguous evaluation detected. Anyone can retry frozen consensus evaluation after the 60s cooldown.</span>
                      </div>
                      <button
                        type="button"
                        className="btn-retry-appeal"
                        onClick={() => void onCaseAction(item, "retry_appeal", "DONE")}
                      >
                        Retry Frozen Appeal
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* File New Appeal Workspace */}
      <div id="file-appeal" className="file-appeal-card">
        <div className="file-appeal-header">
          <div className="eyebrow-container">
            <span className="ink-eyebrow">Appellant Desk</span>
            <span className="active-rule-pill">Rule: {rule}</span>
          </div>
          <h3>File New Moderation Appeal</h3>
          <p className="file-appeal-desc">
            Submit synthetic public text challenging an initial <code>REMOVED</code> disposition.
            Submitting this form atomically binds all currently active precedents under rule &ldquo;{rule}&rdquo;
            at Registry Revision #{registry?.revision ?? "0"}.
          </p>
        </div>

        {/* Live Snapshot Preview */}
        <div className="live-snapshot-preview">
          <div className="preview-header">
            <span className="preview-title">Live Precedent Snapshot Preview</span>
            <span className="preview-count">
              {activePrecedents.length} active precedent(s) will be permanently frozen
            </span>
          </div>

          {activePrecedents.length === 0 ? (
            <div className="preview-empty-warning">
              ⚠️ Warning: There are currently zero active precedents under rule &ldquo;{rule}&rdquo;.
              Creating an appeal now will freeze an empty precedent snapshot, resulting in a deterministic
              <code>NO_CONTROLLING_PRECEDENT</code> holding upon resolution.
            </div>
          ) : (
            <div className="preview-chips-list">
              {activePrecedents.map((p, idx) => (
                <div key={p.id} className="preview-chip">
                  <span className="preview-idx">#{idx + 1}</span>
                  <span className={`preview-holding ${p.holding === "UPHOLD" ? "pill-uphold" : "pill-reverse"}`}>
                    {p.holding}
                  </span>
                  <span className="preview-text" title={p.text}>
                    §{p.id}: {p.text.length > 80 ? `${p.text.slice(0, 80)}…` : p.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {canWrite && !isAuthority ? (
          <form onSubmit={onCreateAppeal} className="create-appeal-form">
            <div className="form-field-group">
              <div className="label-with-counter">
                <label htmlFor="appeal-content-input" className="form-label">
                  Public Synthetic Content Under Appeal (max 1536 bytes)
                </label>
                <span className={`char-counter ${contentLength > 1450 ? "is-near-limit" : ""}`}>
                  {contentLength} / 1536 bytes
                </span>
              </div>
              <textarea
                id="appeal-content-input"
                name="content"
                maxLength={1536}
                required
                onChange={(e) => setContentLength(new TextEncoder().encode(e.target.value).length)}
                placeholder="Enter the exact text that was moderated (e.g. 'Public commentary critiquing administrative oversight...')"
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-field-group">
              <div className="label-with-counter">
                <label htmlFor="appeal-rationale-input" className="form-label">
                  Appellant Legal / Procedural Rationale (max 512 bytes)
                </label>
                <span className={`char-counter ${rationaleLength > 480 ? "is-near-limit" : ""}`}>
                  {rationaleLength} / 512 bytes
                </span>
              </div>
              <textarea
                id="appeal-rationale-input"
                name="rationale"
                maxLength={512}
                required
                onChange={(e) => setRationaleLength(new TextEncoder().encode(e.target.value).length)}
                placeholder="Explain why the precedent standards for this rule demand reversing the removal..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="compliance-warning-card">
              <div className="warning-icon" aria-hidden="true">⚠️</div>
              <div className="warning-text">
                <strong>Public Data &amp; Jurisdictional Notice:</strong>
                <p>
                  All submitted text will be public and permanent. Do not include private information, credentials or personal records.
                  Assessment of this exact submitted material only; not verification of external facts.
                  Resolution under the frozen precedent set; no finding about real-world conduct.
                </p>
              </div>
            </div>

            <div className="form-submit-row">
              <span className="submit-hint">
                Original disposition is fixed to <code>REMOVED</code>.
              </span>
              <button
                type="submit"
                className="btn-create-appeal"
                disabled={!canWrite}
              >
                Create Appeal With Complete Active Snapshot
              </button>
            </div>
          </form>
        ) : isAuthority ? (
          <div className="authority-cannot-appeal-notice">
            <p>
              <strong>Authority Account Active:</strong> As the designated registry authority, your address is the secondary party
              on all appeals. To file an appeal as an appellant, connect with a non-authority wallet account.
            </p>
          </div>
        ) : (
          <div className="connect-to-appeal-notice">
            <p>
              Connect a supported wallet (MetaMask, OKX Wallet, or Rabby) to file a public appeal dossier.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

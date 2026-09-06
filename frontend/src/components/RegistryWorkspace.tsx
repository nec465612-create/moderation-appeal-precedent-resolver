import { useState } from "react";
import type { Precedent, Registry } from "../contract";

export interface RegistryWorkspaceProps {
  registry?: Registry;
  precedents: Precedent[];
  rule: string;
  onRuleChange: (rule: string) => void;
  isAuthority: boolean;
  canWrite: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddPrecedent: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onRetirePrecedent: (item: Precedent) => Promise<void>;
  configured: boolean;
}

const COMMON_RULES = [
  { id: "harassment", label: "Harassment" },
  { id: "impersonation", label: "Impersonation" },
  { id: "spam", label: "Spam & Deception" },
  { id: "copyright", label: "Copyright Infringement" },
  { id: "hate_speech", label: "Hate Speech" },
  { id: "privacy_breach", label: "Privacy Breach" },
];

export function RegistryWorkspace({
  registry,
  precedents,
  rule,
  onRuleChange,
  isAuthority,
  canWrite,
  isRefreshing,
  onRefresh,
  onAddPrecedent,
  onRetirePrecedent,
  configured,
}: RegistryWorkspaceProps) {
  const [filter, setFilter] = useState<"all" | "active" | "retired">("all");
  const [addTextLength, setAddTextLength] = useState(0);

  const activeCount = precedents.filter((p) => p.active).length;
  const retiredCount = precedents.filter((p) => !p.active).length;

  const filteredPrecedents = precedents.filter((item) => {
    if (filter === "active") return item.active;
    if (filter === "retired") return !item.active;
    return true;
  });

  return (
    <section id="registry" className="workspace-section registry-workspace" aria-labelledby="registry-heading">
      <div className="section-header-row">
        <div>
          <span className="ink-eyebrow">Normative Corpus</span>
          <h2 id="registry-heading" className="section-title">Precedent Registry</h2>
          <p className="section-subtitle">
            Authoritative revisioned hypothetical standards. When an appeal is initiated under a rule,
            the active precedent set is frozen immediately to prevent cherry-picking.
          </p>
        </div>

        <div className="section-header-actions">
          <div className="registry-revision-tag" title="Monotonically increasing registry state revision">
            <span className="revision-label">Registry Revision</span>
            <span className="revision-number">#{registry?.revision ?? "0"}</span>
          </div>
          <button
            type="button"
            className="btn-refresh"
            onClick={onRefresh}
            disabled={!configured || isRefreshing}
            aria-label="Refresh Precedent Registry from Studionet"
          >
            <span className={`refresh-icon ${isRefreshing ? "is-spinning" : ""}`} aria-hidden="true">↻</span>
            <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Rule Selection & Filtering Bar */}
      <div className="registry-controls-bar">
        <div className="rule-search-box">
          <label htmlFor="rule-id-input" className="rule-input-label">
            Active Rule Scope:
          </label>
          <div className="rule-input-wrapper">
            <input
              id="rule-id-input"
              type="text"
              value={rule}
              pattern="[a-z][a-z0-9_]{0,15}"
              maxLength={16}
              onChange={(e) => onRuleChange(e.target.value.toLowerCase().trim())}
              placeholder="e.g. harassment"
              className="rule-text-input"
              title="Lowercase alphanumeric string starting with a letter, up to 16 characters"
            />
            <span className="input-hint-badge">[a-z0-9_] ≤16</span>
          </div>
        </div>

        <div className="rule-chips-list" role="group" aria-label="Standard Rule Presets">
          <span className="chips-label">Presets:</span>
          {COMMON_RULES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`rule-chip-btn ${rule === preset.id ? "is-active-chip" : ""}`}
              onClick={() => onRuleChange(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="precedent-filter-tabs" role="tablist" aria-label="Filter by Precedent Status">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={`filter-tab-btn ${filter === "all" ? "is-selected" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({precedents.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "active"}
            className={`filter-tab-btn ${filter === "active" ? "is-selected" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "retired"}
            className={`filter-tab-btn ${filter === "retired" ? "is-selected" : ""}`}
            onClick={() => setFilter("retired")}
          >
            Retired ({retiredCount})
          </button>
        </div>
      </div>

      {/* Precedents Grid */}
      <div className="precedents-corpus-grid">
        {filteredPrecedents.length === 0 ? (
          <div className="empty-corpus-state">
            <div className="empty-icon" aria-hidden="true">📜</div>
            <h3>No Precedents Found for Rule &ldquo;{rule}&rdquo;</h3>
            <p>
              {filter !== "all"
                ? `There are no ${filter} precedents matching this rule.`
                : `The registry authority has not registered any hypothetical precedents under rule "${rule}".`}
            </p>
            {isAuthority && (
              <p className="empty-authority-hint">
                As the registry authority, you can register the first normative standard below.
              </p>
            )}
          </div>
        ) : (
          filteredPrecedents.map((item) => {
            const isUphold = item.holding === "UPHOLD";
            return (
              <article
                key={item.id}
                className={`precedent-citation-card ${item.active ? "is-active" : "is-retired"} ${
                  isUphold ? "holding-uphold" : "holding-reverse"
                }`}
              >
                <div className="precedent-card-header">
                  <div className="precedent-citation-meta">
                    <span className="citation-number">§ {item.id}</span>
                    <span className="precedent-rule-tag">{item.rule_id}</span>
                  </div>
                  <div className="precedent-status-badge">
                    {item.active ? (
                      <span className="status-pill status-active" title="Included in future appeal snapshots">
                        ● Active Corpus
                      </span>
                    ) : (
                      <span className="status-pill status-retired" title="Preserved for historical appeals; excluded from new snapshots">
                        ○ Retired (v{item.retired_revision})
                      </span>
                    )}
                  </div>
                </div>

                <div className="precedent-holding-banner">
                  <div className={`holding-badge ${isUphold ? "badge-uphold" : "badge-reverse"}`}>
                    <span className="holding-verb">{item.holding}</span>
                    <span className="holding-explanation">
                      {isUphold ? "Maintain Removal" : "Order Restoration"}
                    </span>
                  </div>
                  <div className="fixed-origin-badge" title="Under Stage 2 R10 D4, all appeals test removals">
                    <span className="origin-label">Original:</span>
                    <span className="origin-value">{item.original_disposition}</span>
                  </div>
                </div>

                <div className="precedent-fact-body">
                  <p className="precedent-text">{item.text}</p>
                </div>

                <div className="precedent-card-footer">
                  <div className="precedent-provenance">
                    <span className="provenance-item">Added at rev. #{item.added_revision}</span>
                    {!item.active && (
                      <span className="provenance-item">Retired at rev. #{item.retired_revision}</span>
                    )}
                  </div>

                  {isAuthority && item.active && (
                    <button
                      type="button"
                      className="btn-retire-precedent"
                      onClick={() => void onRetirePrecedent(item)}
                      disabled={!canWrite}
                      title="Retire this precedent so it is excluded from future appeal snapshots (irreversible)"
                    >
                      Retire Precedent
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Authority Precedent Registry Desk */}
      {isAuthority ? (
        <div className="authority-desk-card">
          <div className="authority-desk-header">
            <span className="authority-seal-pill">Registry Authority Workspace</span>
            <h3>Add Normative Precedent</h3>
            <p className="authority-desc">
              Authoritative standards define hypothetical fact patterns with binding holdings under rule &ldquo;{rule}&rdquo;.
              New additions increment the global registry revision and immediately apply to subsequent appeal snapshots.
            </p>
          </div>

          <form onSubmit={onAddPrecedent} className="add-precedent-form">
            <div className="form-grid-row">
              <div className="form-field-group">
                <label htmlFor="precedent-rule-target" className="form-label">
                  Target Rule ID
                </label>
                <input
                  id="precedent-rule-target"
                  type="text"
                  value={rule}
                  readOnly
                  disabled
                  className="form-input-readonly"
                />
                <span className="form-hint">Controlled by active rule selector above</span>
              </div>

              <div className="form-field-group">
                <label htmlFor="precedent-holding-select" className="form-label">
                  Normative Holding
                </label>
                <select id="precedent-holding-select" name="holding" className="form-select" required>
                  <option value="UPHOLD">UPHOLD (Maintain Removal)</option>
                  <option value="REVERSE">REVERSE (Order Content Restored)</option>
                </select>
                <span className="form-hint">Specifies outcome if appeal material matches this standard</span>
              </div>
            </div>

            <div className="form-field-group">
              <div className="label-with-counter">
                <label htmlFor="precedent-text-input" className="form-label">
                  Hypothetical Normative Fact Pattern (max 512 bytes)
                </label>
                <span className={`char-counter ${addTextLength > 480 ? "is-near-limit" : ""}`}>
                  {addTextLength} / 512 bytes
                </span>
              </div>
              <textarea
                id="precedent-text-input"
                name="text"
                maxLength={512}
                required
                onChange={(e) => setAddTextLength(new TextEncoder().encode(e.target.value).length)}
                placeholder="Describe the normative hypothetical situation and boundary condition (e.g. 'Coordinated mass pinging of a private individual without prior public engagement warrants removal...')"
                className="form-textarea precedent-textarea"
                rows={3}
              />
            </div>

            <div className="form-submit-row">
              <span className="fixed-origin-note">
                Disposition is permanently fixed to <code>REMOVED</code> in adherence to the single-contract moderation protocol.
              </span>
              <button
                type="submit"
                className="btn-add-precedent"
                disabled={!canWrite}
              >
                Add Public Precedent
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="observer-callout-card">
          <div className="observer-icon" aria-hidden="true">⚖</div>
          <div className="observer-copy">
            <strong>Public Observation Mode</strong>
            <p>
              You are inspecting the registry as a public verifier. Only the designated authority account
              {registry?.authority ? ` (${registry.authority.slice(0, 6)}…${registry.authority.slice(-4)})` : ""} can
              introduce new precedent standards or retire existing ones. Anyone with a supported wallet can file appeals,
              trigger consensus evaluations, and audit historical records.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export function Documentation() {
  return (
    <section id="how" className="workspace-section docs-workspace" aria-labelledby="docs-heading">
      <div className="section-header-row">
        <div>
          <span className="ink-eyebrow">Jurisprudence &amp; Technical Architecture</span>
          <h2 id="docs-heading" className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Complete public operating manual for Precedent Resolver, explaining GenLayer intelligent consensus,
            the anti-cherry-picking guarantee, lifecycle finality, and deterministic decision mechanics.
          </p>
        </div>
      </div>

      <div className="docs-grid">
        {/* 1. Purpose & Trust Guarantee */}
        <article className="doc-card">
          <div className="doc-card-number">01</div>
          <h3>Purpose &amp; Anti-Cherry-Picking Guarantee</h3>
          <p>
            In traditional moderation appeals, appellants often cite favorable isolated cases while omitting unfavorable
            rulings. <strong>Precedent Resolver</strong> eliminates selective citation at the protocol level.
          </p>
          <p>
            When an appellant files an appeal under a given rule, the GenLayer intelligent contract takes an atomic,
            immutable domain snapshot of <em>every active precedent</em> currently registered for that rule. Neither party
            can add, omit, reorder, or alter the precedent set once the appeal is created.
          </p>
        </article>

        {/* 2. GenLayer's Role */}
        <article className="doc-card">
          <div className="doc-card-number">02</div>
          <h3>GenLayer Intelligent Contract Consensus</h3>
          <p>
            GenLayer executes non-deterministic natural-language classification directly within smart contract execution.
            Rather than trusting an off-chain centralized oracle, participating validator nodes independently evaluate
            the appealed content against each frozen precedent standard.
          </p>
          <p>
            Validators execute consensus on exact structured JSON schemas. Only when independent validators agree on
            the classification of each frozen item does the transaction finalize, ensuring tamper-proof, multi-node agreement.
          </p>
        </article>

        {/* 3. User-Obtainable Inputs & Size Limits */}
        <article className="doc-card">
          <div className="doc-card-number">03</div>
          <h3>User-Obtainable Inputs &amp; Capacity Limits</h3>
          <p>
            All contract interactions require strictly bounded, public text inputs:
          </p>
          <ul className="doc-list">
            <li>
              <strong>Rule ID:</strong> Lowercase alphanumeric slug (<code>[a-z][a-z0-9_]{'{0,15}'}</code>, max 16 bytes),
              e.g., <code>harassment</code>, <code>impersonation</code>, <code>copyright</code>.
            </li>
            <li>
              <strong>Precedent Normative Text (Authority):</strong> Hypothetical fact pattern of at most 512 UTF-8 bytes.
            </li>
            <li>
              <strong>Appealed Content (Appellant):</strong> The synthetic public text subject to review (max 1,536 UTF-8 bytes).
            </li>
            <li>
              <strong>Appellant Rationale (Appellant):</strong> Legal or procedural justification (max 512 UTF-8 bytes).
            </li>
            <li>
              <strong>Capacity Caps:</strong> Maximum 24 total precedents per registry; at most 8 active precedents per rule;
              maximum 32 cases per deployment.
            </li>
          </ul>
        </article>

        {/* 4. Wallet Connection */}
        <article className="doc-card">
          <div className="doc-card-number">04</div>
          <h3>Supported Wallets &amp; Network Connection</h3>
          <p>
            The interface discovers browser-injected wallets using the modern EIP-6963 standard and legacy EIP-1193 fallbacks.
            Only detected installations of <strong>MetaMask</strong>, <strong>OKX Wallet</strong>, and <strong>Rabby</strong>
            are displayed.
          </p>
          <p>
            Transactions are dispatched to GenLayer Studionet. If no supported wallet extension is detected, the dialog
            displays an informative guide rather than simulated options. Signing is serialized to prevent overlapping requests.
          </p>
        </article>

        {/* 5. Precedent Registry Workflow */}
        <article className="doc-card">
          <div className="doc-card-number">05</div>
          <h3>Precedent Registry Workflow</h3>
          <p>
            The designated registry authority account maintains the normative corpus:
          </p>
          <ul className="doc-list">
            <li>
              <strong>Fixed Original Disposition:</strong> Every precedent and appeal is explicitly a removal appeal;
              <code>original_disposition</code> is fixed to <code>REMOVED</code>.
            </li>
            <li>
              <strong>Holding Standards:</strong> Each precedent specifies <code>UPHOLD</code> (maintain removal) or
              <code>REVERSE</code> (order restoration).
            </li>
            <li>
              <strong>Revisioned Provenance:</strong> Adding a precedent assigns an incrementing ID and bumps the global
              registry revision. Retiring a precedent permanently deactivates it from future snapshots while preserving it
              for historical verification. Precedents cannot be edited or erased.
            </li>
          </ul>
        </article>

        {/* 6. Appeal Lifecycle */}
        <article className="doc-card">
          <div className="doc-card-number">06</div>
          <h3>Appeal Lifecycle: Create, Draft, Freeze, Resolve</h3>
          <ol className="doc-ordered-list">
            <li>
              <strong>Create Appeal (<code>create_appeal</code>):</strong> Appellant submits text and rationale. The contract
              automatically copies all active rule precedents into an immutable domain snapshot.
            </li>
            <li>
              <strong>Draft Replacement (<code>replace_appeal</code>):</strong> In <code>BASE_DRAFT</code> phase, the appellant
              can adjust content and rationale without changing the frozen rule or snapshot.
            </li>
            <li>
              <strong>Freeze Appeal (<code>freeze_appeal</code>):</strong> Appellant locks the dossier into <code>FROZEN</code> phase.
              No further edits are permitted.
            </li>
            <li>
              <strong>Resolve Appeal (<code>resolve_appeal</code>):</strong> Any participant can trigger validator consensus.
              Validators label every item, and the contract derives the final holding.
            </li>
            <li>
              <strong>Consensus Retry (<code>retry_appeal</code>):</strong> If validators identify ambiguity (<code>UNKNOWN</code>),
              the phase becomes <code>UNRESOLVED</code>. Anyone can retry after a 60-second cooldown (up to 3 total attempts).
            </li>
          </ol>
        </article>

        {/* 7. Waiting, Finality & Readback */}
        <article className="doc-card">
          <div className="doc-card-number">07</div>
          <h3>Waiting, Consensus Finality &amp; State Verification</h3>
          <p>
            Writing to GenLayer Studionet follows a verifiable multi-phase progression:
          </p>
          <ul className="doc-list">
            <li>
              <strong>Wallet Signing:</strong> Records the operation locally before requesting a wallet signature.
            </li>
            <li>
              <strong>Submission:</strong> Broadcasts transaction and obtains a canonical 64-hex transaction hash.
            </li>
            <li>
              <strong>Finality:</strong> Waits until Studionet finalizes the transaction and confirms successful execution.
            </li>
            <li>
              <strong>State Verification:</strong> Before declaring success, the client reads the authoritative historical
              version or registry state to verify that the expected transition occurred.
            </li>
          </ul>
        </article>

        {/* 8. Public Verification & Deterministic Outcome Matrix */}
        <article className="doc-card doc-card-wide">
          <div className="doc-card-number">08</div>
          <h3>Deterministic Outcome Derivation Matrix</h3>
          <p>
            Validators independently assign one of three labels to each frozen precedent: <code>MATERIAL</code>,
            <code>DISTINGUISHABLE</code>, or <code>UNKNOWN</code>. The contract then evaluates the material set deterministically:
          </p>

          <div className="table-wrapper">
            <table className="decision-matrix-table">
              <thead>
                <tr>
                  <th scope="col">Validator Material Classifications</th>
                  <th scope="col">Original Disposition</th>
                  <th scope="col">Deterministic Contract Result</th>
                  <th scope="col">Legal Effect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>All material precedents hold <code>UPHOLD</code></td>
                  <td><code>REMOVED</code></td>
                  <td><span className="matrix-badge badge-removed">REMOVED</span></td>
                  <td>Sanction affirmed; removal maintained</td>
                </tr>
                <tr>
                  <td>All material precedents hold <code>REVERSE</code></td>
                  <td><code>REMOVED</code></td>
                  <td><span className="matrix-badge badge-restored">RESTORED</span></td>
                  <td>Sanction reversed; content ordered restored</td>
                </tr>
                <tr>
                  <td>Both <code>UPHOLD</code> and <code>REVERSE</code> are material</td>
                  <td><code>REMOVED</code></td>
                  <td><span className="matrix-badge badge-conflicting">CONFLICTING_PRECEDENTS</span></td>
                  <td>Equally controlling opposing precedents collide</td>
                </tr>
                <tr>
                  <td>Zero precedents classified as <code>MATERIAL</code></td>
                  <td><code>REMOVED</code></td>
                  <td><span className="matrix-badge badge-no-controlling">NO_CONTROLLING_PRECEDENT</span></td>
                  <td>No controlling normative precedent found</td>
                </tr>
                <tr>
                  <td>One or more precedents classified as <code>UNKNOWN</code></td>
                  <td><code>REMOVED</code></td>
                  <td><span className="matrix-badge badge-unresolved">UNRESOLVED</span></td>
                  <td>Ambiguity detected; eligible for retry after 60s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        {/* 9. Public Data & Legal Disclaimers */}
        <article className="doc-card doc-card-wide doc-card-disclaimer">
          <div className="doc-card-number">09</div>
          <h3>Public Data &amp; Jurisdictional Disclaimers</h3>
          <div className="disclaimer-callout-grid">
            <div className="disclaimer-item">
              <span className="disclaimer-badge">Permanent Public Record</span>
              <p>
                All submitted text will be public and permanent on GenLayer Studionet. Do not include private information,
                credentials, or personal records.
              </p>
            </div>
            <div className="disclaimer-item">
              <span className="disclaimer-badge">Exact Material Scope</span>
              <p>
                Assessment of this exact submitted material only; not verification of external facts.
              </p>
            </div>
            <div className="disclaimer-item">
              <span className="disclaimer-badge">No External Conduct Finding</span>
              <p>
                Resolution under the frozen precedent set; no finding about real-world conduct.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

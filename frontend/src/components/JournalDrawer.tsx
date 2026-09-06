import type { JournalRecord } from "../pending";

export interface JournalDrawerProps {
  isOpen: boolean;
  records: JournalRecord[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  explorerUrl?: string;
}

export function JournalDrawer({
  isOpen,
  records,
  onClose,
  onRefresh,
  explorerUrl,
}: JournalDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="journal-drawer-overlay" onClick={onClose}>
      <aside
        className="journal-drawer"
        role="dialog"
        aria-labelledby="journal-drawer-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="journal-drawer-header">
          <div>
            <span className="drawer-eyebrow">Local Durable Storage</span>
            <h2 id="journal-drawer-title" className="drawer-title">
              Audit Journal &amp; Operation Log
            </h2>
          </div>
          <div className="drawer-header-actions">
            <button
              type="button"
              className="btn-refresh-journal"
              onClick={() => void onRefresh()}
              title="Reload local journal records"
            >
              ↻ Refresh Log
            </button>
            <button
              type="button"
              className="btn-close-drawer"
              onClick={onClose}
              aria-label="Close audit log"
            >
              ✕
            </button>
          </div>
        </div>

        <p className="drawer-intro">
          Pending operations are retained locally and serialized to prevent overlapping requests
          (<code>genlayer-journal-v1</code>) to prevent same-intent collision and guarantee crash recovery.
        </p>

        <div className="journal-records-list">
          {records.length === 0 ? (
            <div className="empty-journal-state">
              <span className="empty-journal-icon" aria-hidden="true">📋</span>
              <p>No transactions currently registered in local journal storage.</p>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.reservation}
                className={`journal-record-card status-${record.status.toLowerCase()}`}
              >
                <div className="record-header-row">
                  <span className="record-method-badge">{record.method}</span>
                  <span className={`record-status-pill status-pill-${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </div>

                <div className="record-meta-grid">
                  <div className="meta-field">
                    <span className="meta-key">Reservation:</span>
                    <code className="meta-val">{record.reservation}</code>
                  </div>
                  <div className="meta-field">
                    <span className="meta-key">Intent:</span>
                    <code className="meta-val">{record.intent}</code>
                  </div>
                  <div className="meta-field">
                    <span className="meta-key">Pre-Revision:</span>
                    <span className="meta-val">#{record.pre_revision}</span>
                  </div>
                  <div className="meta-field">
                    <span className="meta-key">Account:</span>
                    <span className="meta-val">
                      {record.account.slice(0, 6)}…{record.account.slice(-4)}
                    </span>
                  </div>
                  {record.tx_hash && (
                    <div className="meta-field full-width">
                      <span className="meta-key">Tx Hash:</span>
                      <code className="meta-val hash-val">{record.tx_hash}</code>
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/tx/${record.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="meta-link"
                        >
                          Explorer ↗
                        </a>
                      )}
                    </div>
                  )}
                  <div className="meta-field full-width">
                    <span className="meta-key">Logged:</span>
                    <span className="meta-val">
                      {new Date(Number(record.created_ms)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="journal-drawer-footer">
          <span className="journal-capacity-tag">
            Capacity: {records.length} / 32 entries allocated
          </span>
          <button type="button" className="btn-close-journal-bottom" onClick={onClose}>
            Close Audit Log
          </button>
        </div>
      </aside>
    </div>
  );
}

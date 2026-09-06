import { useEffect, useMemo, useRef, useState } from "react";
import { CHAIN, CONFIGURED, CONTRACT_ADDRESS } from "./config";
import {
  assertSuccessful,
  contractAddress,
  finalized,
  getAppeal,
  getIdByNonce,
  getPrecedent,
  getRegistry,
  getVersion,
  listCases,
  listPrecedents,
  submit,
  writeClient,
  type AppealRecord,
  type Precedent,
  type Registry,
} from "./contract";
import {
  loadJournal,
  removeRejected,
  reserveWrite,
  updateWrite,
  type JournalRecord,
} from "./pending";
import { ensureProviderDiscovery, useProviders } from "./wallet/providers";
import { createWalletStore, useWallet, walletView } from "./wallet/store";
import { Navigation } from "./components/Navigation";
import { ProductIntro } from "./components/ProductIntro";
import { RegistryWorkspace } from "./components/RegistryWorkspace";
import { AppealsWorkspace } from "./components/AppealsWorkspace";
import { TransactionHUD, type TxPhase } from "./components/TransactionHUD";
import { Documentation } from "./components/Documentation";
import { WalletDialog } from "./components/WalletDialog";
import { JournalDrawer } from "./components/JournalDrawer";
import "./styles.css";

const ZERO_HASH = "0".repeat(64);

export default function App() {
  const providers = useProviders();
  const store = useMemo(
    () => (CHAIN ? createWalletStore({ chain: CHAIN, bind: writeClient }) : undefined),
    []
  );
  const wallet = store ? useWallet(store) : undefined;
  const view = wallet ? walletView(wallet) : undefined;

  const [registry, setRegistry] = useState<Registry>();
  const [precedents, setPrecedents] = useState<Precedent[]>([]);
  const [appeals, setAppeals] = useState<AppealRecord[]>([]);
  const [rule, setRule] = useState("harassment");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<TxPhase>("IDLE");
  const [hash, setHash] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>([]);
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    store?.setProviders(providers);
  }, [providers, store]);

  useEffect(() => {
    if (!view?.chooserOpen) {
      if (dialog.current?.open) dialog.current.close();
    } else {
      if (dialog.current && !dialog.current.open) dialog.current.showModal();
    }
  }, [view?.chooserOpen]);

  async function refreshJournal() {
    try {
      const records = await loadJournal();
      setJournalRecords(records);
    } catch {
      // Storage or lock error handled elsewhere
    }
  }

  useEffect(() => {
    void refreshJournal();
  }, []);

  async function refresh() {
    if (!CONFIGURED) return;
    setIsRefreshing(true);
    setError("");
    try {
      const nextRegistry = await getRegistry();
      const [precedentPage, appealPage] = await Promise.all([
        listPrecedents(rule),
        listCases(),
      ]);
      const [nextPrecedents, nextAppeals] = await Promise.all([
        Promise.all(precedentPage.ids.map(getPrecedent)),
        Promise.all(appealPage.ids.map(getAppeal)),
      ]);
      setRegistry(nextRegistry);
      setPrecedents(nextPrecedents.filter((item): item is Precedent => Boolean(item)));
      setAppeals(nextAppeals.filter((item): item is AppealRecord => Boolean(item)));
      await refreshJournal();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Contract data could not be loaded.");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [rule]);

  async function execute(
    method: string,
    args: unknown[],
    intent: string,
    preRevision: string,
    verify: () => Promise<boolean>
  ) {
    if (!wallet?.session || !CHAIN || !CONTRACT_ADDRESS) return;
    setError("");
    setHash("");
    let record: JournalRecord | undefined;
    try {
      record = await reserveWrite({
        chain: String(CHAIN.id),
        contract: contractAddress(),
        account: wallet.session.address.toLowerCase() as `0x${string}`,
        method,
        intent,
        args_json: JSON.stringify(args),
        pre_revision: preRevision,
        pre_hash: ZERO_HASH,
      });
      await refreshJournal();

      setPhase("WAITING_FOR_WALLET");
      const txHash = await submit(wallet.session, method, args);
      setHash(txHash);

      record = await updateWrite(record, { status: "SUBMITTED", tx_hash: txHash });
      await refreshJournal();
      setPhase("SUBMITTED");

      setPhase("WAITING_FOR_FINALITY");
      const receipt = await finalized(txHash);

      setPhase("VERIFYING_EXECUTION");
      assertSuccessful(receipt);

      setPhase("VERIFYING_READBACK");
      if (!(await verify())) {
        throw new Error("Authoritative readback did not prove the expected transition.");
      }

      await updateWrite(record, { status: "VERIFIED", tx_hash: txHash });
      await refreshJournal();
      setPhase("SUCCESS");
      await refresh();
    } catch (cause) {
      const code =
        typeof cause === "object" && cause && "code" in cause
          ? Number((cause as { code: unknown }).code)
          : undefined;

      if (record && !record.tx_hash && code === 4001) {
        await removeRejected(record);
        setPhase("REJECTED");
      } else {
        if (record) {
          record = await updateWrite(record, {
            status: "RECONCILE",
            tx_hash: record.tx_hash,
          });
          setPhase("RECONCILIATION_REQUIRED");
        } else {
          setPhase("FAILED");
        }
      }
      setError(cause instanceof Error ? cause.message : "Transaction verification failed.");
      await refreshJournal();
    }
  }

  async function addPrecedent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registry) return;
    const data = new FormData(event.currentTarget);
    const text = String(data.get("text") ?? "");
    const holding = String(data.get("holding") ?? "UPHOLD");
    const expected = registry.revision;
    await execute(
      "add_precedent",
      [rule, text, "REMOVED", holding, BigInt(expected)],
      `add:${expected}`,
      expected,
      async () => (await getRegistry()).revision === String(BigInt(expected) + 1n)
    );
  }

  async function createAppeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet?.session) return;
    const data = new FormData(event.currentTarget);
    const nonce = crypto
      .getRandomValues(new Uint8Array(16))
      .reduce((val, byte) => val + byte.toString(16).padStart(2, "0"), "");
    const base = JSON.stringify({
      rule_id: rule,
      original_disposition: "REMOVED",
      content: String(data.get("content") ?? ""),
      rationale: String(data.get("rationale") ?? ""),
    });
    await execute(
      "create_appeal",
      [nonce, base, 0n],
      `create:${wallet.session.address}:${nonce}`,
      "0",
      async () => BigInt(await getIdByNonce(wallet.session!.address, nonce)) > 0n
    );
  }

  async function retirePrecedent(item: Precedent) {
    if (!registry) return;
    const expected = registry.revision;
    await execute(
      "retire_precedent",
      [BigInt(item.id), BigInt(expected)],
      `retire:${item.id}:${expected}`,
      expected,
      async () => {
        const next = await getPrecedent(item.id);
        return Boolean(
          next && !next.active && next.retired_revision === String(BigInt(expected) + 1n)
        );
      }
    );
  }

  async function replaceAppeal(item: AppealRecord, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const base = JSON.stringify({
      rule_id: item.base.rule_id,
      original_disposition: "REMOVED",
      content: String(data.get("content") ?? ""),
      rationale: String(data.get("rationale") ?? ""),
    });
    const nextRevision = String(BigInt(item.revision) + 1n);
    await execute(
      "replace_appeal",
      [BigInt(item.id), base, BigInt(item.revision)],
      `replace_appeal:${item.id}:${item.revision}`,
      item.revision,
      async () =>
        (await getVersion(item.id, nextRevision))?.base.content ===
        String(data.get("content") ?? "")
    );
  }

  async function caseAction(
    item: AppealRecord,
    method: "freeze_appeal" | "resolve_appeal" | "retry_appeal",
    expectedPhase: string
  ) {
    const nextRevision = String(BigInt(item.revision) + 1n);
    await execute(
      method,
      [BigInt(item.id), BigInt(item.revision)],
      `${method}:${item.id}:${item.revision}`,
      item.revision,
      async () => {
        const phaseName = (await getVersion(item.id, nextRevision))?.phase;
        return method === "freeze_appeal"
          ? phaseName === expectedPhase
          : ["DONE", "UNRESOLVED", "EXHAUSTED"].includes(phaseName ?? "");
      }
    );
  }

  const authority = Boolean(
    wallet?.session &&
      registry &&
      wallet.session.address.toLowerCase() === registry.authority.toLowerCase()
  );

  return (
    <div className="desk-app-root" id="top">
      {/* Navigation Header */}
      <Navigation
        view={view}
        chain={CHAIN}
        contractAddress={CONTRACT_ADDRESS}
        onWalletAction={() =>
          view?.connected ? store?.disconnect() : store?.open(ensureProviderDiscovery)
        }
        onToggleJournal={() => setIsJournalOpen(!isJournalOpen)}
        journalCount={journalRecords.length}
      />

      <main className="desk-main-layout">
        {/* Unconfigured Configuration Warning */}
        {!CONFIGURED && (
          <div role="alert" className="desk-configuration-banner">
            <span className="banner-icon" aria-hidden="true">⚠️</span>
            <div className="banner-copy">
              <strong>Configuration Notice:</strong> Deployment configuration is intentionally unset.
              Reads and transaction signing remain disabled until the exact approved Studionet contract
              address and network settings are loaded into the environment.
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div role="alert" className="desk-error-banner">
            <span className="banner-icon" aria-hidden="true">⛔</span>
            <div className="banner-copy">
              <strong>System Notice:</strong> {error}
            </div>
            <button
              type="button"
              className="btn-dismiss-error"
              onClick={() => setError("")}
              aria-label="Dismiss error notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Transaction Progress HUD */}
        <TransactionHUD
          phase={phase}
          hash={hash}
          error={error}
          explorerUrl={CHAIN?.explorerUrl}
          onDismiss={() => {
            setPhase("IDLE");
            setError("");
          }}
        />

        {/* First Viewport: Product Introduction & Causal Chain */}
        <ProductIntro
          registry={registry}
          precedentsCount={precedents.length}
          appealsCount={appeals.length}
          isAuthority={authority}
          userAddress={wallet?.session?.address}
        />

        {/* Precedent Registry Workspace */}
        <RegistryWorkspace
          registry={registry}
          precedents={precedents}
          rule={rule}
          onRuleChange={setRule}
          isAuthority={authority}
          canWrite={Boolean(view?.canWrite)}
          isRefreshing={isRefreshing}
          onRefresh={() => void refresh()}
          onAddPrecedent={addPrecedent}
          onRetirePrecedent={retirePrecedent}
          configured={CONFIGURED}
        />

        {/* Appeals Casebook Workspace */}
        <AppealsWorkspace
          appeals={appeals}
          rule={rule}
          activePrecedents={precedents.filter((p) => p.active)}
          registry={registry}
          userAddress={wallet?.session?.address}
          canWrite={Boolean(view?.canWrite)}
          isAuthority={authority}
          onCreateAppeal={createAppeal}
          onReplaceAppeal={replaceAppeal}
          onCaseAction={caseAction}
        />

        {/* Full Technical Documentation & How It Works */}
        <Documentation />
      </main>

      {/* Accessible Wallet Selection Dialog */}
      <WalletDialog
        dialogRef={dialog}
        providers={providers}
        phase={wallet?.phase}
        error={wallet?.error}
        onConnect={async (detail) => {
          await store?.connect(detail);
        }}
        onClose={() => store?.close()}
      />

      {/* Local Journal / Audit Log Drawer */}
      <JournalDrawer
        isOpen={isJournalOpen}
        records={journalRecords}
        onClose={() => setIsJournalOpen(false)}
        onRefresh={refreshJournal}
        explorerUrl={CHAIN?.explorerUrl}
      />

      {/* Colophon & Footer */}
      <footer className="desk-footer">
        <div className="desk-footer-content">
          <div className="footer-colophon">
            <strong>Precedent Resolver</strong>
            <p>
              An intelligent moderation-appeal precedent desk deployed on GenLayer Studionet.
              Core trust guarantee: non-selective precedent binding via immutable domain snapshots.
            </p>
          </div>
          <div className="footer-meta">
            <span>Assessment of this exact submitted material only; not verification of external facts.</span>
            <span>All submitted text is permanent and public.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

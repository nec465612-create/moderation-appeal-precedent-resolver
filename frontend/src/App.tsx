import { useEffect, useMemo, useRef, useState } from "react";
import { CHAIN, CONFIGURED, CONTRACT_ADDRESS } from "./config";
import { assertSuccessful, contractAddress, finalized, getAppeal, getIdByNonce, getPrecedent, getRegistry, getVersion, listCases, listPrecedents, submit, writeClient, type AppealRecord, type Precedent, type Registry } from "./contract";
import { removeRejected, reserveWrite, updateWrite, type JournalRecord } from "./pending";
import { ensureProviderDiscovery, useProviders } from "./wallet/providers";
import { createWalletStore, useWallet, walletView } from "./wallet/store";
import type { WalletProviderDetail } from "./wallet/types";
import "./styles.css";

type TxPhase = "IDLE" | "WAITING_FOR_WALLET" | "SUBMITTED" | "WAITING_FOR_FINALITY" | "VERIFYING_EXECUTION" | "VERIFYING_READBACK" | "SUCCESS" | "REJECTED" | "FAILED" | "RECONCILIATION_REQUIRED";
const ZERO_HASH = "0".repeat(64);

export default function App() {
  const providers = useProviders();
  const store = useMemo(() => CHAIN ? createWalletStore({ chain: CHAIN, bind: writeClient }) : undefined, []);
  const wallet = store ? useWallet(store) : undefined;
  const view = wallet ? walletView(wallet) : undefined;
  const [registry, setRegistry] = useState<Registry>();
  const [precedents, setPrecedents] = useState<Precedent[]>([]);
  const [appeals, setAppeals] = useState<AppealRecord[]>([]);
  const [rule, setRule] = useState("harassment");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<TxPhase>("IDLE");
  const [hash, setHash] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => { store?.setProviders(providers); }, [providers, store]);
  useEffect(() => {
    if (!view?.chooserOpen) dialog.current?.close();
    else if (!dialog.current?.open) dialog.current?.showModal();
  }, [view?.chooserOpen]);

  async function refresh() {
    if (!CONFIGURED) return;
    setError("");
    try {
      const nextRegistry = await getRegistry();
      const [precedentPage, appealPage] = await Promise.all([listPrecedents(rule), listCases()]);
      const [nextPrecedents, nextAppeals] = await Promise.all([
        Promise.all(precedentPage.ids.map(getPrecedent)),
        Promise.all(appealPage.ids.map(getAppeal)),
      ]);
      setRegistry(nextRegistry);
      setPrecedents(nextPrecedents.filter((item): item is Precedent => Boolean(item)));
      setAppeals(nextAppeals.filter((item): item is AppealRecord => Boolean(item)));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Contract data could not be loaded."); }
  }

  useEffect(() => { void refresh(); }, [rule]);

  async function execute(method: string, args: unknown[], intent: string, preRevision: string, verify: () => Promise<boolean>) {
    if (!wallet?.session || !CHAIN || !CONTRACT_ADDRESS) return;
    setError("");
    setHash("");
    let record: JournalRecord | undefined;
    try {
      record = await reserveWrite({
        chain: String(CHAIN.id), contract: contractAddress(), account: wallet.session.address.toLowerCase() as `0x${string}`,
        method, intent, args_json: JSON.stringify(args), pre_revision: preRevision, pre_hash: ZERO_HASH,
      });
      setPhase("WAITING_FOR_WALLET");
      const txHash = await submit(wallet.session, method, args);
      setHash(txHash);
      record = await updateWrite(record, { status: "SUBMITTED", tx_hash: txHash });
      setPhase("SUBMITTED");
      setPhase("WAITING_FOR_FINALITY");
      const receipt = await finalized(txHash);
      setPhase("VERIFYING_EXECUTION");
      assertSuccessful(receipt);
      setPhase("VERIFYING_READBACK");
      if (!await verify()) throw new Error("Authoritative readback did not prove the expected transition.");
      await updateWrite(record, { status: "VERIFIED", tx_hash: txHash });
      setPhase("SUCCESS");
      await refresh();
    } catch (cause) {
      const code = typeof cause === "object" && cause && "code" in cause ? Number((cause as { code: unknown }).code) : undefined;
      if (record && !record.tx_hash && code === 4001) { await removeRejected(record); setPhase("REJECTED"); }
      else {
        if (record) {
          record = await updateWrite(record, { status: "RECONCILE", tx_hash: record.tx_hash });
          setPhase("RECONCILIATION_REQUIRED");
        } else {
          setPhase("FAILED");
        }
      }
      setError(cause instanceof Error ? cause.message : "Transaction verification failed.");
    }
  }

  async function addPrecedent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registry) return;
    const data = new FormData(event.currentTarget);
    const text = String(data.get("text") ?? "");
    const holding = String(data.get("holding") ?? "UPHOLD");
    const expected = registry.revision;
    await execute("add_precedent", [rule, text, "REMOVED", holding, BigInt(expected)], `add:${expected}`, expected, async () => (await getRegistry()).revision === String(BigInt(expected) + 1n));
  }

  async function createAppeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nonce = crypto.getRandomValues(new Uint8Array(16)).reduce((value, byte) => value + byte.toString(16).padStart(2, "0"), "");
    const base = JSON.stringify({ rule_id: rule, original_disposition: "REMOVED", content: String(data.get("content") ?? ""), rationale: String(data.get("rationale") ?? "") });
    await execute("create_appeal", [nonce, base, 0n], `create:${wallet?.session?.address}:${nonce}`, "0", async () => BigInt(await getIdByNonce(wallet!.session!.address, nonce)) > 0n);
  }

  async function retirePrecedent(item: Precedent) {
    if (!registry) return;
    const expected = registry.revision;
    await execute("retire_precedent", [BigInt(item.id), BigInt(expected)], `retire:${item.id}:${expected}`, expected, async () => {
      const next = await getPrecedent(item.id);
      return Boolean(next && !next.active && next.retired_revision === String(BigInt(expected) + 1n));
    });
  }

  async function replaceAppeal(item: AppealRecord, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const base = JSON.stringify({ rule_id: item.base.rule_id, original_disposition: "REMOVED", content: String(data.get("content") ?? ""), rationale: String(data.get("rationale") ?? "") });
    const nextRevision = String(BigInt(item.revision) + 1n);
    await execute("replace_appeal", [BigInt(item.id), base, BigInt(item.revision)], `replace_appeal:${item.id}:${item.revision}`, item.revision, async () => (await getVersion(item.id, nextRevision))?.base.content === String(data.get("content") ?? ""));
  }

  async function caseAction(item: AppealRecord, method: "freeze_appeal" | "resolve_appeal" | "retry_appeal", expectedPhase: string) {
    const nextRevision = String(BigInt(item.revision) + 1n);
    await execute(method, [BigInt(item.id), BigInt(item.revision)], `${method}:${item.id}:${item.revision}`, item.revision, async () => {
      const phase = (await getVersion(item.id, nextRevision))?.phase;
      return method === "freeze_appeal" ? phase === expectedPhase : ["DONE", "UNRESOLVED", "EXHAUSTED"].includes(phase ?? "");
    });
  }

  const authority = Boolean(wallet?.session && registry && wallet.session.address.toLowerCase() === registry.authority.toLowerCase());
  return <main>
    <header><div><span className="eyebrow">GenLayer public precedent registry</span><h1>Moderation Appeal Precedent Resolver</h1></div><div className="wallet"><span>{view?.badge ?? "Configuration pending"}</span>{store && <button onClick={() => view?.connected ? store.disconnect() : store.open(ensureProviderDiscovery)}>{view?.action}</button>}</div></header>
    {!CONFIGURED && <p role="alert" className="notice">Deployment configuration is intentionally unset. Reads and signing remain disabled until the exact approved Studionet address and chain are available.</p>}
    <section className="intro"><h2>Resolve one public text appeal against every active precedent</h2><p>The contract freezes the complete active precedent set when an appeal is created. The appellant cannot select favorable history, and the result does not claim that real-world moderation occurred.</p></section>
    <nav aria-label="Workspace"><a href="#registry">Registry</a><a href="#appeals">Appeals</a><a href="#how">How it works</a></nav>
    <section id="registry"><div className="section-title"><div><span className="eyebrow">Normative corpus</span><h2>Precedent registry</h2></div><button onClick={() => void refresh()} disabled={!CONFIGURED}>Refresh</button></div><label>Rule ID<input value={rule} pattern="[a-z][a-z0-9_]{0,15}" onChange={(event) => setRule(event.target.value)} /></label><div className="cards">{precedents.map((item) => <article key={item.id}><span>#{item.id} · {item.active ? "Active" : "Retired"}</span><h3>{item.holding}</h3><p>{item.text}</p><small>Original: REMOVED · added revision {item.added_revision}</small>{authority && item.active && <button onClick={() => void retirePrecedent(item)} disabled={!view?.canWrite}>Retire precedent</button>}</article>)}</div>{authority && <form onSubmit={addPrecedent}><h3>Add precedent</h3><textarea name="text" maxLength={512} required /><select name="holding"><option>UPHOLD</option><option>REVERSE</option></select><button disabled={!view?.canWrite}>Add public precedent</button></form>}</section>
    <section id="appeals"><div className="section-title"><div><span className="eyebrow">Frozen review</span><h2>Appeals</h2></div></div><div className="cards">{appeals.map((item) => <article key={item.id}><span>Appeal #{item.id} · {item.phase}</span><h3>{item.outcome || "Awaiting resolution"}</h3><p>{item.base.content}</p><small>Snapshot revision {item.domain.snapshot_revision} · {item.domain.snapshot.length} precedents</small>{view?.canWrite && wallet?.session?.address.toLowerCase() === item.primary.toLowerCase() && item.phase === "BASE_DRAFT" && <><form onSubmit={(event) => void replaceAppeal(item, event)}><textarea name="content" defaultValue={item.base.content} maxLength={1536} required /><textarea name="rationale" defaultValue={item.base.rationale} maxLength={512} required /><button>Replace draft</button></form><button onClick={() => void caseAction(item, "freeze_appeal", "FROZEN")}>Freeze appeal</button></>}{view?.canWrite && item.phase === "FROZEN" && <button onClick={() => void caseAction(item, "resolve_appeal", "DONE")}>Resolve appeal</button>}{view?.canWrite && item.phase === "UNRESOLVED" && <button onClick={() => void caseAction(item, "retry_appeal", "DONE")}>Retry frozen appeal</button>}<details><summary>Frozen precedent set</summary>{item.domain.snapshot.map((precedent, index) => <p key={precedent.id}>{index + 1}. {precedent.holding} — {precedent.text} {item.result.labels?.[index] ? `(${item.result.labels[index]})` : ""}</p>)}</details></article>)}</div>{view?.canWrite && !authority && <form onSubmit={createAppeal}><h3>Create appeal</h3><textarea name="content" maxLength={1536} required placeholder="Public synthetic content" /><textarea name="rationale" maxLength={512} required placeholder="Why the removal should be reconsidered" /><button>Create with complete active snapshot</button></form>}</section>
    {phase !== "IDLE" && <section data-transaction-phase={phase} role={["FAILED", "REJECTED"].includes(phase) ? "alert" : "status"} className="progress"><span className={["SUCCESS", "FAILED", "REJECTED", "RECONCILIATION_REQUIRED"].includes(phase) ? "dot" : "spinner"} /><div><strong>{phase.replaceAll("_", " ")}</strong>{hash && <code>{hash}</code>}</div></section>}
    {error && <p role="alert" className="error">{error}</p>}
    <section id="how"><span className="eyebrow">Public verification</span><h2>How it works</h2><ol><li>The registry authority adds public removal precedents with an UPHOLD or REVERSE holding.</li><li>An appellant submits public text. The contract automatically freezes all active precedents for the selected rule.</li><li>GenLayer validators independently classify each frozen precedent as material, distinguishable, or unknown.</li><li>The contract deterministically derives REMOVED, RESTORED, no controlling precedent, conflicting precedents, or an unresolved retry state.</li></ol><p>Resolution under the frozen precedent set; no finding about real-world conduct. All submitted text is public and permanent. Do not include private information, credentials, or personal records.</p></section>
    <dialog ref={dialog} onCancel={() => store?.close()}><h2>Choose a detected wallet</h2>{providers.map((detail: WalletProviderDetail) => <button key={detail.info.uuid} onClick={() => void store?.connect(detail)}>{detail.info.name}</button>)}{providers.length === 0 && <p>No supported wallet was detected.</p>}<button onClick={() => store?.close()}>Cancel</button></dialog>
  </main>;
}

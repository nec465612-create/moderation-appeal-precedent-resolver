import type { HexAddress } from "./wallet/types";

export type JournalStatus = "SIGNING" | "SUBMITTED" | "RECONCILE" | "FINALIZED_ERROR" | "VERIFIED";
export interface JournalRecord {
  v: 1;
  reservation: string;
  chain: string;
  contract: HexAddress;
  account: HexAddress;
  method: string;
  intent: string;
  args_json: string;
  pre_revision: string;
  pre_hash: string;
  tx_hash: string;
  status: JournalStatus;
  created_ms: string;
}

const INDEX = "glj1:index";
const PREFIX = "glj1:";
const LOCK = "genlayer-journal-v1";
const ADDRESS = /^0x[0-9a-f]{40}$/;
const HEX32 = /^[0-9a-f]{32}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;

function valid(value: unknown): value is JournalRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<JournalRecord>;
  return item.v === 1 && HEX32.test(item.reservation ?? "") && ADDRESS.test(item.contract ?? "") && ADDRESS.test(item.account ?? "") &&
    typeof item.chain === "string" && typeof item.method === "string" && item.method.length > 0 && item.method.length <= 48 &&
    typeof item.intent === "string" && item.intent.length > 0 && item.intent.length <= 160 && typeof item.args_json === "string" && item.args_json.length <= 18000 &&
    typeof item.pre_revision === "string" && HEX64.test(item.pre_hash ?? "") && typeof item.tx_hash === "string" && (!item.tx_hash || HASH.test(item.tx_hash)) &&
    ["SIGNING", "SUBMITTED", "RECONCILE", "FINALIZED_ERROR", "VERIFIED"].includes(item.status ?? "") && typeof item.created_ms === "string";
}

function loadUnsafe(): JournalRecord[] {
  const records: JournalRecord[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(PREFIX) || key === INDEX) continue;
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!valid(parsed) || key !== PREFIX + parsed.reservation) throw new Error("Journal storage is invalid. Export and reconcile it before signing.");
    records.push(parsed);
  }
  records.sort((left, right) => Number(left.created_ms) - Number(right.created_ms));
  localStorage.setItem(INDEX, JSON.stringify(records.map(({ reservation }) => PREFIX + reservation)));
  return records;
}

async function locked<T>(task: () => T | Promise<T>): Promise<T> {
  if (!navigator.locks?.request) throw new Error("Journal lock unavailable");
  return navigator.locks.request(LOCK, { mode: "exclusive" }, task);
}

function reservation() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function conflicts(left: JournalRecord, right: Pick<JournalRecord, "chain" | "contract" | "intent">) {
  if (left.chain !== right.chain || left.contract !== right.contract || ["VERIFIED", "FINALIZED_ERROR"].includes(left.status)) return false;
  const leftCase = left.intent.split(":")[1];
  const rightCase = right.intent.split(":")[1];
  return left.intent.startsWith("add:") || left.intent.startsWith("retire:") || right.intent.startsWith("add:") || right.intent.startsWith("retire:")
    ? left.intent.startsWith("add:") || left.intent.startsWith("retire:")
    : Boolean(leftCase && rightCase && leftCase === rightCase);
}

export async function reserveWrite(input: Omit<JournalRecord, "v" | "reservation" | "tx_hash" | "status" | "created_ms">) {
  return locked(() => {
    const records = loadUnsafe();
    if (records.length >= 32) throw new Error("JOURNAL_CAPACITY");
    if (records.some((record) => conflicts(record, input))) throw new Error("A related write needs reconciliation before another signature.");
    const id = reservation();
    const record: JournalRecord = { ...input, v: 1, reservation: id, tx_hash: "", status: "SIGNING", created_ms: String(Date.now()) };
    localStorage.setItem(PREFIX + id, JSON.stringify(record));
    localStorage.setItem(INDEX, JSON.stringify([...records.map(({ reservation: item }) => PREFIX + item), PREFIX + id]));
    return record;
  });
}

export async function updateWrite(original: JournalRecord, patch: Pick<JournalRecord, "status" | "tx_hash">) {
  return locked(() => {
    const records = loadUnsafe();
    const current = records.find(({ reservation }) => reservation === original.reservation);
    if (!current || current.chain !== original.chain || current.contract !== original.contract || current.account !== original.account || current.method !== original.method || current.intent !== original.intent || current.args_json !== original.args_json || current.pre_hash !== original.pre_hash || (current.tx_hash && current.tx_hash !== patch.tx_hash)) {
      throw new Error("Journal context changed; reconcile without resubmitting.");
    }
    const next = { ...current, ...patch };
    if (!valid(next)) throw new Error("Invalid journal update.");
    localStorage.setItem(PREFIX + next.reservation, JSON.stringify(next));
    return next;
  });
}

export async function removeRejected(original: JournalRecord) {
  return locked(() => {
    const records = loadUnsafe();
    const current = records.find(({ reservation }) => reservation === original.reservation);
    if (!current || current.tx_hash) throw new Error("Submitted or unknown transaction cannot be discarded.");
    localStorage.removeItem(PREFIX + original.reservation);
    localStorage.setItem(INDEX, JSON.stringify(records.filter(({ reservation }) => reservation !== original.reservation).map(({ reservation }) => PREFIX + reservation)));
  });
}

export async function loadJournal() { return locked(loadUnsafe); }

import { beforeEach, describe, expect, it } from "vitest";
import { loadJournal, reserveWrite, updateWrite } from "../src/pending";

const ADDRESS = `0x${"1".repeat(40)}` as const;

beforeEach(() => {
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: async (_name: string, _options: unknown, task: () => unknown) => task() },
  });
});

function input(intent = "freeze_appeal:1:2") {
  return { chain: "1", contract: ADDRESS, account: ADDRESS, method: "freeze_appeal", intent, args_json: "[]", pre_revision: "2", pre_hash: "0".repeat(64) };
}

describe("durable operation journal", () => {
  it("reserves before signing and retains an immutable hash", async () => {
    const record = await reserveWrite(input());
    expect(record.status).toBe("SIGNING");
    const submitted = await updateWrite(record, { status: "SUBMITTED", tx_hash: `0x${"a".repeat(64)}` });
    expect((await loadJournal())[0]).toEqual(submitted);
    await expect(updateWrite(submitted, { status: "SUBMITTED", tx_hash: `0x${"b".repeat(64)}` })).rejects.toThrow(/context changed/i);
  });

  it("blocks every new write for the same unresolved case", async () => {
    await reserveWrite(input("freeze_appeal:7:2"));
    await expect(reserveWrite({ ...input("resolve_appeal:7:3"), method: "resolve_appeal" })).rejects.toThrow(/reconciliation/i);
  });

  it("fails closed when Web Locks is unavailable", async () => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
    await expect(reserveWrite(input())).rejects.toThrow("Journal lock unavailable");
  });

  it("preserves an ambiguous pre-hash reservation for reconciliation", async () => {
    const record = await reserveWrite(input());
    const uncertain = await updateWrite(record, { status: "RECONCILE", tx_hash: "" });
    expect(uncertain.status).toBe("RECONCILE");
    expect((await loadJournal())[0].reservation).toBe(record.reservation);
  });
});

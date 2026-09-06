import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadJournal, reserveWrite, updateWrite } from "../src/pending";
import { reconcileExisting } from "../src/reconcile";

const ADDRESS = `0x${"1".repeat(40)}` as const;
const HASH = `0x${"a".repeat(64)}` as const;

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", { configurable: true, value: { request: async (_n: string, _o: unknown, task: () => unknown) => task() } });
});

async function submitted() {
  const record = await reserveWrite({ chain: "1", contract: ADDRESS, account: ADDRESS, method: "freeze_appeal", intent: "freeze_appeal:1:2", args_json: '["1","2"]', pre_revision: "2", pre_hash: "0".repeat(64) });
  return updateWrite(record, { status: "RECONCILE", tx_hash: HASH });
}

describe("existing-hash reconciliation", () => {
  it("marks successful authoritative readback verified without submitting", async () => {
    const record = await submitted();
    const submit = vi.fn();
    const next = await reconcileExisting(record, { finalized: vi.fn().mockResolvedValue({ statusName: "FINALIZED" }), assertSuccessful: vi.fn(), verify: vi.fn().mockResolvedValue(true) });
    expect(next.status).toBe("VERIFIED");
    expect(submit).not.toHaveBeenCalled();
  });

  it("records terminal execution failure", async () => {
    const record = await submitted();
    const next = await reconcileExisting(record, { finalized: vi.fn().mockResolvedValue({}), assertSuccessful: () => { throw new Error("execution"); }, verify: vi.fn() });
    expect(next.status).toBe("FINALIZED_ERROR");
  });

  it.each(["pending", "unavailable"])("retains RECONCILE when receipt is %s", async () => {
    const record = await submitted();
    const next = await reconcileExisting(record, { finalized: vi.fn().mockRejectedValue(new Error("not final")), assertSuccessful: vi.fn(), verify: vi.fn() });
    expect(next.status).toBe("RECONCILE");
    expect((await loadJournal())[0].tx_hash).toBe(HASH);
  });

  it("retains a hashless ambiguous reservation without a receipt request", async () => {
    const record = await reserveWrite({ chain: "1", contract: ADDRESS, account: ADDRESS, method: "freeze_appeal", intent: "freeze_appeal:1:2", args_json: "[]", pre_revision: "2", pre_hash: "0".repeat(64) });
    const pending = await updateWrite(record, { status: "RECONCILE", tx_hash: "" });
    const finalized = vi.fn();
    expect((await reconcileExisting(pending, { finalized, assertSuccessful: vi.fn(), verify: vi.fn() })).status).toBe("RECONCILE");
    expect(finalized).not.toHaveBeenCalled();
  });
});

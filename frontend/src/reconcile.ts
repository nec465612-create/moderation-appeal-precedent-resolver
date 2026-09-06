import { updateWrite, type JournalRecord } from "./pending";

export async function reconcileExisting(
  record: JournalRecord,
  deps: {
    finalized: (hash: `0x${string}`) => Promise<unknown>;
    assertSuccessful: (receipt: unknown) => void;
    verify: () => Promise<boolean>;
  }
) {
  if (!record.tx_hash) return record;
  let receipt: unknown;
  try {
    receipt = await deps.finalized(record.tx_hash as `0x${string}`);
  } catch {
    return record;
  }
  try {
    deps.assertSuccessful(receipt);
  } catch {
    return updateWrite(record, { status: "FINALIZED_ERROR", tx_hash: record.tx_hash });
  }
  try {
    if (await deps.verify()) return updateWrite(record, { status: "VERIFIED", tx_hash: record.tx_hash });
  } catch {
    // Preserve the existing hash for a later authoritative readback.
  }
  return updateWrite(record, { status: "RECONCILE", tx_hash: record.tx_hash });
}

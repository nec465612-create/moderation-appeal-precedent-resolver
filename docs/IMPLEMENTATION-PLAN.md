# Implementation Plan

## Locked baseline

Implement the approved C4 Research R12 as one GenLayer contract and one React/Vite frontend. Preserve the registry authority, immutable all-active precedent snapshot, fixed `REMOVED` origin, exact public methods, state transitions, bounded records, deterministic reducer, retry semantics, wallet behavior, journal, RPC limits, tests, and evidence requirements in `STAGE-2.md`.

No material adaptation is approved or required. The dependency toolchain is pinned to `genvm-linter 0.11.0`, GenVM runner bundle `v0.2.16`, and `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`; the newer `1zr6...` SDK artifact is not used because semantic validation fails with `E101: No module named 'genlayer.py'`. Recheck the exact Studio source envelope read-only before PRE_DEPLOY.

## Implementation order

1. Implement `contracts/main.py` with exact storage, validation, registry, case history, snapshot, consensus classification, deterministic outcomes, and no-write failure boundaries.
2. Implement deterministic and mocked-consensus tests in `tests/test_contract.py`, then lint and export schema.
3. Implement the frontend contract adapter, durable operation journal, canonical wallet session, functional screens, transaction lifecycle, and RPC counters.
4. Implement frontend unit/browser regressions and build checks.
5. Prepare the project-specific design rationale and manual Claude presentation handoff after the functional frontend passes.
6. Prepare the exact PRE_DEPLOY package; no Studio transaction occurs before independent approval.

## Experience application map

- `Make custom consensus rederive the consequential judgment`: validators independently classify the same frozen appeal/snapshot and compare the complete stable label vector; test a well-formed but materially changed label.
- `Initialize Git before implementation`: already applied at handoff baseline `eb0e29cee5b69be812af415f49857aaec1e9716c`; preserve honest incremental commits.
- `Treat contract JSON and transaction receipts as untrusted protocol boundaries`: exact-key parsing, duplicate-key rejection, byte/range caps, semantic receipt and authoritative historical readback tests.
- `Discover injected wallets first and bind writes to the provider the user selected`: one EIP-6963 wallet state machine and exact-provider write routing tests.
- `Keep specification result schemas identical to the accepted contract protocol`: generate and compare a key/type checklist for `{v,labels}` across contract, frontend, schema, tests, and evidence.
- `Pin the compatible GenVM runner bundle, not only the linter version`: record linter, runner, dependency pin, archive digest, and exact commands; do not treat the newer-runner notice as a contract failure.
- `Put the GenVM text-runner version line before the dependency manifest`: apply only after a current read-only Studio schema probe confirms the required envelope; it is not assumed during implementation.

## Proof plan

- Contract: constructor, authority, registry capacity/CAS, strict JSON, replay, parent rules, immutable snapshots, every reducer outcome, UNKNOWN/retry/exhaustion, revision capacity, history, pagination, malformed output, disagreement, and full no-write snapshots.
- Frontend: zero/one/multiple supported providers, exact-object routing, journal interruption/orphan/capacity/lock failures, cross-tab conflict, every transaction state, bounded polling, delayed readback, reload reconciliation, stale revision, and complete public journeys.
- Release: exact source/schema/test hashes, Studio measurement-mode probe, finalized semantic execution plus authoritative readback, public Git/Vercel parity, and judge-facing E2E only after applicable approvals.


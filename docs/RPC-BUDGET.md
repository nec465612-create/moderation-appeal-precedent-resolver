# RPC Budgets

## FRONTEND RPC BUDGET MATRIX

FRONTEND_MATRIX_STATUS: READY

| Screen/workflow | Trigger | Read client | Cache/deduplication | Poll start | Poll interval/backoff | Stop condition | Hidden-tab behavior | Reconciliation/readback | Max requests | Max transactions | Failure state |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Landing | Route load | None | Static content | Never | None | Immediate | 0 polls | None | 0 | 0 | Render configuration warning locally |
| Registry list | Explicit open/page | Shared public client | One in-flight request per exact page key | Never | None | Response/error | 0 polls | Explicit refresh only | 1 | 0 | Keep prior data and show bounded error |
| Appeal list/detail | Explicit open/page | Shared public client | One in-flight request per exact method/args | Never | None | Response/error | 0 polls | Explicit refresh only | 1 | 0 | Keep journal and show read error |
| Connect wallet | User selects detected provider | Selected EIP-1193 object | One chain read per connection attempt | Never | None | Connected/rejected/error | 0 polls | No automatic reconnect | 1 | 0 | Disconnected with exact error |
| Contract write | User confirms one journal reservation | Selected-provider write client | Pending conflict blocks duplicate writes | After one submission hash | Receipt at 2s, 4s, 8s | Semantic final result or three receipt reads | Pause while hidden | Up to two exact historical/state reads at 0s and 4s | 6 | 1 | Preserve RECONCILE or FINALIZED_ERROR |
| Manual resume | User selects one unresolved journal entry | Client bound to stored chain/contract | At most two entries concurrently | Existing hash only | One receipt query | Receipt result | 0 polls | One exact view | 2 | 0 | Preserve unresolved entry |

Automatic application-wide polling is forbidden. Every counter is scoped to the shared client and journal operation; account/chain changes never resubmit.

## STUDIO RPC MEASUREMENT CAPABILITY PROBE

STUDIO_CAPABILITY_PROBE_STATUS: COMPLETE
STUDIO_MEASUREMENT_MODE: PHYSICAL_NETWORK_COUNT
STUDIO_MEASUREMENT_TIMING: PRE_E2E
STUDIO_CAPABILITY_PROBE_AT: 2026-09-07T03:27:00+07:00
STUDIO_FIRST_ACTION_AT: NOT_STARTED
STUDIO_E2E_STARTED_AT: NOT_STARTED
STUDIO_CAPABILITY_TOOL_OR_API: Google Chrome channel controlled through Playwright request events
STUDIO_CAPABILITY_CHECK: Launch a clean persistent Chrome context, subscribe to every page `request` event, navigate read-only to `https://studio.genlayer.com`, and record method plus URL before any Studio mutation.
STUDIO_CAPABILITY_RESULT: Request events are individually observable; the read-only landing load exposed 78 physical request events, including four POST requests to `https://studio.genlayer.com/api`. No contract was loaded and no transaction was submitted.
STUDIO_PHYSICAL_COUNT_SOURCE: Playwright page request-event ledger from the locked Task Chrome profile

The count above proves measurement capability only. It is not E2E evidence and is excluded from the E2E budget below.

## STUDIO RPC BUDGET MATRIX

STUDIO_MATRIX_STATUS: READY

| Step | Purpose | Maximum observable actions | Maximum transactions | Status polls | Terminal receipt reads | Authoritative readbacks | Stop condition / reuse rule |
|---|---|---:|---:|---:|---:|---:|---|
| Network and account check | Confirm Studionet and locked deployer `0xEe0c62F28866874c1D4BCd3F43aA019EeBbDcc18` | 2 | 0 | 0 | 0 | 0 | Stop on account/network mismatch |
| Exact source/schema load | Load SHA-256 `7512D62736BD1829CF100562D5B0B929261084784943B4726FDE0F12372814C1` and verify 17 methods | 2 | 0 | 0 | 0 | 0 | No repeated load after parity is proven |
| Deploy | Constructor authority is the locked deployer | 1 | 1 | 3 | 1 | 1 | One deployment only; retain address/hash |
| Initial registry read | Prove authority, revision `0`, count `0` | 1 | 0 | 0 | 0 | 1 | Reuse as add-precedent pre-state |
| Add UPHOLD precedent | Establish one controlling removal precedent | 1 | 1 | 3 | 1 | 1 | Require semantic success and registry revision `1` |
| Add REVERSE precedent | Establish conflicting controlling precedent | 1 | 1 | 3 | 1 | 1 | Require semantic success and revision `2` |
| Create appeal | Prove complete active-set snapshot and nonce readback | 1 | 1 | 3 | 1 | 2 | Reuse created case for remaining transitions |
| Freeze appeal | Prove immutable snapshot/base lock | 1 | 1 | 3 | 1 | 1 | Stop unless phase is `FROZEN` |
| Resolve appeal | Exercise live nondeterministic full-vector classification | 1 | 1 | 3 | 1 | 2 | Accept `DONE` or `UNRESOLVED`; verify labels/outcome/history |
| Retry, conditional | Only if the first accepted live result is `UNRESOLVED` and cooldown has elapsed | 1 | 1 | 3 | 1 | 2 | Never retry a successful/terminal result; maximum two retries under contract cap |
| Retire precedent | Prove authority-only retirement and historical preservation | 1 | 1 | 3 | 1 | 2 | Reuse existing precedent and revision; no duplicate record |

Planned baseline without conditional retry: 7 transactions including deployment, at most 21 status polls, 7 terminal receipt reads, and 11 authoritative readbacks. Physical request totals will be measured separately from these logical bounds. Every transaction stops polling at terminal state. Existing hashes and readbacks are reused; no transaction is created merely to measure, and no blind retry or redeploy is permitted.

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

## STUDIO RPC BUDGET

Measurement mode is intentionally unlocked until the required pre-Studio capability probe. Planned bound per write is one submission, at most three status observations, and at most two authoritative readbacks. No transaction is created merely to measure RPC, replace recoverable evidence, or retry an inconclusive operation.


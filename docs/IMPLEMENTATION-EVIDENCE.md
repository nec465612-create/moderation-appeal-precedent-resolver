# Implementation Evidence

## Exact artifacts

- Contract SHA-256: `7512D62736BD1829CF100562D5B0B929261084784943B4726FDE0F12372814C1`
- Exported schema SHA-256: `D1813385971E32144309558DAE53DAB7B897DBD413DD249FB4814E6ADA4E32E8`
- Frontend lockfile SHA-256: `DB87AED70B1BB8432017C7A321C7332A4039A81C88EE22AA71640E8DE78BE80F`
- Toolchain: Python 3.13.6; `genvm-linter 0.11.0`; `GENVM_VERSION=v0.2.16`; `genlayer-js 1.1.8`; Node 22.22.2.

## Verification

- `python -m pytest tests/test_contract.py -q -p no:cacheprovider` → `15 passed`.
- `genvm-lint check contracts/main.py --json` → lint PASS, semantic validation PASS, contract `ModerationAppealPrecedentResolver`, 17 methods: 10 view and 7 write, one constructor parameter.
- `genvm-lint schema contracts/main.py --output contract-schema.json` → PASS; exported inventory matches Stage 2.
- `npm --prefix frontend test` → 2 files and 10 tests PASS.
- `npm --prefix frontend run build` → TypeScript and Vite production build PASS.

## Implemented boundaries

- Contract owns complete active-precedent snapshots, fixed removal disposition, authority/CAS checks, idempotent create nonces, revision history, bounded pagination, custom consensus over stable labels, deterministic absolute outcomes, and no optimistic external action.
- Frontend exposes every Stage 2 write method, uses one in-memory wallet-session store, displays only detected MetaMask/OKX/Rabby providers, binds writes to the selected provider, and starts disconnected after reload.
- Every write reserves a unique Web Locks journal record before wallet interaction, keeps one immutable transaction hash, requires `FINALIZED` plus `FINISHED_WITH_RETURN`, and then performs a method-specific authoritative readback before `SUCCESS`.
- Configuration remains intentionally unset until an exact approved Studionet deployment exists. No deployment, transaction, GitHub push, Vercel release, or live-E2E claim has been made.

## Known non-blocking implementation warning

The initial production bundle is approximately 728 kB minified because `genlayer-js` is included in the functional frontend. Code splitting is deferred to the presentation/performance pass; it does not alter behavior, RPC bounds, or contract integration.

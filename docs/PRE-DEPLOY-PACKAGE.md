# PRE_DEPLOY Exact-Revision Package

PACKAGE_ID: MAPR-PREDEPLOY-02D6E34-7512D627
CHECKPOINT: PRE_DEPLOY
TASK_ID: moderation-appeal-precedent-resolver
WORKFLOW: Build
REVISION: 02d6e34b24881d31321ff806a5cb1d798d46481e
OPEN_BLOCKING_FINDINGS: 0

## Objective and acceptance criteria

Deploy and verify a public moderation-appeal casebook in which appellants cannot cherry-pick precedent: each appeal freezes every active precedent for its selected rule, validators classify the complete frozen vector, and deterministic contract logic derives the outcome while preserving historical revisions. Acceptance requires exact-source schema/runtime compatibility, authority and stale-revision controls, immutable snapshots, bounded public inputs, safe nondeterministic validation, truthful transaction/readback handling, project-specific accessible frontend presentation, and the minimum live Studio matrix in `docs/RPC-BUDGET.md`.

## Exact artifact allowlist and hashes

- `contracts/main.py`: `7512D62736BD1829CF100562D5B0B929261084784943B4726FDE0F12372814C1`
- `contract-schema.json`: `D1813385971E32144309558DAE53DAB7B897DBD413DD249FB4814E6ADA4E32E8`
- `STAGE-2.md`: `0B7A1FBF383DE4541E4E25F8F0556A399D312331D0BB1204D554F24A428CCC07`
- `frontend/src/App.tsx`: `9D9CDEE820EE7C1729BF5DD7026889BE54D323C1653F6AAACBA440C59A7E78BE`
- `docs/FRONTEND-DESIGN-RATIONALE.md`, `docs/IMPLEMENTATION-EVIDENCE.md`, `docs/RPC-BUDGET.md`, and this package are supporting review evidence at the exact Git revision produced when this package is committed.

## Current technical baseline

- Official GenLayer documentation checked 2026-09-07: storage, equivalence principle, testing, GenLayer Test API, and Studio limitations under `https://docs.genlayer.com/`.
- Current installed candidate tools: Python 3.13.6; `genvm-linter` 0.11.0; `genlayer-test` 0.29.2; `GENVM_VERSION=v0.2.16`.
- Exact dependency header remains the approved py-genlayer pin in `contracts/main.py`; an attempted newer pin was rejected before this revision because the installed runtime could not import it. No source/runtime conflict remains for this candidate because the exact bytes pass semantic validation and schema extraction.

## Schema, ABI, and caller parity

Command: `$env:GENVM_VERSION='v0.2.16'; genvm-lint check contracts/main.py --json`

Result: `{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"ModerationAppealPrecedentResolver","methods":17,"view_methods":10,"write_methods":7,"ctor_params":1}}`

Command: `genvm-lint schema contracts/main.py --json`

Result: PASS, constructor `authority: address`; 17 discoverable methods. Writes: `add_precedent`, `retire_precedent`, `create_appeal`, `replace_appeal`, `freeze_appeal`, `resolve_appeal`, `retry_appeal`. Views: `get_registry`, `get_precedent`, `list_precedents`, `get_case`, `get_version`, `get_id_by_nonce`, `get_count`, `list_cases`, `list_actor`, `list_children`. The frontend adapter calls this exact inventory and uses historical or nonce readback after writes.

## Storage and ABI inventory

- One discoverable `ModerationAppealPrecedentResolver(gl.Contract)`.
- Persistent scalar fields use `u256` and `Address`; mappings are fully instantiated `TreeMap` values: case/nonce/actor/child/version/history plus precedent/rule indexes.
- Structured records are canonical bounded JSON strings, avoiding unsupported custom persisted types and mapping return boundaries.
- Address inputs are ABI `Address`; public JSON output normalizes addresses to canonical strings.
- No value transfer, payable method, linked contract, EVM call, token unit, or child transaction exists.
- Limits: 24 precedents total, 8 active per rule, 32 cases, page size 1–4, 1,536-byte appeal content, 512-byte rationale/precedent, three accepted resolution attempts, 60-second retry cooldown.

## Nondeterministic inventory

The sole nondeterministic path is resolution. Deterministic state is read first into primitive in-memory `base` and complete frozen `snapshot`. `gl.nondet.exec_prompt(..., response_format="json")` runs only inside `gl.vm.run_nondet_unsafe(leader, validator)`. Inputs are delimited as untrusted JSON and forbid embedded instructions and external evidence. Both leader and validator independently derive the complete ordered label vector; `_result` rejects wrong version, shape, length, labels, extras, and overlong values. Validator exceptions or a non-`gl.vm.Return` fail closed. Only after accepted full-vector equality does deterministic `_outcome` derive `REMOVED`, `RESTORED`, `CONFLICTING_PRECEDENTS`, `NO_CONTROLLING_PRECEDENT`, or retry-bounded `UNRESOLVED/EXHAUSTED` and commit history.

## Layered verification

- `python -m pytest tests/test_contract.py -q`: 15 passed. Covers strict JSON, bounds, authority, stale revision, retirement, idempotent nonce replay, complete snapshot, later-registry isolation, draft/freeze locks, full-vector validator path, malformed result rejection, pagination, deterministic outcome combinations, and historical readback.
- `npm test -- --run`: 3 files, 20 tests passed, including wallet session, durable journal, presentation states, detected-provider-only picker, transaction phases, and public-language checks.
- `npm run build`: PASS; 477 modules transformed. Non-blocking warning: one minified SDK/application chunk is approximately 785 kB. No dependency was added to address a pre-deploy performance warning.
- `git diff --check`: PASS.
- Chrome visual QA: desktop 1440x1000 and mobile 390x844 PASS after containing the decision table's intrinsic width; no body overflow remains.

## Studio identity, limitations, and E2E plan

- Locked Task Chrome profile: `C:\Users\LEGION\AppData\Local\Temp\genlayer-mapr-predeploy-profile`.
- Selected accessible Studio deployer/constructor authority: `0xEe0c62F28866874c1D4BCd3F43aA019EeBbDcc18`.
- Network: GenLayer Studio / chain ID 61999 as observed by the current Studio client.
- Studio limitation declaration: the contract has no token transfer, gas-consumption claim, or contract-to-contract interaction. Live Studio is used only for schema/deployment, consensus transaction lifecycle, semantic execution, and authoritative contract readback.
- The exact minimum-sufficient sequence, conditional retry rule, call/transaction bounds, and pre-E2E physical measurement probe are locked in `docs/RPC-BUDGET.md`. No Studio mutation has started.

## Known limits and checkpoint boundary

- PRE_DEPLOY contains no deployment address/hash or live E2E receipt because those actions are forbidden until anonymous approval.
- The frontend deployment configuration remains intentionally unset until the exact approved Studio deployment exists.
- Browser-wallet/Vercel live evidence, GitHub/Vercel targets, public URLs, and submission material belong to later checkpoints and are not claimed here.
- No unresolved schema/runtime, security, scope, test, or presentation blocker is known at this checkpoint.

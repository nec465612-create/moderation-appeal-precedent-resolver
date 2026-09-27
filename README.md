# Moderation Appeal Precedent Resolver

A GenLayer intelligent contract and React interface for resolving moderation appeals against a complete, immutable snapshot of the active precedents for a rule.

## What it proves

- Every appeal freezes the full active precedent vector for its selected rule.
- Validators classify that same frozen vector before deterministic outcome reduction.
- Historical revisions remain readable after later registry changes.
- Bounded inputs, authority checks, stale-revision protection, nonce idempotency, and truthful transaction recovery are enforced.

## Project layout

- `contracts/main.py` — intelligent contract.
- `contract-schema.json` — checked ABI schema.
- `frontend/` — public React/Vite interface.
- `tests/` — contract tests.
- `frontend/tests/` — frontend and wallet/journal tests.

## Local verification

```powershell
python -m pytest tests/test_contract.py -q
cd frontend
npm test -- --run
npm run build
```

The contract is designed for the current GenLayer runtime and uses the public Studio deployment flow for live verification.

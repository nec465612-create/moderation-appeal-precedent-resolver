# Frontend Design Rationale

## Product identity

The interface should feel like a public casebook and precedent desk rather than a generic crypto dashboard. Its defining visual object is the immutable precedent set attached to each appeal: registry history flows into a frozen snapshot, validator labels annotate every item, and the deterministic holding appears only after that complete record is considered.

## Information hierarchy

1. Explain the trust problem immediately: an appellant cannot choose favorable precedent.
2. Keep the wallet and network state visible but subordinate to the public evidence.
3. Separate the authority's Registry workspace from the appellant's Appeals workspace while showing how one feeds the other.
4. Present each appeal as a traceable record: original `REMOVED` disposition, snapshot revision, every precedent and label, current phase, absolute outcome, and historical verification.
5. Place plain-language Docs/How it works inside the public application, with privacy and scope warnings adjacent to inputs.

## Visual direction

Use a judge-facing editorial/casebook system: restrained ink, parchment or mineral neutrals with one authoritative accent; strong typographic hierarchy; numbered citations and snapshot seals; compact record metadata; clear opposing `UPHOLD` and `REVERSE` holdings without implying moral correctness. Avoid neon crypto styling, token-market motifs, generic glass cards, template dashboards, fake analytics, or courthouse clichés.

Motion should clarify causality: active registry records visually gather into a frozen snapshot; transaction progress advances only with real lifecycle state. Reduced-motion users retain every status and relationship without animation.

## Interaction and accessibility

- Preserve all real forms, role checks, wallet/session selectors, journal behavior, RPC limits, transaction phases, hashes and readbacks.
- The wallet dialog renders only detected MetaMask, OKX Wallet and Rabby providers; zero providers means an empty state with zero wallet options.
- Dialog focus, Escape, backdrop behavior, inert background, focus restoration, keyboard order, visible focus, labels, errors, live transaction status, mobile layout and reduced motion are required.
- Every public label must describe the product, never internal governance, AI roles, checkpoints or implementation notes.

## Acceptance boundary

Claude owns the complete presentation layer and may reorganize components/styles/assets inside the allowed frontend boundary. Contract integration, wallet discovery/session logic, journal/RPC/transaction orchestration, environment configuration, tests and all non-frontend files remain unchanged unless the prompt explicitly allows a presentation test update.

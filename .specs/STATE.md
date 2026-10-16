# STATE

## Decisions

### AD-001
- **Decision**: Business logic lives in a pure, framework-agnostic TypeScript core (`(state, action) -> state` reducers + selectors); React consumes it via Context/`useReducer`, and persistence sits behind a repository adapter.
- **Reason**: Maximizes unit-testability (spec-anchored tests hit pure functions) and keeps UI/logic/storage decoupled.
- **Trade-off**: More boilerplate than a store library; manual Context wiring.
- **Scope**: All features in this project (state/domain layering).
- **Date**: 2026-10-15
- **Status**: active

### AD-002
- **Decision**: The product is a front-end-only prototype over bundled mock data — no backend, no real email transport (IMAP/SMTP/Gmail), no authentication.
- **Reason**: Scope decision for the HEY-style reader; focuses effort on design/UX and triage behavior.
- **Trade-off**: No real mail; "send/reply" affordances mutate local state only. Real transport is a future fullstack feature that would supersede this.
- **Scope**: Whole project until explicitly superseded.
- **Date**: 2026-10-15
- **Status**: active

### AD-003
- **Decision**: Client state persists to `localStorage` guarded by a `schemaVersion`, with fallback and reset to the bundled seed.
- **Reason**: Lets triage decisions survive reloads without a backend while staying demo-resettable and resilient to schema drift.
- **Trade-off**: Single-browser, single-user only; no cross-device sync.
- **Scope**: Persistence layer for all features.
- **Date**: 2026-10-15
- **Status**: active

### AD-004
- **Decision**: Test stack is Vitest + React Testing Library + jsdom.
- **Reason**: Vite-native and fast; RTL covers view behavior, Vitest covers the pure core.
- **Trade-off**: Commits to the Vitest ecosystem over Jest.
- **Scope**: All automated tests in the project.
- **Date**: 2026-10-15
- **Status**: active

## Handoff

- **Feature**: hey-mail-reader (`.specs/features/hey-mail-reader/`)
- **Phase / Task**: Execute complete (P1 + P2). T1–T28 committed; independent P1+P2 verification PASS (207 tests across 18 files, 6/6 discrimination mutations killed).
- **Completed**:
  - **P1 (`T1`–`T23`)**: Imbox, Screener, Reply Later + Focus & Reply, Set Aside, Feed, keyboard shortcuts, storage/schema resilience, and F1–F3 repairs.
  - **P2 (`T24`–`T28`)**:
    - `T24` (`ac0f194`): Added `Sender.bundled?: boolean`, `DisplayEntry`, and `SET_BUNDLE` action in `src/domain/types.ts`.
    - `T25` (`fb6c202`): Routed approved `receipt` senders to `paperTrail` with `personal > receipt > newsletter` precedence, added `selectPaperTrail(state, query?)`, and enabled pile support for `paperTrail`.
    - `T26` (`3cadcbf`): Added `SET_BUNDLE` reducer case, `selectDisplayEntries(state, emails)` bundle collapsing selector, and boolean `bundled` validation in `normalizeState()`.
    - `T27` (`2cb7ec2`): Built `PaperTrailView` with real-time sender/address/subject search, clearable no-match state, `/paper-trail` route in `AppShell`, and `Return to Paper Trail` in `ReturnToBox`.
    - `T28` (`4be27f0`): Added `BundleRow`, `EmailList`, and sender bundle toggle controls in `src/features/common/index.tsx`, wired into `ImboxView` (per group) and `PaperTrailView`.
- **In-progress** (file:line): none
- **Next step**: P1 and P2 are complete and verified. P3 (`BUBBLE-01`, `READ-01`, `SPY-01`) remains deferred until requested. Run `npm run dev` to explore the prototype.
- **Blockers**: none
- **Uncommitted files**: `.agents/` workspace skill customization remains intentionally untracked outside implementation commits (same as `.github/`).
- **Branch**: master; local only, no push/deploy
- **Gates**: Full build (`tsc -b && vite build`), ESLint (`eslint .`), and Vitest (`npx vitest run` -> 207 passed across 18 test files, 0 failed/skipped) all pass. Deterministic validators `validate_spec.py`, `validate_tasks.py`, and `validate_state.py` pass with 0 errors.
- **Validation scope**: Independent P2 Verifier (`author != verifier`) verified HEAD `4be27f0`, 27/27 P1+P2 ACs (`IMBOX-01..05`, `SCRN-01..05`, `REPLY-01..05`, `ASIDE-01..04`, `FEED-01..04`, `PAPER-01..02`, `BNDL-01..02`), 5/5 edge cases, and killed 3/3 P2 mutations (`M4`–`M6`) in a disposable worktree (`/tmp/missiva-verifier-sensor`).


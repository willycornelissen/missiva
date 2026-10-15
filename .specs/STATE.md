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
- **Phase / Task**: Execute complete. T1-T23 committed; independent
  re-verification PASS; all five P1 manual workflows approved by the user.
- **Completed**: T21 `edda10e` resolves Imbox reader eligibility through the
  current selector. Approve → open → reset restores persisted seed, removes
  pending mail from the reader, and returns the sender to Screener; ordinary
  open → seen remains open.
  T22 `613b0c2` validates raw bundled messages before sender dereference,
  skips invalid/missing fields and unknown senders, preserves source-index IDs,
  and logs/publishes diagnostics on first load, fallback and reset.
  T23 `f4e2a03` carries the user's explicit most-recent-first choice into
  REPLY-03 without changing behavior. Exact adequacy tables, gates, dependencies
  and traceability are appended in `tasks.md` and recorded in `spec.md`.
- **In-progress** (file:line): none
- **Next step**: No pending P1 implementation. Await a new user request;
  P2/P3 remain deferred. Run `npm run dev` to use the local prototype.
- **Blockers**: none
- **Uncommitted files**: pre-existing `.github/` skill installation remains
  intentionally outside implementation commits. Verification, lessons and
  closure status are included in the closing documentation commit.
- **Branch**: master; local only, no push/deploy
- **Gates**: T21 targeted 8, full 162; T22 targeted 111, full 192;
  T23 targeted 38, final build + lint + all 192 tests passed (17 files,
  zero failed/skipped). All original 161 tests unchanged; added 1 F1 test and
  30 F2 cases. Test-first runs reproduced F1's stale reader and F2's import
  crash. TypeScript caught a new guard narrowing error; corrected and full
  gate rerun successfully. Task/spec validators pass; only the original three
  build-only task warnings remain. Each commit message checked with
  `check_commit.py`, with coauthor trailer.
- **Seed/core contract**: `buildSeed()` returns validated `{state, diagnostics}`;
  `buildSeedState()` and `seed` remain state-only helpers. Shared pure content
  guards live in `src/domain/validation.ts`, avoiding dependency cycles.
  `normalizeState` includes seed skip diagnostics in fallback results. Core
  remains free of logging, React, DOM and storage.
- **Reset/notice contract**: Store intercepts `RESET_SEED` at the event boundary,
  invokes `repository.reset()` outside the reducer, and installs returned
  state through pure internal `RESTORE_SEED`. The normal save effect also sees
  restored state. Repository logs and publishes every seed skip; notices stay
  nonblocking through `useAppNotices`. Other triage behavior is unchanged.
- **Validation scope**: Independent report covers `2a7fdae..f4e2a03`,
  23/23 P1 ACs and 5/5 edges. Build/lint and 192 tests passed without skips.
  Three scratch mutations (stale reader, suppressed seed diagnostics, reversed
  Focus order) were killed; scratch removed and real porcelain preserved.
  `validate_state.py` passed. User subsequently approved Imbox, Screener,
  Reply Later/Focus, Set Aside and Feed manual tests. Visual resemblance was
  not separately evaluated. No assistant-owned helpers remain running.

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
- **Phase / Task**: Execute / batch 1 complete (T1-T9)
- **Completed**: Foundation and pure triage core, 40-email static JSON seed,
  schema/record normalization with diagnostics. Atomic task commits T1-T9;
  task-local gates and adequacy evidence recorded in `tasks.md`.
- **In-progress** (file:line): none
- **Next step**: Execute approved batch 2, T10-T12 (repository, AppStore,
  sanitizer), then batch 3 T13-T20, then independent verification.
  Do not treat pure core evidence as completed UI acceptance.
- **Blockers**: none
- **Uncommitted files**: only pre-existing `.github/skills/` installation,
  intentionally outside task commits
- **Branch**: master; local only, no push/deploy
- **Gates**: T1/T2 build + lint + tests passed (0 tests); T3 phase boundary
  build + lint + 2 tests passed; T4/T5/T6/T7/T8 quick gates passed with
  6/12/19/26/37 tests; T9 phase boundary build + lint + 97 tests passed
  (3 files, 0 failed/skipped). Every commit passed `check_commit.py`.
- **API handoff**: `src/domain/triage.ts` exports `reduce`, `routeIncoming`,
  `selectImbox`, `selectFeed`, `selectScreener`, `selectPile`,
  `selectFocusReply`, `normalizeState`. `src/data/seed.ts` exports `seed`
  and fresh `buildSeedState()`. `SCHEMA_VERSION` and all models/actions/result
  types are exported by `src/domain/types.ts`.
- **Adapter contract**: `normalizeState(unknown)` returns
  `{state, restoredSeed, diagnostics}`. Log malformed record diagnostics and
  retain notice data for the banner; never silently discard diagnostics.
  Missing storage key uses fresh seed without a corruption notice; JSON parse
  and storage exceptions belong in T10. See README for full contract.
- **Clarifications**: sender kinds accept arrays; personal wins.
  Pending mail has explicit `screener` box; P1 receipts use Imbox.
  Piles and Focus are newest-first. Finish removes a reply and marks it seen;
  remaining-queue cursor is zero. Explicit exit preserves the pile.
  Design documents these deviations. Core imports no browser/React/storage APIs.

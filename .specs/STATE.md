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
- **Phase / Task**: Execute / batch 2 complete (T10-T12); T1-T12 complete
- **Completed**: Core/seed plus storage repository, AppStore provider/hooks,
  DOMPurify sanitizer. T10 `8d57d32`, T11 `4fb6400`, T12 in this atomic task
  commit. Task-local exact assertion/traceability evidence is in `tasks.md`.
- **In-progress** (file:line): none
- **Next step**: Execute approved batch 3 T13-T20, then independent verification.
  No UI acceptance is claimed by adapter/core tests.
- **Blockers**: none
- **Uncommitted files**: only pre-existing `.github/skills/` installation,
  intentionally outside task commits
- **Branch**: master; local only, no push/deploy
- **Gates**: T9 baseline 97 tests; T10 quick gate 109; T11 quick gate 116
  plus targeted lint; T12 full build + lint + all 123 tests passed (6 files,
  0 failed/skipped). All tests added test-first; no prior tests altered.
  Each task message checked with `check_commit.py`. Editor test discovery
  found no tests; configured Vitest CLI used.
- **Core API**: `src/domain/triage.ts` exports `reduce`, `routeIncoming`,
  `selectImbox`, `selectFeed`, `selectScreener`, `selectPile`,
  `selectFocusReply`, `normalizeState`; `buildSeedState()` returns fresh seed.
- **Repository API**: `src/data/repository.ts`: `repository` singleton,
  `createRepository(getStorage?)`, `MailRepository`, `RepositoryNotice`,
  `STORAGE_KEY`. Methods: `load`, `save`, `reset`, `getNotices`, `subscribe`.
  Load caches per instance. Every diagnostic is logged and retained.
  Read failure seeds; later write failure keeps latest triage in memory.
  Fallback is sticky. Never discard notices.
- **UI handoff**: Mount `AppStoreProvider` once. `useAppState()` and
  `useDispatch()` expose domain state/actions; dispatch `RESET_SEED` for reset.
  `useAppNotices()` exposes live readonly notices, including failed save effects.
  Notice union: core diagnostics; `seed-restored` / `invalid-json`;
  `storage-unavailable` with `operation: load | save | reset`.
  Render `notice.message` in T20's non-blocking banner. Notices persist through
  save/reset. Exact messages: "Restored sample mailbox" and
  "Changes won't be saved this session". README documents the full API.
- **Sanitizer**: `src/lib/sanitize.ts` exports `sanitizeHtml(raw): string`.
  T14/T19 must use it at every email-body render seam; never append raw HTML.
  DOMPurify HTML-only profile preserves safe markup/remote images.
- **Clarifications**: sender kinds accept arrays; personal wins.
  Pending mail has explicit `screener` box; P1 receipts use Imbox.
  Piles and Focus are newest-first. Finish removes a reply and marks it seen;
  remaining-queue cursor is zero. Explicit exit preserves the pile.
  Core imports no browser/React/storage APIs. No new batch deviations.

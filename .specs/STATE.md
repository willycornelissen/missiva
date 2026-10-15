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
- **Phase / Task**: Execute / batch 3 complete (T13-T20); T1-T20 implemented.
  Independent feature verification pending.
- **Completed**: Responsive five-route reader, sidebar, counted dock, safe
  reader/previews/Feed, Imbox New/Seen, Screener, Reply Later/Focus, Set Aside
  return, keyboard selection/actions, notices/reset, reduced motion, README.
  T13 `edc019d`, T14 `10e98d7`, T15 `a478e41`, T16 `90eb41b`,
  T17 `93254f0`, T18 `b7cbb79`, T19 `0dc5f83`; T20 in this atomic commit.
  Exact per-task assertion/traceability evidence is in `tasks.md`.
- **In-progress** (file:line): none
- **Next step**: Orchestrator dispatches the mandatory independent Verifier
  over T1-T20, including spec-anchored coverage and discrimination sensor.
  This worker did not spawn nested agents or claim feature-level PASS.
- **Blockers**: none
- **Uncommitted files**: only pre-existing `.github/skills/` installation,
  intentionally outside task commits
- **Branch**: master; local only, no push/deploy
- **Gates**: T12 baseline 123; batch quick gates T13 125, T14 130, T15 133,
  T16 137, T17 140, T18 144, T19 148. T20 full build + lint + all 161 tests
  passed (15 files, zero failed/skipped). All 38 new tests written first;
  no prior tests weakened, removed, or skipped. Every task message checked
  with `check_commit.py`; `.github/skills/` never staged.
- **Browser checks**: Real open/seen, screening, three-reply Focus progression,
  Feed/pile return, keyboard, persistence/reload, schema notice/reset exercised.
  All routes at 390px/1440px without horizontal page overflow; desktop/mobile
  screenshots inspected. Reduced motion computed `none`/`0s` versus normal
  `arrive`/`0.18s`. Helper server stopped and demo storage restored.
- **Core API**: `src/domain/triage.ts` exports `reduce`, `routeIncoming`,
  `selectImbox`, `selectFeed`, `selectScreener`, `selectPile`,
  `selectFocusReply`, `normalizeState`; `buildSeedState()` returns fresh seed.
- **Repository API**: `src/data/repository.ts`: `repository` singleton,
  `createRepository(getStorage?)`, `MailRepository`, `RepositoryNotice`,
  `STORAGE_KEY`. Methods: `load`, `save`, `reset`, `getNotices`, `subscribe`.
  Load caches per instance. Every diagnostic is logged and retained.
  Read failure seeds; later write failure keeps latest triage in memory.
  Fallback is sticky. Never discard notices.
- **UI contract**: `AppShell` mounts `AppStoreProvider` once. `useAppState()` and
  `useDispatch()` expose domain state/actions; dispatch `RESET_SEED` for reset.
  `useAppNotices()` exposes live readonly notices, including failed save effects.
  Notice union: core diagnostics; `seed-restored` / `invalid-json`;
  `storage-unavailable` with `operation: load | save | reset`.
  `NoticeBanner` renders `notice.message` nonblockingly. Notices persist through
  save/reset. Exact messages: "Restored sample mailbox" and
  "Changes won't be saved this session". README documents the full API.
- **Sanitizer**: `src/lib/sanitize.ts` exports `sanitizeHtml(raw): string`.
  Shared `EmailBody` uses it for reader, Screener, Focus, and Feed; no raw HTML
  is appended. DOMPurify HTML-only profile preserves safe markup/remote images.
- **Keyboard contract**: `j` selects first/next, `k` last/previous, bounded at
  ends; `r/e` target selected or opened/focused message; `y/n` selected sender.
  Editing, composition, repeat and modified key events are ignored.
- **Clarifications**: sender kinds accept arrays; personal wins.
  Pending mail has explicit `screener` box; P1 receipts use Imbox.
  Piles and Focus are newest-first. Finish removes a reply and marks it seen;
  remaining-queue cursor is zero. Explicit exit preserves the pile.
  Core imports no browser/React/storage APIs. No new batch deviations.

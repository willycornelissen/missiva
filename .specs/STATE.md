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
- **Phase / Task**: Execute & Validate complete (P1 + P2 + P3). T1–T32 committed; independent P1+P2+P3 verification PASS (30/30 requirements Verified, 214 tests across 18 files, 9/9 discrimination mutations killed).
- **Completed**:
  - **P1 (`T1`–`T23`)**: Imbox, Screener, Reply Later + Focus & Reply, Set Aside, Feed, keyboard shortcuts, storage/schema resilience, and F1–F3 repairs.
  - **P2 (`T24`–`T28`)**: Paper Trail (`PAPER-01`, `PAPER-02`) and Sender Bundles (`BNDL-01`, `BNDL-02`).
  - **P3 (`T29`–`T32`)**:
    - `T29` (`cf0dace`): Added `Email.bubbledUntil?: string | null`, `BUBBLE_UP` / `BUBBLE_RELEASE` actions, `selectBubbledUp(state)`, and `bubbledUntil` ISO date validation in `normalizeState()`.
    - `T30` (`9285b5d`): Added `detectTrackingPixels(raw)` and spy-pixel `<img>` stripping in `sanitizeHtml(raw)` (`src/lib/sanitize.ts`), plus seeded tracker marker in `src/data/seed.json`.
    - `T31` (`cc884b0`): Added `Bubble Up` action in `MailActions`, `Bubbled Up` scheduling tray with `Release bubbled mail` in `ImboxView`, multi-select checkboxes, and `ReadTogetherReader` stacked scrollable view (`BUBBLE-01`, `READ-01`).
    - `T32` (`e50e010`): Surfaced `Spy pixel blocked` notice and `Tracker flagged` sender badge in `MailReader`, `EmailRow`, and `FeedView` (`SPY-01`).
- **In-progress** (file:line): none
- **Next step**: All planned phases (`P1`, `P2`, `P3` — 30/30 requirements, `T1`–`T32`) are complete and independently verified. Run `npm run dev` to explore the full application or specify a new feature.
- **Blockers**: none
- **Uncommitted files**: `.agents/` workspace skill customization remains intentionally untracked outside implementation commits (same as `.github/`).
- **Branch**: master; local only, no push/deploy
- **Gates**: Full build (`tsc -b && vite build`), ESLint (`eslint .`), and Vitest (`npx vitest run` -> 214 passed across 18 test files, 0 failed/skipped) all pass. Deterministic validators `validate_spec.py`, `validate_tasks.py`, and `validate_state.py` pass with 0 errors.
- **Validation scope**: Independent P3 Verifier (`author != verifier`) verified HEAD `e50e010`, 30/30 P1+P2+P3 ACs (`IMBOX-01..05`, `SCRN-01..05`, `REPLY-01..05`, `ASIDE-01..04`, `FEED-01..04`, `PAPER-01..02`, `BNDL-01..02`, `BUBBLE-01`, `READ-01`, `SPY-01`), 6/6 edge cases, and killed 9/9 mutations (`M1`–`M9`) in a disposable worktree (`/tmp/missiva-verifier-sensor`).



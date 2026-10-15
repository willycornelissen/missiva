# HEY-style Mail Reader Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/hey-mail-reader/design.md`
**Status**: Approved for Execute

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (empty repository) - strong defaults applied; test stack fixed by `.specs/STATE.md` AD-004 (Vitest + React Testing Library + jsdom).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Triage core (domain logic) | unit | All branches; 1:1 to spec ACs; every listed edge case has a test | `src/domain/*.test.ts` | `npm test` |
| Repository / persistence | unit | Load/save/reset + schema-version fallback + storage-failure path | `src/data/*.test.ts` | `npm test` |
| Lib (sanitizer) | unit | XSS payload stripped; safe markup preserved | `src/lib/*.test.ts` | `npm test` |
| State store (Context) | unit (component) | Provider persists on dispatch; reset works | `src/state/*.test.tsx` | `npm test` |
| Feature views / components | unit (component, RTL) | Each P1 story: happy path + empty state + the view's listed ACs | `src/features/**/*.test.tsx` | `npm test` |
| Project scaffold / types / seed / config | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Single Vitest runner; no separate e2e layer, so Quick and Full share the test command.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit/component tests | `npm test` |
| Full | After tasks touching multiple layers | `npm test` |
| Build | After scaffold/types/seed/config-only tasks or phase completion | `npm run build && npm run lint && npm test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order. Dependencies are linear (each task depends on the prior one) because the build is strictly sequential.

### Phase 1: Foundation

```
T1 → T2 → T3
```

### Phase 2: Triage Core (pure logic, unit-tested 1:1 to ACs)

```
T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Persistence & Store

```
T10 → T11 → T12
```

### Phase 4: UI Shell & Views

```
T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20
```

---

## Task Breakdown

### T1: Scaffold Vite + React + TS project with tooling

**What**: Initialize the project (Vite React-TS template, Vitest + RTL + jsdom, ESLint, npm scripts `dev`/`build`/`lint`/`test`) and the `src/` folder skeleton.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Vite `react-ts` template defaults

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run build` succeeds on the empty app
- [x] `npm test` runs (zero tests is OK) and `npm run lint` passes
- [x] Scripts `dev`, `build`, `lint`, `test` exist; Vitest configured with jsdom + RTL setup

**Tests**: none
**Gate**: build

**Commit**: `chore(scaffold): init vite react-ts project with vitest and eslint`

**Execution evidence (T1)**: Build + ESLint + Vitest passed (0 tests, explicitly
allowed for foundation). `package.json` exports all four scripts;
`vite.config.ts` selects jsdom and `src/test/setup.ts` installs jest-dom and RTL
cleanup. Adequacy A/C: no test assertions required by the matrix; all three
criteria covered by build/lint/test execution and configuration inspection.
B: no placeholder tests. D: AD-004 followed. Template now ships Oxlint;
replaced it with the explicitly requested ESLint. Generated demo assets removed.

---

### T2: Define domain models and action types

**What**: Add all TypeScript types (`Sender`, `Email`, `AppState`, `TriageAction`, enums) from the design's Data Models.
**Where**: `src/domain/types.ts`
**Depends on**: T1
**Reuses**: Design Data Models section

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] All types/enums from design exist and are exported
- [x] No TypeScript errors (`npm run build`)

**Tests**: none
**Gate**: build

**Commit**: `feat(domain): add mail reader domain models and action types`

**Execution evidence (T2)**: Build + lint + tests passed (0 tests, matrix permits
types-only tasks). A/C: type exports inspected in `src/domain/types.ts`;
TypeScript build verifies the complete discriminated action union and models.
B: no placeholder tests. D: AD-001/AD-004 followed. Design clarifications record
plural classifications, explicit screener box, and receipts' P1 Imbox default.

---

### T3: Create mock seed data

**What**: Build the ~40-email bundled seed across personal/newsletter/receipt senders, including unknown (pending) senders for The Screener.
**Where**: `src/data/seed.ts`
**Depends on**: T2
**Reuses**: `src/domain/types.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `seed` is a valid `AppState` with `schemaVersion`, senders, emails, order
- [ ] Contains pending senders, newsletters, and receipts to exercise all P1 flows
- [ ] No TypeScript errors (`npm run build`)

**Tests**: none
**Gate**: build

**Commit**: `feat(data): add bundled mock email seed`

---

### T4: Implement core reducer skeleton + OPEN_EMAIL + Imbox selectors

**What**: Create `reduce()` dispatch, `OPEN_EMAIL` seen transition, and `selectImbox` (New-for-you / Previously-seen split).
**Where**: `src/domain/triage.ts`
**Depends on**: T3
**Reuses**: `src/domain/types.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `selectImbox` returns two ordered groups (IMBOX-01)
- [ ] `OPEN_EMAIL` moves an email to Previously-seen and marks it seen (IMBOX-02, IMBOX-03)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests map 1:1 to IMBOX-01/02/03; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add reducer core, open-email seen transition, imbox selectors`

---

### T5: Implement Screener decisions and routing

**What**: Add `SCREEN_DECIDE`, pending-sender gating, approve→Imbox/Feed, reject→screenedOut, and `selectScreener`.
**Where**: `src/domain/triage.ts`
**Depends on**: T4
**Reuses**: `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Pending senders stay out of Imbox/Feed and appear in Screener (SCRN-01)
- [ ] Approve routes current+future mail; reject suppresses it (SCRN-02, SCRN-03)
- [ ] Decision persists per sender (SCRN-04); empty-screener selector path covered (SCRN-05)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests map 1:1 to SCRN-01..05; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add screener decisions and sender routing`

---

### T6: Implement Feed routing and selector

**What**: Route approved newsletter senders to the Feed and add `selectFeed` (newest first, already-open semantics).
**Where**: `src/domain/triage.ts`
**Depends on**: T5
**Reuses**: `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Approved newsletters route to Feed, not Imbox (FEED-01)
- [ ] `selectFeed` returns items newest-first (FEED-02); scroll does not touch Imbox counters (FEED-03)
- [ ] Empty-feed path covered (FEED-04)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests map 1:1 to FEED-01..04; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add feed routing and selector`

---

### T7: Implement Reply Later pile and Focus & Reply

**What**: Add `REPLY_LATER`, `FOCUS_REPLY_START/NEXT/EXIT`, cursor advance, and `selectPile('replyLater')`.
**Where**: `src/domain/triage.ts`
**Depends on**: T6
**Reuses**: `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `REPLY_LATER` adds to the pile with a count (REPLY-01, REPLY-02)
- [ ] Focus mode yields one email at a time in order and advances (REPLY-03, REPLY-04)
- [ ] Emptying the pile exits focus mode (REPLY-05)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests map 1:1 to REPLY-01..05; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add reply-later pile and focus & reply flow`

---

### T8: Implement Set Aside pile and pile conflict rule

**What**: Add `SET_ASIDE`, `REMOVE_FROM_PILE` (restore to originBox), the single-pile conflict rule, and `selectPile('setAside')`.
**Where**: `src/domain/triage.ts`
**Depends on**: T7
**Reuses**: `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Set-aside adds to pile with count and leaves New-for-you (ASIDE-01, ASIDE-02, ASIDE-04)
- [ ] Remove restores to originating box (ASIDE-03)
- [ ] Conflicting pile assignment keeps only the most recent pile (spec edge case)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests map 1:1 to ASIDE-01..04 + conflict edge; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add set-aside pile and pile conflict rule`

---

### T9: Implement schema-version guard and malformed-email handling in core

**What**: Add `RESET_SEED` and a `normalizeState()`/load-guard that drops malformed emails and falls back to seed on unknown `schemaVersion`.
**Where**: `src/domain/triage.ts`
**Depends on**: T8
**Reuses**: `src/data/seed.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Unknown `schemaVersion` falls back to seed with a signalled notice flag (IMBOX-05)
- [ ] Malformed/missing-field emails are skipped, not fatal (spec edge case)
- [ ] `RESET_SEED` restores the seed
- [ ] Gate check passes: `npm test`
- [ ] Unit tests cover IMBOX-05 + malformed edge; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add schema-version guard and malformed-email handling`

---

### T10: Implement storage repository

**What**: Build `load/save/reset` over `localStorage` with the schema guard and in-memory fallback on storage failure.
**Where**: `src/data/repository.ts`
**Depends on**: T9
**Reuses**: `src/data/seed.ts`, `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `load` returns persisted state or seed on miss/invalid/version-mismatch (IMBOX-05)
- [ ] `save` persists; `reset` restores seed
- [ ] `localStorage` throw is caught → in-memory fallback (spec edge case)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests cover load/save/reset + failure path; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(data): add localStorage repository with schema guard and fallback`

---

### T11: Implement AppStore Context and provider

**What**: Create Context + `useReducer` provider that initializes from `repository.load()` and persists on each change, with `useAppState`/`useDispatch` hooks.
**Where**: `src/state/AppStore.tsx`
**Depends on**: T10
**Reuses**: `src/data/repository.ts`, `src/domain/triage.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Provider seeds from repository and persists on dispatch
- [ ] Hooks expose state and dispatch; reset works
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover persist-on-dispatch + reset; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(state): add app store context with persistence wiring`

---

### T12: Implement HTML sanitizer

**What**: Add `sanitizeHtml()` wrapping DOMPurify for email body rendering.
**Where**: `src/lib/sanitize.ts`
**Depends on**: T11
**Reuses**: `dompurify`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Scripts/event handlers stripped; safe markup preserved (spec edge case)
- [ ] Gate check passes: `npm test`
- [ ] Unit tests cover an XSS payload + safe markup; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(lib): add html sanitizer for email bodies`

---

### T13: Build app shell and client routing

**What**: Create `AppShell` (sidebar nav + main pane + bottom pile dock slot) and routes for `/imbox`, `/feed`, `/screener`, `/reply-later`, `/set-aside`.
**Where**: `src/app/AppShell.tsx`
**Depends on**: T12
**Reuses**: `react-router-dom`, `src/state/AppStore.tsx`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] All five routes render their placeholder view within the shell
- [ ] Shell mounts the AppStore provider
- [ ] Gate check passes: `npm test`
- [ ] Component test covers route navigation; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(app): add shell layout and client routing`

---

### T14: Build shared components (EmailRow, EmptyState, PileDock)

**What**: Create the reusable `EmailRow`, `EmptyState`, and `PileDock` (bottom-docked pile tiles with counts) components.
**Where**: `src/features/common/index.tsx`
**Depends on**: T13
**Reuses**: `src/domain/types.ts`, `src/lib/sanitize.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `EmailRow` shows sender, subject, snippet, time, seen/unseen state
- [ ] `EmptyState` renders message + placeholder; `PileDock` shows pile counts
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover each component's rendering; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ui): add shared email row, empty state, and pile dock`

---

### T15: Build Imbox view

**What**: Implement `ImboxView` with New-for-you / Previously-seen groups, open-to-seen, and empty state.
**Where**: `src/features/imbox/ImboxView.tsx`
**Depends on**: T14
**Reuses**: `src/features/common/index.tsx`, AppStore selectors

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Renders both groups; opening a new email moves it to seen (IMBOX-01..03)
- [ ] Empty New-for-you shows a dedicated empty state (IMBOX-04)
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover IMBOX-01..04; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(imbox): add imbox view with new/seen groups`

---

### T16: Build Screener view

**What**: Implement `ScreenerView` listing pending senders with Yes/No decision controls and empty state.
**Where**: `src/features/screener/ScreenerView.tsx`
**Depends on**: T15
**Reuses**: `src/features/common/index.tsx`, AppStore actions

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Approve/reject dispatch the correct actions and update boxes (SCRN-02, SCRN-03)
- [ ] Empty screener shows a dedicated empty state (SCRN-05)
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover approve/reject + empty state; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(screener): add screener view with yes/no decisions`

---

### T17: Build Reply Later pile and Focus & Reply UI

**What**: Implement the Reply Later pile tile and the `FocusReplyMode` stepper view.
**Where**: `src/features/reply-later/ReplyLater.tsx`
**Depends on**: T16
**Reuses**: `src/features/common/index.tsx`, AppStore actions

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Pile shows count; Focus mode steps one-by-one and exits when empty (REPLY-01..05)
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover pile + focus stepping + exit; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(reply-later): add reply-later pile and focus & reply ui`

---

### T18: Build Set Aside pile UI

**What**: Implement the Set Aside pile tile with count, expand, and return-to-box control.
**Where**: `src/features/set-aside/SetAside.tsx`
**Depends on**: T17
**Reuses**: `src/features/common/index.tsx`, AppStore actions

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Pile shows count; items can be returned to their box (ASIDE-01..03)
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover add/return + count; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(set-aside): add set-aside pile ui`

---

### T19: Build Feed view

**What**: Implement `FeedView` rendering items already-open, newest first, in one scrollable column, with empty state.
**Where**: `src/features/feed/FeedView.tsx`
**Depends on**: T18
**Reuses**: `src/features/common/index.tsx`, AppStore selectors, `src/lib/sanitize.ts`

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Items render expanded, newest first (FEED-02); empty feed shows empty state (FEED-04)
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover ordering + empty state; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(feed): add feed view`

---

### T20: Add keyboard shortcuts, reduced-motion styling, and error banner

**What**: Implement `useShortcuts` (`j/k/e/r/y/n`), motion transitions guarded by `prefers-reduced-motion`, and the non-blocking error/notice banner.
**Where**: `src/features/common/useShortcuts.ts`
**Depends on**: T19
**Reuses**: AppStore dispatch, shared components

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Shortcuts move selection and trigger triage actions
- [ ] Transitions respect `prefers-reduced-motion`; banner shows seed-restore / no-persist notices
- [ ] Gate check passes: `npm test`
- [ ] Component tests cover shortcut dispatch + banner; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ui): add keyboard shortcuts, reduced-motion, and notice banner`

---

## Phase Execution Map

Phases run in sequence; tasks within a phase run in order. The full linear chain (dependencies point strictly backward):

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20
```

Per phase:

```
Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6 → T7 → T8 → T9
Phase 3:  T10 → T11 → T12
Phase 4:  T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20
```

Execution is strictly sequential - there is no intra-phase parallelism.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Scaffold project | 1 project init | ✅ Granular (cohesive setup) |
| T2: Domain types | 1 file | ✅ Granular |
| T3: Seed data | 1 file | ✅ Granular |
| T4: Reducer + open + imbox selectors | 1 file, cohesive slice | ✅ Granular |
| T5: Screener logic | 1 file (extend) | ✅ Granular |
| T6: Feed routing | 1 file (extend) | ✅ Granular |
| T7: Reply Later + Focus | 1 file (extend) | ✅ Granular |
| T8: Set Aside + conflict | 1 file (extend) | ✅ Granular |
| T9: Schema guard | 1 file (extend) | ✅ Granular |
| T10: Repository | 1 file | ✅ Granular |
| T11: AppStore | 1 file | ✅ Granular |
| T12: Sanitizer | 1 file | ✅ Granular |
| T13: Shell + routing | 1 file | ✅ Granular |
| T14: Shared components | 1 file, cohesive set | ✅ Granular |
| T15: Imbox view | 1 component | ✅ Granular |
| T16: Screener view | 1 component | ✅ Granular |
| T17: Reply Later UI | 1 component | ✅ Granular |
| T18: Set Aside UI | 1 component | ✅ Granular |
| T19: Feed view | 1 component | ✅ Granular |
| T20: Shortcuts + banner | 1 hook + styling | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | — (start) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Tests field | Matrix expectation | Status |
| ---- | ---------- | ----------- | ------------------ | ------ |
| T1 | Scaffold/config | none | none (build gate) | ✅ |
| T2 | Types | none | none (build gate) | ✅ |
| T3 | Seed data | none | none (build gate) | ✅ |
| T4 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T5 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T6 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T7 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T8 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T9 | Triage core | unit | unit, 1:1 ACs | ✅ |
| T10 | Repository | unit | unit, load/save/reset+failure | ✅ |
| T11 | State store | unit | unit (component) | ✅ |
| T12 | Lib (sanitizer) | unit | unit, XSS+safe | ✅ |
| T13 | Feature view/shell | unit | component | ✅ |
| T14 | Components | unit | component | ✅ |
| T15 | Feature view | unit | component, ACs+empty | ✅ |
| T16 | Feature view | unit | component, ACs+empty | ✅ |
| T17 | Feature view | unit | component, ACs+empty | ✅ |
| T18 | Feature view | unit | component, ACs+empty | ✅ |
| T19 | Feature view | unit | component, ACs+empty | ✅ |
| T20 | Components/hook | unit | component | ✅ |

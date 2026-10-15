# HEY-style Mail Reader Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/hey-mail-reader/design.md`
**Status**: Complete - T1-T20 plus approved repairs T21-T23; independent verification PASS (192 tests, 3/3 mutations killed); all five P1 manual workflows approved by the user. Evidence: `validation.md`.

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

- [x] `seed` is a valid `AppState` with `schemaVersion`, senders, emails, order
- [x] Contains pending senders, newsletters, and receipts to exercise all P1 flows
- [x] No TypeScript errors (`npm run build`)

**Tests**: none
**Gate**: build

**Commit**: `feat(data): add bundled mock email seed`

**Execution evidence (T3)**: Phase boundary build + lint + all tests passed:
2 tests, 1 file, 0 skipped/failed. Optional seed tests strengthen the build-only
minimum. All bodies are bundled static JSON; dates and IDs are deterministic.

| Criterion (A) | Assertion evidence | Outcome |
| --- | --- | --- |
| Valid complete seed | `src/data/seed.test.ts:7-20`: `expect(seed.schemaVersion).toBe(SCHEMA_VERSION)`, `expect(Object.keys(seed.emails)).toHaveLength(40)`, `expect(seed.senders[email.senderId].id).toBe(email.senderId)`, field/date/seen/origin assertions | 40 complete, linked records |
| Receive order | `src/data/seed.test.ts:22`: `expect(seed.order.map((id) => seed.emails[id].receivedAt)).toEqual(...sort())` | Oldest first |
| Demo categories and states | `src/data/seed.test.ts:28-38`: kind set equals personal/newsletter/receipt; decision set equals pending/approved/rejected; seen and pile sets cover all variants; `expect(buildSeedState()).toEqual(seed)` | Every P1 flow has sample data |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `seed.test.ts:7-24` above | T3 valid AppState and bundled ~40-email assumption | Yes |
| `seed.test.ts:28-38` above | T3 all-P1 demo fixtures and deterministic seed | Yes |

Adequacy A-D: covered, state/value assertions rather than mocks, all tests
necessary, AD-004/co-location followed. No tests changed, skipped, or deleted.

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

- [x] `selectImbox` returns two ordered groups (IMBOX-01)
- [x] `OPEN_EMAIL` moves an email to Previously-seen and marks it seen (IMBOX-02, IMBOX-03)
- [x] Gate check passes: `npm test`
- [x] Unit tests map 1:1 to IMBOX-01/02/03; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add reducer core, open-email seen transition, imbox selectors`

**Execution evidence (T4)**: `npm test`: 6 passed (4 domain + 2 seed), 0
skipped/failed. Removed scaffold-only `--passWithNoTests` from `package.json`
now that meaningful tests exist. UI rendering remains T14/T15.

| Criterion (A) | Assertion evidence (`src/domain/triage.test.ts`) | Outcome |
| --- | --- | --- |
| IMBOX-01 groups/order | `:37-38` `expect(ids(selectImbox(state).newForYou)).toEqual(['new', 'old'])`; seen IDs equal `['read-new', 'read-old']` | Separate, newest-first groups |
| IMBOX-02 transition | `:45-48` `expect(next.emails.new).toEqual({ ...state.emails.new, seen: true })`; new equals `[]`, seen IDs equal `['new']`, `expect(state).toEqual(before)` | Only new state becomes seen |
| IMBOX-03 state for indicator | `:53-54` `expect(groups.newForYou.map((e) => e.seen)).toEqual([false])`; seen flags equal `[true]` | Explicit distinct flags |
| IMBOX-04 selector empty path | `:58-61` `expect(selectImbox(mailbox([]))).toEqual({ newForYou: [], previouslySeen: [] })` | Empty lists for view to render |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `triage.test.ts:37-38`, exact IDs above | IMBOX-01; pile isolation | Yes |
| `triage.test.ts:45-48`, exact state above | IMBOX-02; immutable core | Yes |
| `triage.test.ts:53-54`, flags above | IMBOX-03 | Yes |
| `triage.test.ts:58-61`, groups above | IMBOX-04 selector path | Yes |

Adequacy A-D: all core criteria covered; state/payload values checked, no shallow
tests, every test spec-linked; AD-004/co-location followed. Precision clarification:
Imbox's "ordered groups" does not specify within-group ordering; newest-first
matches the design's global receive order and Feed convention.

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

- [x] Pending senders stay out of Imbox/Feed and appear in Screener (SCRN-01)
- [x] Approve routes current+future mail; reject suppresses it (SCRN-02, SCRN-03)
- [x] Decision persists per sender (SCRN-04); empty-screener selector path covered (SCRN-05)
- [x] Gate check passes: `npm test`
- [x] Unit tests map 1:1 to SCRN-01..05; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add screener decisions and sender routing`

**Execution evidence (T5)**: `npm test`: 12 passed (+6), 0 skipped/failed.
Decision persistence here means immutable per-sender state; durable storage is
T10. Screener empty rendering remains T16. `routeIncoming` expects an existing
sender record (pending for first-time senders); duplicate IDs are not inserted.

| Criterion (A) | Assertion evidence (`src/domain/triage.test.ts`) | Outcome |
| --- | --- | --- |
| SCRN-01 | `:46-49` `expect(selectImbox(next)).toEqual({ newForYou: [], previouslySeen: [] })`; incoming email equals `{...email('second'), box:'screener', originBox:'screener'}`; `expect(selectScreener(next)).toEqual([unknown])` | Pending mail isolated, sender listed once |
| SCRN-02 | `:62-66` `expect(next.emails[id]).toEqual(email(id, { box, originBox: box }))`; sender equals approved sender; screener equals `[]`; original equals snapshot | Every current/future personal/newsletter routed correctly |
| SCRN-03 | `:77-81` `expect(next.emails[id]).toEqual(email(id, { box: 'screenedOut', originBox: 'screenedOut' }))`; decision equals rejected; Imbox IDs equal `['other']` | Rejection clears both piles, suppresses future mail |
| SCRN-04 | `:89-92` `expect(repeated).toEqual(approved)`; decision equals approved; Imbox IDs equal `['future', 'first']`; screener equals `[]` | Sender screened once |
| SCRN-05 | `:96-98` `expect(selectScreener(...)).toEqual([])` for no mail, approved, rejected | Empty selector paths |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `triage.test.ts:46-49`, exact pending state above | SCRN-01 | Yes |
| `triage.test.ts:62-66`, current/future payload above | SCRN-02, immutable core | Yes |
| `triage.test.ts:77-81`, rejected state above | SCRN-03 | Yes |
| `triage.test.ts:89-92`, remembered state above | SCRN-04 | Yes |
| `triage.test.ts:96-98`, empty arrays above | SCRN-05 | Yes |

Adequacy A-D passed: full state payloads and every screening branch checked,
no shallow/unclaimed tests; AD-004 followed. T4 evidence lines refer to its
commit; later additions shifted the open/flags/empty assertions to :106-122.

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

- [x] Approved newsletters route to Feed, not Imbox (FEED-01)
- [x] `selectFeed` returns items newest-first (FEED-02); scroll does not touch Imbox counters (FEED-03)
- [x] Empty-feed path covered (FEED-04)
- [x] Gate check passes: `npm test`
- [x] Unit tests map 1:1 to FEED-01..04; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add feed routing and selector`

**Execution evidence (T6)**: `npm test`: 19 passed (+7), 0 skipped/failed.
Full body availability is the core's expanded semantics; actual expanded DOM
and scroll handling remain T19. Dual classifications prioritize personal in
either array order. Approved receipts follow the documented P1 Imbox default.

| Criterion (A) | Assertion evidence (`src/domain/triage.test.ts`) | Outcome |
| --- | --- | --- |
| FEED-01 | `:129-131` `expect(next.emails.letter).toEqual(email('letter', { box: 'feed', originBox: 'feed' }))`; Feed equals `[next.emails.letter]`; Imbox groups empty | Newsletter exclusively Feed |
| FEED-02 | `:141-142` `expect(ids(selectFeed(state))).toEqual(['new', 'old'])`; body equals `'<h2>Newest edition</h2><p>Full story</p>'` | Newest first, full bodies |
| FEED-03 | `:152-153` `expect(state).toEqual(before)`; New group equals `[email('personal', { senderId: 'personal' })]` | Reading Feed does not clear Imbox unseen state |
| FEED-04/SCRN-01 | `:157,160` `expect(selectFeed(...)).toEqual([])` | Empty and gated states |
| Dual classification edge | `:171-173` Imbox IDs equal `['future', 'first']`; Feed equals `[]`; future box equals `'imbox'` | Personal wins both orders |
| P1 receipts clarification | `:180-181` Imbox IDs equal `['future-receipt', 'receipt']`; Feed equals `[]` | No inaccessible P2-only mail |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `triage.test.ts:129-131`, routed payload above | FEED-01 | Yes |
| `triage.test.ts:141-142`, IDs/body above | FEED-02 | Yes |
| `triage.test.ts:152-153`, state above | FEED-03 | Yes |
| `triage.test.ts:157,160`, empty lists above | FEED-04/SCRN-01 | Yes |
| `triage.test.ts:171-173`, Imbox routing above | Dual-classification edge | Yes |
| `triage.test.ts:180-181`, receipt placement above | Approved P1/P2 scope clarification | Yes |

Adequacy A-D passed: exact routing, bodies, isolation, and listed edge asserted;
no shallow or unclaimed tests; AD-004/co-location followed. No existing tests changed.

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

- [x] `REPLY_LATER` adds to the pile with a count (REPLY-01, REPLY-02)
- [x] Focus mode yields one email at a time in order and advances (REPLY-03, REPLY-04)
- [x] Emptying the pile exits focus mode (REPLY-05)
- [x] Gate check passes: `npm test`
- [x] Unit tests map 1:1 to REPLY-01..05; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add reply-later pile and focus & reply flow`

**Execution evidence (T7)**: `npm test`: 26 passed (+7), 0 skipped/failed.
Design records newest-first queue, head cursor, seen completion, and explicit
exit behavior. These resolve the spec's unspecified pile order/completion
destination rather than claiming a more precise requirement existed.

| Criterion (A) | Assertion evidence (`src/domain/triage.test.ts`) | Outcome |
| --- | --- | --- |
| REPLY-01/02 | `:190-193` `expect(selectPile(repeated, 'replyLater')).toEqual([email('reply', { pile: 'replyLater' })])`; length `1`; new group `[]`; source pile `null` | One counted item, immutable |
| REPLY-03 | `:203-205` pile IDs equal `['new', 'old']`; `expect(selectFocusReply(next)).toEqual(state.emails.new)`; focus equals `{ active: true, cursor: 0 }` | Exactly one reply, ordered |
| REPLY-04 | `:212-216` finished emails equal `email(id, {seen:true})`; next focus equals old email; remaining IDs `['old']` | Completes and advances without skipping |
| REPLY-05 | `:217-228` pile `[]`; focus `{active:false,cursor:0}`; focused email `null`; empty NEXT equals original state | Last/initially empty exits |
| Explicit exit (T7 action) | `:235-238` focus inactive; focused email `null`; pile equals original reply; inactive NEXT unchanged | Exit preserves work |
| Screening isolation | `:244-246` `expect(next).toEqual(state)`; pile `[]`; focus `null` | Pending/rejected cannot bypass screening |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `triage.test.ts:190-193`, pile payload above | REPLY-01/02 | Yes |
| `triage.test.ts:203-205`, focus payload above | REPLY-03 | Yes |
| `triage.test.ts:212-220`, progression above | REPLY-04/05 and documented completion semantics | Yes |
| `triage.test.ts:226-228`, empty flow above | REPLY-05 | Yes |
| `triage.test.ts:235-238`, exit state above | T7 FOCUS_REPLY_EXIT | Yes |
| `triage.test.ts:244-246`, blocked state above | SCRN-01/03 across new pile path | Yes |

Adequacy A-D passed: non-shallow state and count assertions, every core flow
and relevant isolation branch covered, all tests necessary; AD-004 followed.
Counts/docked UI remain T14/T17.

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

- [x] Set-aside adds to pile with count and leaves New-for-you (ASIDE-01, ASIDE-02, ASIDE-04)
- [x] Remove restores to originating box (ASIDE-03)
- [x] Conflicting pile assignment keeps only the most recent pile (spec edge case)
- [x] Gate check passes: `npm test`
- [x] Unit tests map 1:1 to ASIDE-01..04 + conflict edge; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add set-aside pile and pile conflict rule`

**Execution evidence (T8)**: `npm test`: 37 passed (+11), 0 skipped/failed.
Origin and seen state survive both pile assignments and removal; moving/removing
the last reply also exits active Focus. Docked rendering remains T14/T18.

| Criterion (A) | Assertion evidence (`src/domain/triage.test.ts`) | Outcome |
| --- | --- | --- |
| ASIDE-01/02/04 | `:255-258` pile equals `[email('reference', {pile:'setAside'})]`; length `1`; new group `[]`; source email unchanged | Counted exclusively, seen flag preserved |
| ASIDE-03 | `:271-275` `expect(returned.emails.saved).toEqual(original)`; both piles `[]`; destination selector equals `[original]` | Both piles restore Imbox/Feed and original seen flag |
| Conflict edge | `:284-288` chosen pile equals complete expected Feed email with chosen pile; other pile and Feed `[]`; returned Feed equals original email | Latest wins in both directions, origin retained |
| REPLY-05 interaction | `:295-298` reply pile `[]`; focus `{active:false,cursor:0}`; focus email `null`; final pile exact | Removing/moving final reply exits |
| Screening isolation | `:304-305` `expect(next).toEqual(state)`; Set Aside `[]` | Pending/rejected remain excluded |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `triage.test.ts:255-258`, complete pile above | ASIDE-01/02/04 | Yes |
| `triage.test.ts:271-275`, destination above | ASIDE-03 and REMOVE_FROM_PILE action | Yes |
| `triage.test.ts:284-288`, both pile states above | Conflict edge | Yes |
| `triage.test.ts:295-298`, empty focus above | REPLY-05 | Yes |
| `triage.test.ts:304-305`, excluded state above | SCRN-01/03 on new path | Yes |

Adequacy A-D passed: all named fields/state transitions checked, both conflict
directions tested, no shallow/unclaimed tests; AD-004/co-location followed.

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

- [x] Unknown `schemaVersion` falls back to seed with a signalled notice flag (IMBOX-05)
- [x] Malformed/missing-field emails are skipped, not fatal (spec edge case)
- [x] `RESET_SEED` restores the seed
- [x] Gate check passes: `npm test`
- [x] Unit tests cover IMBOX-05 + malformed edge; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(triage): add schema-version guard and malformed-email handling`

**Execution evidence (T9)**: Required phase-boundary
`npm run build && npm run lint && npm test` passed. 97 tests, 3 files,
0 failed/skipped (+60 normalization cases). Repeated `npm test` also passed.
Core imports only models and the pure static seed factory, not React/DOM/storage.

| Criterion (A) | Assertion evidence (`src/domain/normalize.test.ts`) | Outcome |
| --- | --- | --- |
| IMBOX-05, unknown version | `:9-13` `expect(result.state).toEqual(buildSeedState())`; restored flag `true`; diagnostics exactly `[{code:'seed-restored',reason:'schema-version',message:'Restored sample mailbox'}]` | Fresh seed and explicit notice for six version variants |
| Invalid envelope fallback | `:22-25` `expect(normalizeState(input)).toEqual({state:buildSeedState(),restoredSeed:true,diagnostics:[{code:'seed-restored',reason:'invalid-state',message:'Restored sample mailbox'}]})` | Eight malformed envelopes handled |
| Preserve healthy/empty state | `:36-44` full result equals unchanged state with no diagnostics; `expect(state).toEqual(before)`; returned state/email not aliases; empty state stays empty | No unwanted resets or lost triage |
| Missing email fields | `:58-66` restored flag `false`; bad email undefined; order excludes ID; count `39`; healthy email exact; diagnostic includes code, emailId, message; input unchanged | Every required field covered separately |
| Malformed email values/records | `:81-97` bad record undefined; count `39`/order excludes ID; diagnostic equals identified malformed email warning | Invalid values and non-object records skipped |
| Malformed sender/orphaned mail | `:108-118` sender undefined; email count `36`; healthy email exact; malformed sender and each dependent email diagnostic checked | No invalid sender reaches routing |
| Order recovery | `:126-130` `expect(result.state.order).toEqual(state.order)`; emails unchanged; order repair diagnostic exact | No duplicate, dangling, lost, or unsorted IDs |
| Routing recovery | `:141-150` complete email assertions restore personal/receipt Imbox, pending Screener, rejected screenedOut; kind array preserved but cloned; routing diagnostic exact | Screening/classification/pile invariants maintained |
| Focus recovery | `:161-166` focus equals `{active,cursor:0}`; reply count `2`; current equals mail-38 or null; focus diagnostic exact | Invalid cursor/flags repaired without losing replies |
| Dropped final reply | `:175-180` pile `[]`; focus inactive, cursor `0`; current null; repair diagnostic exact | Malformed final replies cannot leave active empty Focus |
| RESET_SEED | `:187-193` `expect(reset).toEqual(buildSeedState())`; changed state remains piled; subsequent reset/fallback equal original after mutating first reset | Complete independent fresh reset |

| Assertions (C) | Requirement | Keep |
| --- | --- | --- |
| `normalize.test.ts:9-25`, exact fallback payloads above | IMBOX-05, T9 load guard | Yes |
| `normalize.test.ts:36-44`, exact retained states above | Persistence/empty-state assumptions; pure core | Yes |
| `normalize.test.ts:58-97`, skipped IDs and diagnostic payloads above | Malformed/missing-field edge | Yes |
| `normalize.test.ts:108-118`, sender/orphan payloads above | T9 valid load-guard references | Yes |
| `normalize.test.ts:126-150`, repaired state/diagnostics above | T9 normalization; SCRN/FEED/dual-classification invariants | Yes |
| `normalize.test.ts:161-180`, focus state/diagnostics above | T9 normalization; REPLY-03/05 | Yes |
| `normalize.test.ts:187-193`, complete reset state above | T9 RESET_SEED | Yes |

Adequacy A-D passed: required fields parameterized individually, complete
diagnostic payloads checked, no shallow/unclaimed tests, AD-004/co-location
followed. No tests weakened, removed, or skipped. Diagnostic messages and repair
semantics are documented adapter contracts; only the seed-restore notice text
was prescribed by the design. T10/T11 must surface diagnostics; T20 owns banners.
No feature completion claim or Verifier run: T10-T20 remain.

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

- [x] `load` returns persisted state or seed on miss/invalid/version-mismatch (IMBOX-05)
- [x] `save` persists; `reset` restores seed
- [x] `localStorage` throw is caught → in-memory fallback (spec edge case)
- [x] Gate check passes: `npm test`
- [x] Unit tests cover load/save/reset + failure path; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(data): add localStorage repository with schema guard and fallback`

**Execution evidence (T10)**: Tests written first; targeted RED confirmed missing
repository module. `npm test`: 109 passed, 4 files, 0 failed/skipped (+12).
Editor test discovery returned no tests; used the configured Vitest CLI.
The adapter preserves core diagnostics and synchronously publishes failed-save
notices; UI banners remain T20. No existing test changed.

| Criterion (A) | Assertion evidence (`src/data/repository.test.ts`) | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Missing key | `:17-20` `expect(state).toEqual(buildSeedState())`; `expect(repo.getNotices()).toEqual([])`; `expect(repo.load()).toEqual(buildSeedState())` | Fresh seed, no corruption notice or alias | Yes |
| Save/load, SCRN-04 | `:28-31` `expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(state)`; `expect(createRepository().load()).toEqual(state)`; `expect(createRepository().load().senders.noah.decision).toBe('approved')`; `expect(localStorage.length).toBe(1)` | Complete triage durably retained under one key | Yes |
| Valid empty mailbox | `:38-39` `expect(repo.load()).toEqual(empty)`; `expect(repo.getNotices()).toEqual([])` | Empty is not corruption | Yes |
| Invalid JSON/envelope/version, IMBOX-05 | `:51-55` `expect(repo.load()).toEqual(buildSeedState())`; `expect(repo.getNotices()).toEqual(notices)`; `expect(observed).toEqual([notices])`; `expect(console.warn).toHaveBeenCalledWith('Restored sample mailbox', notices[0])` | Seed, exact reason/code/message, observable warning | Yes |
| Malformed mail edge, diagnostic passthrough | `:65-73` `expect(loaded.emails['mail-01']).toBeUndefined()`; `expect(Object.keys(loaded.emails)).toHaveLength(39)`; `expect(loaded.emails['mail-02']).toEqual(state.emails['mail-02'])`; `expect(repo.getNotices()).toEqual(notices)`; `expect(vi.mocked(console.warn).mock.calls).toEqual(notices.map((notice) => [notice.message, notice]))` | Bad mail skipped, healthy preserved, full diagnostic payloads logged/exposed | Yes |
| Reset | `:81-86` `expect(reset).toEqual(buildSeedState())`; `expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(buildSeedState())`; `expect(createRepository().load()).toEqual(buildSeedState())`; `expect(localStorage.getItem('unrelated')).toBe('keep')`; `expect(repo.load()).toEqual(buildSeedState())` | Fresh independent seed in memory/storage, scoped key | Yes |
| Access/read failures | `:97-108` `expect(repo.load()).toEqual(buildSeedState())`; `expect(repo.getNotices()).toEqual([notice])`; `expect(console.warn).toHaveBeenCalledWith(notice.message, notice)`; `expect(repo.load()).toEqual(next)`; `expect(repo.reset()).toEqual(buildSeedState())` | Seed start, sticky no-persist warning, triage/reset work | Yes |
| Failed save | `:117,125-131` `expect(repo.getNotices()).toEqual([])` then `expect(repo.getNotices()).toEqual(notices)`; `expect(observed).toEqual([notices])`; `expect(repo.load()).toEqual(next)`; `expect(repo.load().emails['mail-31'].seen).toBe(true)`; `expect(stored.emails['mail-31'].seen).toBe(false)` | Newly observable failure; latest triage retained independently, stored data unchanged | Yes |
| Failed reset write | `:140-145` `expect(repo.load()).toEqual(changed)`; `expect(repo.reset()).toEqual(buildSeedState())`; `expect(repo.load()).toEqual(buildSeedState())`; `expect(repo.getNotices()).toEqual([{code:'storage-unavailable',operation:'reset',message:"Changes won't be saved this session"}])` | Seed in memory and exact no-persist notice | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:17-20` state/notice equality above | T10 load miss / fresh seed contract | Yes |
| `:28-31` persisted and reloaded payload above | T10 save/load, SCRN-04, AD-003 key scope | Yes |
| `:38-39` empty state/notice equality above | Valid empty mailbox assumption | Yes |
| `:51-55` seed/notice/observed/log assertions above | IMBOX-05, invalid-state load guard | Yes |
| `:65-73` skipped/healthy records and exact diagnostics above | Malformed email edge / T9 adapter contract | Yes |
| `:81-86` reset and storage equality above | T10 reset / AD-003 scoped persistence | Yes |
| `:97-108` seed/next/reset/notice assertions above | Storage unavailable edge | Yes |
| `:117,125-131` failed-save state/notice assertions above | Storage-full edge, no silent failed save | Yes |
| `:140-145` reset state/notice assertions above | T10 reset and storage-full edge | Yes |

Adequacy A-D passed: exact payload values, not invocation-only checks; every
test requirement-linked; AD-004/co-location followed. Notice shape and sticky
fallback semantics were unspecified implementation details, now documented in
design/README. Exact banner strings follow the design. No spec deviation.

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

- [x] Provider seeds from repository and persists on dispatch
- [x] Hooks expose state and dispatch; reset works
- [x] Gate check passes: `npm test`
- [x] Component tests cover persist-on-dispatch + reset; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(state): add app store context with persistence wiring`

**Execution evidence (T11)**: Tests written first; targeted RED confirmed missing
AppStore module. `npm test`: 116 passed, 5 files, 0 failed/skipped (+7).
Targeted ESLint on repository/store code and tests also passed with no warnings.
No previous tests changed. Tests render a consumer of all three hooks and
inspect both displayed state/notices and actual persisted JSON, not save spies.

| Criterion (A) | Assertion evidence (`src/state/AppStore.test.tsx`) | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Persisted initialization, hooks, each dispatch, reload | `:40-57` `expect(currentState()).toEqual(initial)`; `expect(currentNotices()).toEqual([])`; `expect(currentState().emails['mail-31'].seen).toBe(true)`; `expect(currentState().senders.noah.decision).toBe('approved')`; `expect(currentState().emails['mail-04'].box).toBe('imbox')`; `expect(currentState().emails['mail-02'].pile).toBe('setAside')`; `expect(storedState()).toEqual(currentState())`; `expect(currentState()).toEqual(beforeReload)` | Loaded state, real hook dispatch, every full state saved, SCRN-04 survives reload | Yes |
| Seed initialization and reset | `:62-71` `expect(currentState()).toEqual(buildSeedState())`; `expect(storedState()).toEqual(buildSeedState())`; `expect(currentState()).not.toEqual(buildSeedState())`; `expect(createRepository().load()).toEqual(buildSeedState())` | Seed initially and after reset; all fields durably restored | Yes |
| IMBOX-05 startup notice survives mount effect | `:77-81` `expect(currentState()).toEqual(buildSeedState())`; `expect(storedState()).toEqual(buildSeedState())`; `expect(currentNotices()).toEqual([{code:'seed-restored',reason:'schema-version',message:'Restored sample mailbox'}])` | Restored state and exact non-blocking notice available, even under StrictMode | Yes |
| Malformed mail warnings reach consumers | `:90-96` `expect(currentState().emails['mail-01']).toBeUndefined()`; `expect(currentState().emails['mail-02']).toEqual(state.emails['mail-02'])`; `expect(storedState()).toEqual(currentState())`; `expect(currentNotices()).toEqual([{code:'malformed-email',emailId:'mail-01',message:'Skipped malformed email "mail-01"'},{code:'state-repaired',field:'order',message:'Repaired mailbox receive order'}])` | Bad record skipped, healthy retained, full diagnostics surfaced | Yes |
| Later failed-save notice and memory reset | `:109-122` `expect(currentNotices()).toEqual([])` then `expect(currentNotices()).toEqual(notices)`; `expect(currentState().emails['mail-31'].seen).toBe(true)`; `expect(repo.load()).toEqual(currentState())`; `expect(storedState().emails['mail-31'].seen).toBe(false)`; `expect(currentState()).toEqual(buildSeedState())`; `expect(repo.load()).toEqual(buildSeedState())` | Observable save-failure code/operation/message, no lost triage, reset still works | Yes |
| Unavailable storage at startup | `:128-137` `expect(currentState()).toEqual(buildSeedState())`; `expect(currentNotices()).toEqual([{code:'storage-unavailable',operation:'load',message:"Changes won't be saved this session"}])`; `expect(currentState().emails['mail-02'].pile).toBe('setAside')`; `expect(repo.load()).toEqual(currentState())`; `expect(repo.load()).toEqual(buildSeedState())` | Seed, warning, functioning in-memory dispatch/reset | Yes |
| Default browser adapter | `:142-145` `expect(currentState()).toEqual(buildSeedState())`; `expect(storedState().emails['mail-31'].seen).toBe(true)`; `expect(currentState()).toEqual(storedState())` | Provider works without test injection | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:40-57` exact state/notice/field/storage assertions above | T11 init/hooks/persist, SCRN-04 wiring | Yes |
| `:62-71` seed/change/reset/storage assertions above | T11 initialization/reset | Yes |
| `:77-81` seed and exact notice payload above | IMBOX-05 through React/store | Yes |
| `:90-96` skipped/healthy/persisted/diagnostic assertions above | Malformed mail edge, diagnostic delivery through hooks | Yes |
| `:109-122` seen/memory/storage/notice/reset assertions above | Storage-full edge through persistence effect | Yes |
| `:128-137` seed/notice/pile/memory/reset assertions above | Storage unavailable edge through provider | Yes |
| `:142-145` seed/persisted/current state assertions above | T11 default repository wiring | Yes |

Adequacy A-D passed: every task outcome and relevant error path has complete
state/notice assertions; all tests required by adapter wiring; no mock-only or
unclaimed tests. AD-004/RTL co-location followed. No spec deviation; hook notice
interface and reset effect path documented in design/README. Banner is T20.

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

- [x] Scripts/event handlers stripped; safe markup preserved (spec edge case)
- [x] Gate check passes: `npm test`
- [x] Unit tests cover an XSS payload + safe markup; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(lib): add html sanitizer for email bodies`

**Execution evidence (T12)**: Tests written first; targeted RED confirmed missing
sanitizer module. Added declared DOMPurify 3.4.17 dependency, then installed it.
Mandatory phase-boundary `npm run build && npm run lint && npm test` passed:
123 tests, 6 files, 0 failed/skipped (+7). ESLint and TypeScript clean.
Prior 116 tests preserved without modification. DOMPurify's official README
confirmed the default import, HTML-only profile, and no-post-sanitize-mutation
contract. No UI render seam implemented in this batch.

| Criterion (A) | Assertion evidence (`src/lib/sanitize.test.ts`) | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Scripts/event handlers and embedded unsafe content | `:9-11` `expect(sanitizeHtml(raw)).toBe('<p>Hello <strong>reader</strong></p><img src="https://images.example/photo.png">')` | Script/onclick/onerror/iframe removed, readable message and image retained | Yes |
| Unsafe URL variants | `:19-20` `expect(sanitizeHtml(\`<p>Read <a href="${url}">the story</a></p>\`)).toBe('<p>Read <a>the story</a></p>')` | Literal/encoded javascript and executable data URL removed, label preserved | Yes |
| Active non-HTML content | `:24-25` `expect(sanitizeHtml('<svg onload="alert(1)"><circle /></svg><p>Message</p>')).toBe('<p>Message</p>')` | Unsafe non-HTML content removed from body | Yes |
| Safe markup and P1 remote images | `:33` `expect(sanitizeHtml(safe)).toBe(safe)` (exact fixture at `:29-32`) | Heading, paragraphs, emphasis, list, HTTPS link, table, image/alt retained | Yes |
| Plain/empty bodies | `:37-38` `expect(sanitizeHtml('Hello there.\nSee you tomorrow.')).toBe('Hello there.\nSee you tomorrow.')`; `expect(sanitizeHtml('')).toBe('')` | Readable plain text and valid empty body preserved | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:9-11` exact safe output above | T12 script/handler removal, unsafe HTML edge | Yes |
| `:19-20` exact link output above, three cases | Unsafe HTML edge | Yes |
| `:24-25` exact safe paragraph above | Unsafe HTML edge, HTML render seam | Yes |
| `:33` full safe fixture equality above | T12 safe markup, body/remote image assumption | Yes |
| `:37-38` plain/empty equality above | Plain-text body assumption and valid empty bodies | Yes |

Adequacy A-D passed: exact rendered payload assertions, every test mapped to
body-safety/preservation requirements, no shallow or speculative tests;
AD-004/co-location followed. HTML-only profile is a documented implementation
choice, not a new feature. No spec deviation. T13-T20 and the final independent
Verifier remain the orchestrator's next batch; no final validation claimed.

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

- [x] All five routes render their placeholder view within the shell
- [x] Shell mounts the AppStore provider
- [x] Gate check passes: `npm test`
- [x] Component test covers route navigation; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(app): add shell layout and client routing`

**Execution evidence (T13)**: RED (missing shell), then `npm test`: 125 passed,
7 files, zero skipped/failed. Router dependency declared before installation.
Responsive CSS Modules shell mounts one provider; wildcard routes redirect.

| Criterion (A) | Exact assertion evidence | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Five routes and navigation | `src/app/AppShell.test.tsx:18` `expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible()`; `:19` `expect(within(nav).getByRole('link', { name: new RegExp(title) })).toHaveAttribute('aria-current', 'page')` | All five named route views, active navigation | Yes |
| Provider and fallback route | `src/app/AppShell.test.tsx:28-30` `expect(screen.getByRole('heading', { level: 1, name: 'The Imbox' })).toBeVisible()`; `expect(screen.getByRole('link', { name: 'The Imbox 0' })).toHaveAttribute('aria-current', 'page')`; `expect(screen.getByRole('main')).toBeVisible()` | Empty stored mailbox drives count in shell; fallback Imbox | Yes |

| Assertions (C) | Maps to | Keep |
| --- | --- | --- |
| `AppShell.test.tsx:18-19` heading visibility and active route above | T13 five routes | Yes |
| `AppShell.test.tsx:28-30` heading, zero count, main above | T13 provider/routing, empty-state assumption | Yes |

Adequacy A-D passed: real route/state output, all tests necessary, AD-004 and
co-location followed. No existing tests changed. Views are temporary only until
their assigned tasks; no completed UI story claimed yet.

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

- [x] `EmailRow` shows sender, subject, snippet, time, seen/unseen state
- [x] `EmptyState` renders message + placeholder; `PileDock` shows pile counts
- [x] Gate check passes: `npm test`
- [x] Component tests cover each component's rendering; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ui): add shared email row, empty state, and pile dock`

**Execution evidence (T14)**: RED missing components; quick gate 130 passed,
8 files, zero skipped/failed. Shared reader/body/actions added here so every view
uses one sanitizer seam. Shell dock wired now; no dead pile links at final delivery.

| Criterion (A) | Exact assertion (`src/features/common/common.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| Row fields | `:23-26` `expect(within(row).getByText('Maya Chen')).toBeVisible()`; subject/preview equivalents; `expect(row.querySelector('time')).toHaveAttribute('dateTime', email.receivedAt)` | Sender, subject, preview and original timestamp | Yes |
| IMBOX-03 | `:27` `expect(within(row).getByLabelText('Unseen')).toBeVisible()`; `:34-35` `expect(screen.queryByLabelText('Unseen')).not.toBeInTheDocument()`; `expect(screen.getByLabelText('Seen')).toBeInTheDocument()` | Explicit distinct seen state | Yes |
| Pile counts/actions, conflict | `:37` `expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toHaveAttribute('href', '/reply-later')`; `:39-40` `expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()`; `expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toHaveAttribute('href', '/set-aside')` | Count changes, latest pile only, navigable tiles | Yes |
| Empty state | `:45-47` `expect(screen.getByRole('heading', { name: 'Nothing new' })).toBeVisible()`; `expect(screen.getByText('Enjoy a little breathing room.')).toBeVisible()`; `expect(screen.getByTestId('empty-illustration')).toHaveAttribute('aria-hidden', 'true')` | Message + decorative illustration | Yes |
| Empty piles | `:52-53` `expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()` and Set Aside equivalent | Both zero counts | Yes |
| Safe reader | `:60-62` `expect(body.innerHTML).toBe('<p>Safe <strong>story</strong></p>')`; `expect(screen.getByText('maya@example.com')).toBeVisible()`; `expect(screen.getByRole('heading', { name: 'Subject unsafe' })).toBeVisible()` | Safe HTML, metadata, no executable content | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:23-27,34-35` row field/time/indicator assertions above | T14 rendering, IMBOX-03 | Yes |
| `:37,39-40,52-53` exact pile links/counts above | REPLY-01/02, ASIDE-01/02, conflict edge | Yes |
| `:45-47` title/message/illustration above | Empty-state assumption | Yes |
| `:60-62` sanitized HTML/metadata above | Body rendering assumption, unsafe HTML edge | Yes |

Adequacy A-D passed: actual count/state effects, no mock-only assertions,
all tests necessary, AD-004/co-location followed. No previous tests changed.

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

- [x] Renders both groups; opening a new email moves it to seen (IMBOX-01..03)
- [x] Empty New-for-you shows a dedicated empty state (IMBOX-04)
- [x] Gate check passes: `npm test`
- [x] Component tests cover IMBOX-01..04; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(imbox): add imbox view with new/seen groups`

**Execution evidence (T15)**: Three RED view tests, then quick gate 133 passed,
9 files, zero failed/skipped. Imbox route is real; reading uses the safe seam.

| Criterion (A) | Exact assertion (`src/features/imbox/ImboxView.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| IMBOX-01/03 | `:17-20` `expect(fresh.compareDocumentPosition(seen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()`; `expect(within(fresh).getByRole('article', { name: 'Subject fresh' })).toBeVisible()`; `expect(within(fresh).getByLabelText('Unseen')).toBeVisible()`; seen row equivalent | New above Seen, correct membership and indicator | Yes |
| Pile/screener isolation | `:21-22` `expect(screen.queryByRole('article', { name: 'Subject aside' })).not.toBeInTheDocument()` and pending equivalent | Neither leaks into Imbox | Yes |
| IMBOX-02 | `:24-29` `expect(screen.getByTestId('email-body')).toHaveTextContent('Message fresh')`; `expect(storedState().emails.fresh.seen).toBe(true)`; `expect(within(screen.getByRole('region', { name: 'New for you' })).queryByRole('article')).not.toBeInTheDocument()`; `expect(within(screen.getByRole('region', { name: 'Previously seen' })).getByRole('article', { name: 'Subject fresh' })).toBeVisible()`; `expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()` | Body opens, persisted seen, correct destination/count | Yes |
| IMBOX-04, seen retained | `:34-35` `expect(within(screen.getByRole('region', { name: 'New for you' })).getByRole('heading', { name: "You're all caught up" })).toBeVisible()`; `expect(within(screen.getByRole('region', { name: 'Previously seen' })).getByText('Subject read')).toBeVisible()` | Dedicated new-empty state without losing seen mail | Yes |
| Completely empty | `:39-41` `expect(screen.getByRole('heading', { name: "You're all caught up" })).toBeVisible()`; `expect(screen.getByRole('heading', { name: 'A fresh start' })).toBeVisible()`; `expect(screen.queryByRole('article')).not.toBeInTheDocument()` | Both friendly empty sections | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:17-20` ordering/membership/indicator above | IMBOX-01/03 | Yes |
| `:21-22` absent rows above | ASIDE-04, SCRN-01 | Yes |
| `:24-29` body/seen/membership/count above | IMBOX-02 and persistence assumption | Yes |
| `:34-35,39-41` empty states and retained seen row above | IMBOX-04 / empty-state assumption | Yes |

Adequacy A-D passed: visible behavior and persisted value checked, no shallow or
unclaimed tests, AD-004 followed. Empty-state copy is a UI choice (spec requires
dedicated states, not exact wording). No prior tests changed.

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

- [x] Approve/reject dispatch the correct actions and update boxes (SCRN-02, SCRN-03)
- [x] Empty screener shows a dedicated empty state (SCRN-05)
- [x] Gate check passes: `npm test`
- [x] Component tests cover approve/reject + empty state; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(screener): add screener view with yes/no decisions`

**Execution evidence (T16)**: Four RED cases, then quick gate 137 passed,
10 files, zero skipped/failed. Safe expandable previews and visible decision
feedback accompany Yes/No controls.

| Criterion (A) | Exact assertion (`src/features/screener/ScreenerView.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| SCRN-01 sender/preview | `:15` `expect(within(card).getByText(state.senders[senderId].address)).toBeVisible()`; `:17` `expect(within(card).getByTestId('email-body')).toHaveTextContent('Message second')` | Pending sender and most recent message preview | Yes |
| SCRN-02/04 both routing classes | `:19-23` `expect(screen.queryByRole('article', { name })).not.toBeInTheDocument()`; empty heading visible; `expect(screen.getByRole('link', { name: navLabel })).toBeVisible()`; `expect(app.storedState().senders[senderId].decision).toBe('approved')`; `expect(app.storedState().emails[id].box).toBe(destination)` | Both current messages routed to Imbox/Feed, decision persisted | Yes |
| Remount remembers | `:27-28` `expect(screen.queryByRole('article', { name })).not.toBeInTheDocument()`; `expect(screen.getByRole('link', { name: navLabel })).toBeVisible()` | Sender not screened twice | Yes |
| SCRN-03 | `:39-46` `expect(screen.queryByRole('article', { name: 'Noah de Vries' })).not.toBeInTheDocument()`; unrelated card visible; Imbox/Feed zero links visible; `expect(app.storedState().senders.noah.decision).toBe('rejected')`; `expect(app.storedState().emails.first.box).toBe('screenedOut')`; second equivalent; `expect(app.storedState().senders.club.decision).toBe('pending')` | Rejected sender fully suppressed; unrelated sender preserved | Yes |
| SCRN-05 | `:51-53` `expect(screen.getByRole('heading', { name: "You're in good company" })).toBeVisible()`; `expect(screen.getByText('No new senders to screen. You decide who gets your attention.')).toBeVisible()`; `expect(screen.queryByRole('button', { name: /Yes, let them in/ })).not.toBeInTheDocument()` | Dedicated empty state, no stale controls | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:15,17` sender and body above | T16 pending senders / reader assumption | Yes |
| `:19-23,27-28` removal/count/stored decisions/destinations above | SCRN-02/04 | Yes |
| `:39-46` rejection payloads and unrelated pending sender above | SCRN-03 and sender-scoped decisions | Yes |
| `:51-53` heading/message/no decisions above | SCRN-05 | Yes |

Adequacy A-D passed: actual persisted decision/box values and UI counts, both
destination classes and empty path; no mock-only tests; AD-004 followed.
Future arrivals remain proven by `triage.test.ts:62-66,77-81` (T5 evidence),
not simulated by inventing a receive UI. No previous tests changed.

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

- [x] Pile shows count; Focus mode steps one-by-one and exits when empty (REPLY-01..05)
- [x] Gate check passes: `npm test`
- [x] Component tests cover pile + focus stepping + exit; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(reply-later): add reply-later pile and focus & reply ui`

**Execution evidence (T17)**: Three RED cases, then quick gate 140 passed,
11 files, zero skipped/failed. Focus is explicitly local handling, never sending.

| Criterion (A) | Exact assertion (`src/features/reply-later/ReplyLater.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| REPLY-01/02 docking | `:15` `expect(screen.queryByRole('article', { name: 'Subject newer' })).not.toBeInTheDocument()`; `:17` `expect(screen.getAllByRole('article').map((row) => row.getAttribute('aria-label'))).toEqual(['Subject newer', 'Subject older'])`; `:26` `expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()` | Removed from Imbox, dock opens ordered pile, live count | Yes |
| REPLY-03 | `:19-23` `expect(screen.getAllByTestId('email-body')).toHaveLength(1)`; `expect(screen.getByTestId('email-body')).toHaveTextContent('Message newer')`; older/unrelated text absent; `expect(screen.getByText('Nothing is sent. Finishing marks this email handled.')).toBeVisible()` | One newest reply only; honest demo semantics | Yes |
| REPLY-04 | `:25,27` `expect(screen.getByTestId('email-body')).toHaveTextContent('Message older')`; `expect(app.storedState().emails.newer).toEqual(message('newer', { receivedAt: '2026-10-11T09:00:00.000Z', seen: true }))` | Advances, complete correct persisted payload | Yes |
| REPLY-05 | `:29-33` empty heading visible; finish absent; zero dock visible; `expect(app.storedState().focusReply).toEqual({ active: false, cursor: 0 })`; `expect(app.storedState().emails.older).toEqual(message('older', { seen: true }))` | Last completion exits, no skipped reply | Yes |
| Open and explicit exit | `:40,44-47` body text Message waiting; visible waiting article and 1-count dock; focus inactive/cursor zero; `expect(app.storedState().emails.waiting.pile).toBe('replyLater')` | Reading works; exit preserves unfinished pile | Yes |
| Initially empty | `:52-54` empty heading visible; `expect(screen.queryByRole('button', { name: 'Focus & Reply' })).not.toBeInTheDocument()`; zero dock visible | No invalid empty Focus start | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:15,17,26` membership/order/count above | REPLY-01/02 | Yes |
| `:19-23` one body/excluded others/demo disclosure above | REPLY-03, no-send scope | Yes |
| `:25,27,29-33` progression/completed payloads/empty state above | REPLY-04/05 | Yes |
| `:40,44-47` body and retained pile/focus state above | T17 reading and explicit exit contract | Yes |
| `:52-54` empty UI and zero count above | REPLY-05 | Yes |

Adequacy A-D passed: full completed email values and focus fields, real
cross-route interaction, all cases spec-linked; AD-004 followed. No prior tests
changed or new deviations. Shared styling includes return-bar support for T18.

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

- [x] Pile shows count; items can be returned to their box (ASIDE-01..03)
- [x] Gate check passes: `npm test`
- [x] Component tests cover add/return + count; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(set-aside): add set-aside pile ui`

**Execution evidence (T18)**: Four RED cases, then quick gate 144 passed,
12 files, zero skipped/failed. Return control works from pile list and shared
reader (including Reply Later); no storage access or triage logic in views.

| Criterion (A) | Exact assertion (`src/features/set-aside/SetAside.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| ASIDE-01/02/04 | `:11-14` `expect(screen.queryByRole('article', { name: 'Subject reference' })).not.toBeInTheDocument()`; caught-up heading visible; after 1-count tile click, `expect(screen.getByRole('article', { name: 'Subject reference' })).toBeVisible()` | Removed from New, counted dock opens reference | Yes |
| ASIDE-03 Imbox | `:16-20` empty heading and zero dock visible; after Imbox link, `expect(within(screen.getByRole('region', { name: 'New for you' })).getByText('Subject reference')).toBeVisible()`; `expect(app.storedState().emails.reference).toEqual(message('reference'))` | Original Imbox and unseen state restored | Yes |
| ASIDE-03 Feed, opened return | `:28-33` `expect(screen.getByTestId('email-body')).toHaveTextContent('Message newsletter')`; empty pile, Feed 1 and Imbox 0 links visible; `expect(app.storedState().emails.newsletter).toEqual({ ...original, pile: null, seen: true })` | Reading marks seen, return preserves origin and all fields | Yes |
| Latest pile wins | `:40-43` zero Set Aside link visible; `expect(screen.getByRole('article', { name: 'Subject reference' })).toBeVisible()` in Reply Later; `expect(app.storedState().emails.reference.pile).toBe('replyLater')` | Single-pile assignment | Yes |
| Empty route | `:48-50` empty heading visible; `expect(screen.getByText('Tickets, plans, and things worth keeping close. Set them aside here.')).toBeVisible()`; `expect(screen.queryByRole('button', { name: /Return to/ })).not.toBeInTheDocument()` | Dedicated empty state, no stale return controls | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:11-14` absent/new and visible pile row above | ASIDE-01/02/04 | Yes |
| `:16-20` zero count, restored row and full payload above | ASIDE-03, seen preservation | Yes |
| `:28-33` body/destination counts/full payload above | ASIDE-03, safe reading | Yes |
| `:40-43` zero old pile/new pile and assignment above | Conflicting-pile edge | Yes |
| `:48-50` empty message/no controls above | Empty-state assumption | Yes |

Adequacy A-D passed: complete restored email assertions for both origins,
real cross-route user flow, every test necessary; AD-004 followed. No prior
tests changed. Feed content rendering is T19; its destination count/state is
already asserted here.

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

- [x] Items render expanded, newest first (FEED-02); empty feed shows empty state (FEED-04)
- [x] Gate check passes: `npm test`
- [x] Component tests cover ordering + empty state; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(feed): add feed view`

**Execution evidence (T19)**: Four RED cases, then quick gate 148 passed,
13 files, zero skipped/failed. All five routes now have real views. Feed is one
vertical flex column in the document scroll flow; safe body seam shared.

| Criterion (A) | Exact assertion (`src/features/feed/FeedView.test.tsx`) | Outcome | Covered |
| --- | --- | --- | --- |
| FEED-02 and unsafe HTML | `:17` `expect(within(feed).getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual(['Subject new', 'Subject old'])`; `:18` `expect(within(feed).getAllByTestId('email-body').map((body) => body.innerHTML)).toEqual(['<h2>Fresh edition</h2><p>Full story</p>', '<p>Message old</p>'])` | Both expanded, newest first, exact sanitized markup | Yes |
| FEED-03 | `:19-23` personal text absent; `expect(screen.getByRole('link', { name: 'The Imbox 1' })).toBeVisible()` before/after scroll; `expect(app.storedState()).toEqual(state)` | Scroll cannot clear Imbox or alter any state | Yes |
| FEED-04/SCRN-01 | `:28-30` quiet heading visible; `expect(screen.getByText('Your favorite newsletters will unfold here. No rush to catch up.')).toBeVisible()`; `expect(screen.queryByRole('article')).not.toBeInTheDocument()` | Pending excluded, dedicated empty Feed | Yes |
| FEED-01 | `:38-39` `expect(screen.getByTestId('email-body')).toHaveTextContent('Message club')`; `expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()` | Approved newsletter immediately available only in Feed | Yes |
| Feed pile round-trip | `:46,50-52` quiet heading visible; restored body text Message reference; `expect(app.storedState().emails.reference).toEqual(newsletter('reference'))`; zero Set Aside link visible | Expanded Feed action/return retains full record | Yes |

| Assertions (C, same file) | Maps to | Keep |
| --- | --- | --- |
| `:17-18` order and complete HTML above | FEED-02, unsafe HTML edge | Yes |
| `:19-23` exclusion/counts/unchanged complete state above | FEED-03 | Yes |
| `:28-30` empty message and absent cards above | FEED-04/SCRN-01 | Yes |
| `:38-39` approved body and zero Imbox above | FEED-01/SCRN-02 | Yes |
| `:46,50-52` empty/restored body/full payload/count above | ASIDE-01..03 with Feed origin | Yes |

Adequacy A-D passed: complete HTML/state values, actual scroll and routing,
all tests necessary; AD-004 followed. Single-column layout inspected in
`FeedView.module.css:1`; actual responsive browser check is T20.
No previous tests changed, no new spec deviations.

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

- [x] Shortcuts move selection and trigger triage actions
- [x] Transitions respect `prefers-reduced-motion`; banner shows seed-restore / no-persist notices
- [x] Gate check passes: `npm test`
- [x] Component tests cover shortcut dispatch + banner; test count recorded (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(ui): add keyboard shortcuts, reduced-motion, and notice banner`

**Execution evidence (T20)**: Test-first run: 12 failed / 1 passed (the
editable-field no-op already held before shortcuts existed). Targeted 13 tests
then passed. Mandatory final `npm run build && npm run lint && npm test` passed:
161 tests, 15 files, zero failed/skipped. Baseline 123 tests preserved; batch
adds 38. TypeScript/ESLint/editor diagnostics clean. README now documents all
routes, local-only completion, persistence/reset, keyboard rules, and deployment
fallback. No new dependencies beyond T13's approved router.

| Criterion (A) | Exact assertion evidence | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| j/k selection, boundaries | `src/features/common/useShortcuts.test.tsx:13,15,17,19` `expect(screen.getByRole('article', { name: 'Subject newer' })).toHaveAttribute('data-selected', 'true')` and older equivalent | Correct first/next/previous selection, no out-of-range action | Yes |
| r/e actions | `useShortcuts.test.tsx:21-26` `expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()`; `expect(app.storedState().emails.newer.pile).toBe('replyLater')`; `expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toBeVisible()`; `expect(app.storedState().emails.older.pile).toBe('setAside')`; `expect(screen.getByRole('heading', { name: "You're all caught up" })).toBeVisible()` | Exact selected messages move to counted piles | Yes |
| Opened message action | `useShortcuts.test.tsx:34-36` `expect(screen.queryByTestId('email-body')).not.toBeInTheDocument()`; counted Set Aside link visible; `expect(app.storedState().emails.read).toEqual(message('read', { seen: true, pile: 'setAside' }))` | Only opened message targeted, returns to list | Yes |
| y/n screening | `useShortcuts.test.tsx:46-53` `expect(screen.getByRole('link', { name: 'The Feed 1' })).toBeVisible()`; `expect(app.storedState().senders.club.decision).toBe('approved')`; `expect(app.storedState().emails.newsletter.box).toBe('feed')`; empty Screener heading visible; `expect(app.storedState().senders.noah.decision).toBe('rejected')`; `expect(app.storedState().emails.personal.box).toBe('screenedOut')`; `expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()` | Both exact sender decisions and destinations | Yes |
| Every mail route | `useShortcuts.test.tsx:63-64` `expect(app.storedState().emails.target.pile).toBe(route === '/set-aside' ? 'replyLater' : 'setAside')`; `expect(within(screen.getByRole('main')).queryByRole('article')).not.toBeInTheDocument()` | Feed and both piles respond; source loses moved email | Yes |
| Editable/modifier/composition guards | `useShortcuts.test.tsx:79-81` `expect(app.storedState()).toEqual(state)`; `expect(screen.getByRole('article', { name: 'Subject safe' })).toHaveAttribute('data-selected', 'false')`; `expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()` | No mutation or selection for input/textarea/select/nested editable, Ctrl/Meta/Alt/Shift/composition | Yes |
| Empty paths and guide | `useShortcuts.test.tsx:88,90-91` `expect(app.storedState()).toEqual(mailbox())`; `expect(screen.getByText('Next / previous message')).toBeVisible()`; `expect(screen.getByText('Approve / reject sender')).toBeVisible()` | Empty views safe, guide accessible | Yes |
| Focus pile conflict / final exit | `useShortcuts.test.tsx:102,104-106` `expect(screen.getByTestId('email-body')).toHaveTextContent('Message old')`; `expect(screen.getByRole('heading', { name: 'Nothing waiting on you' })).toBeVisible()`; `expect(app.storedState().focusReply).toEqual({ active: false, cursor: 0 })`; `expect(screen.getByRole('link', { name: 'Set Aside, 2 emails' })).toBeVisible()` | No skipped remaining item; no active empty Focus | Yes |
| IMBOX-05 nonblocking notice | `src/features/common/NoticeBanner.test.tsx:18,21-22` `expect(within(screen.getByRole('status', { name: 'Mailbox notices' })).getByText('Restored sample mailbox')).toBeVisible()`; `expect(screen.getByRole('link', { name: 'Set Aside, 2 emails' })).toBeVisible()`; notice still visible | Exact prescribed text, triage remains usable | Yes |
| Live storage failure/reset | `NoticeBanner.test.tsx:34,37-43` no initial notice; `expect(screen.getByRole('status', { name: 'Mailbox notices' })).toHaveTextContent("Changes won't be saved this session")`; reply-count link visible; `expect(repository.load().emails.keep.pile).toBe('replyLater')`; `expect(repository.load()).toEqual(buildSeedState())`; seed reply count 2 visible; exact warning remains | Failure observed after dispatch, latest memory state retained, reset works | Yes |
| Malformed mail warning | `NoticeBanner.test.tsx:52-54` `expect(screen.getByRole('status', { name: 'Mailbox notices' })).toHaveTextContent('Skipped malformed email "bad"')`; `expect(screen.getByRole('article', { name: 'Subject good' })).toBeVisible()`; `expect(screen.queryByRole('article', { name: 'Subject bad' })).not.toBeInTheDocument()` | Bad skipped, warning visible, healthy usable | Yes |
| Visible durable reset | `NoticeBanner.test.tsx:61-63` `expect(app.storedState()).toEqual(buildSeedState())`; `expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toBeVisible()`; `expect(screen.getAllByRole('article')).toHaveLength(1)` | All seed fields restored and current route updated | Yes |
| Reduced motion | `src/index.css:27-34` motion only inside `@media (prefers-reduced-motion: no-preference)`; browser computed `getComputedStyle(el).animationName` = `none` and duration `0s` under reduce, versus `arrive` / `0.18s` normally | No slide/fade animation for reduced-motion users | Yes (real browser) |

| Assertions (C) | Maps to | Keep |
| --- | --- | --- |
| `useShortcuts.test.tsx:13,15,17,19` selected attributes above | Keyboard selection assumption/T20 | Yes |
| `:21-26,34-36,63-64` exact pile/destination/reader state above | Keyboard actions, REPLY-01, ASIDE-01/04, conflict edge | Yes |
| `:46-53` exact decisions/destinations above | Keyboard y/n, SCRN-02/03/05 | Yes |
| `:79-81` unchanged full state/selection/count above | User's editable-field guard, T20 keyboard safety | Yes |
| `:88,90-91` empty state and guide text above | Empty-view keyboard behavior and discoverability | Yes |
| `:102,104-106` remaining body/empty/focus/count above | REPLY-03/05, conflict edge under shortcuts | Yes |
| `NoticeBanner.test.tsx:18,21-22` notice and successful count change above | IMBOX-05 nonblocking notice | Yes |
| `:34,37-43` notice/memory/reset values above | Storage-full edge, reset assumption | Yes |
| `:52-54` warning/healthy/bad rows above | Malformed mail edge | Yes |
| `:61-63` full seed/count/rows above | Reset-to-seed affordance | Yes |
| Browser computed motion values at `index.css:27-34` | Reduced-motion assumption | Yes |

Adequacy A-D passed: full state payloads, sender decisions and destination
values, real user-visible counts and error text; no mock-only/shallow tests,
all tests requirement-linked. AD-004/co-location followed. Selection defaults
and guide wording are documented UI choices where the spec leaves detail open.
All original tests remain unmodified and unskipped.

**Real browser UI validation**: desktop screenshot inspected; mobile screenshot
inspected at 390×844. All five routes checked at 390px and 1440px with
`document.documentElement.scrollWidth <= innerWidth`; both dock tiles stayed
inside mobile viewport. Exercised open→Seen, all three seeded/new Focus replies
to empty, approve newsletter/reject personal, 12 expanded Feed cards, scroll
without Imbox count change (6→6), Feed→Set Aside→Feed, keyboard j/r, reload
persistence, unknown-schema banner and reset. No page errors in captured
open/Focus flow; expected schema warning logged during fault check. One browser
probe sampled a route during React's transition; rerunning with the destination
heading awaited passed. Reduced motion checked with browser media emulation.
Helper server stopped; demo storage restored. No deploy/push.

**Delivery status**: T1-T20 implemented and committed locally. Independent
Verifier is pending with the orchestrator; no feature-level PASS is claimed.

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

---

## Approved repair round 1 (F1/F2/F3)

The user approved these bounded repairs and explicitly confirmed most recent
first for Focus & Reply. Original tasks and tests remain intact. Each repair
has its own local atomic commit; independent re-verification belongs to the
orchestrator after this round, not this worker.

### Phase 5: Independent verifier repairs

```text
T15 → T21
T20 → T21
T9 → T22
T10 → T22
T11 → T22
T20 → T22
T17 → T23
```

### T21: Remove reset-ineligible Imbox reader (F1)

**What**: Resolve the open reader against current Imbox eligibility, not all
stored mail. Preserve normal open-to-seen reading.
**Where**: `src/features/imbox/ImboxView.tsx`
**Depends on**: T15, T20
**Reuses**: `selectImbox`, real-shell `renderMailbox`, bundled seed
**Files**: ImboxView.tsx, new ImboxReset.test.tsx, tasks.md, spec.md

**Done when**:

- [x] Approve pending Noah, open his mail, then Reset demo restores the complete persisted seed.
- [x] The now-ineligible reader/body and Imbox row disappear; Noah is pending again in Screener (SCRN-01/reset assumption).
- [x] Ordinary opening still marks seen and retains the reader (IMBOX-02).

**Tests**: unit (real-shell RTL regression, persisted state and visible outcomes)
**Gate**: full; targeted `npm test -- src/features/imbox src/features/common/NoticeBanner.test.tsx`, then `npm run build && npm run lint && npm test`
**Commit**: `fix(imbox): hide readers excluded by reset screening`

**Execution evidence (T21)**: RED at `ImboxReset.test.tsx:21` reproduced the
stale reader after the persisted seed assertions passed. Corrected the new
test's reset-button query to its existing accessible name before that RED run.
Selector eligibility now controls both list and reader. Targeted gate: 8 passed.
Build + lint + all tests: 162 passed, 16 files, zero failed/skipped; original
161 unchanged. Editor diagnostics clean.

| Criterion (A) | Exact assertion evidence | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Approve/open precondition | `src/features/imbox/ImboxReset.test.tsx:14-15`: `expect(screen.getByRole('region', { name: 'Reading Community garden introduction' })).toBeVisible()`; `expect(app.storedState().senders.noah.decision).toBe('approved')` | Real shell permits approved mail | Yes |
| Reset complete stored seed | `ImboxReset.test.tsx:18-20`: `expect(app.storedState()).toEqual(seed)`; `expect(app.storedState().senders.noah.decision).toBe('pending')`; `expect(app.storedState().emails['mail-04'].box).toBe('screener')` | All seed fields restored; sender no longer eligible | Yes |
| No stale reader/body/row | `ImboxReset.test.tsx:21-24`: `expect(screen.queryByRole('region', { name: 'Reading Community garden introduction' })).not.toBeInTheDocument()`; `expect(screen.queryByTestId('email-body')).not.toBeInTheDocument()`; `expect(screen.queryByRole('article', { name: 'Community garden introduction' })).not.toBeInTheDocument()`; `expect(screen.getByRole('region', { name: 'New for you' })).toBeVisible()` | SCRN-01 applies to reader as well as list | Yes |
| Pending sender back in Screener | `ImboxReset.test.tsx:27-29`: `expect(noah).toBeVisible()`; `expect(within(noah).getByRole('button', { name: 'Yes, let them in: Noah de Vries' })).toBeVisible()` | Noah is available for screening again | Yes |
| Ordinary open-to-seen retains reader | `src/features/imbox/ImboxView.test.tsx:23-24`: `expect(screen.getByTestId('email-body')).toHaveTextContent('Message fresh')`; `expect(storedState().emails.fresh.seen).toBe(true)`; `:27`: `expect(within(screen.getByRole('region', { name: 'Previously seen' })).getByRole('article', { name: 'Subject fresh' })).toBeVisible()` | IMBOX-02 opens and marks seen, not closes | Yes |

| Assertions (C) | Maps to | Keep |
| --- | --- | --- |
| `ImboxReset.test.tsx:14-15` visible reader / approved decision above | SCRN-02, T21 workflow precondition | Yes |
| `ImboxReset.test.tsx:18-20` full seed / pending / screener above | Confirmed reset assumption, SCRN-01 | Yes |
| `ImboxReset.test.tsx:21-24` reader/body/row absence and list visibility above | SCRN-01, T21 no stale reader | Yes |
| `ImboxReset.test.tsx:28-29` Noah and approval-button visibility above | Reset assumption, SCRN-01 | Yes |
| `ImboxView.test.tsx:23-24,27` body/seen/row assertions above (unchanged) | IMBOX-02 regression guard | Yes |

Adequacy A-D passed: exact persisted state and visible outcomes, not mock calls;
every assertion maps to this repair/spec; AD-004/co-location followed.
No previous test changed, weakened, removed or skipped. Independent verification
remains pending.

### T22: Validate raw bundled mail and surface seed diagnostics (F2)

**What**: Validate raw seed messages before sender dereference/construction;
skip malformed/missing-field and unknown-sender records, retain healthy
records at stable source-index IDs, and report every skip via repository
logger/notices on first load, fallback, and reset. Core stays pure and acyclic.
**Where**: `src/data/seed.ts`
**Depends on**: T9, T10, T11, T20
**Reuses**: Existing content/record guards, normalization diagnostic union,
repository logger/notices, real AppShell/store
**Files**: seed.ts, new domain validation.ts, triage.ts, repository.ts,
AppStore.tsx, new seed-validation.test.tsx, README.md, design.md, tasks.md, spec.md

**Done when**:

- [x] Raw missing/invalid fields and unknown senders are skipped before constructing mail, without import-time failure; healthy records retain complete values and source-index IDs.
- [x] First load, invalid JSON/version/envelope fallback, storage failure, and repository reset expose exact skip diagnostics and log payloads while retaining healthy state.
- [x] Real-shell startup and Reset demo publish nonblocking skip notices, preserve healthy mail, and durably reset without side effects in the pure core.
- [x] Existing valid seed, persisted-state normalization, store behavior and all original tests remain intact.

**Tests**: unit (seed/core/repository plus real-shell RTL reset diagnostic regression)
**Gate**: full; targeted `npm test -- src/data src/domain/normalize.test.ts src/state/AppStore.test.tsx`, then `npm run build && npm run lint && npm test`
**Commit**: `fix(data): validate bundled mail and report seed diagnostics`

**Execution evidence (T22)**: Test-first RED reproduced import-time
`sender.decision` failure at `seed.ts:22` with only bundled JSON mocked.
The new suite adds 30 cases: import/core reset, 18 raw-record variants, two
pure normalization fallbacks, seven repository entry paths, and two real-shell
notice flows. Targeted gate: 111 passed. Initial build caught a guard narrowing
type error; retaining `Record<string, unknown>` in the content type predicate
fixed it without changing tests. Repeated full gate: build + lint + 192 tests,
17 files, zero failed/skipped. Original 161 and T21's regression remain intact.

The shared guard has type-only model dependencies; seed imports that guard,
and triage imports both, with no import cycle. Seed/core return diagnostics;
repository alone logs/publishes. Store reset calls the repository at the event
boundary, never during a reducer, then installs its returned state through a
pure internal action. README/design document this corrected reset contract.

| Criterion (A) | Exact assertion evidence (`src/data/seed-validation.test.tsx`) | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Import/core reset safe; healthy fields and stable IDs | `:34` `expect(state.order).toEqual(['mail-01', 'mail-04'])`; `:35-44` `expect(state.emails).toEqual({...})` enumerates both complete records, including source-index IDs/timestamps, sender, subject, snippet, body, seen, box, originBox and pile; invoked for eager seed/factory/core reset at `:49-52` | Malformed/missing-field edge skips bad records, retains complete healthy records without renumbering | Yes |
| Each raw required field and unknown sender | `:72-79` `expect(state.order).toEqual(['mail-01', 'mail-03'])`; `expect(Object.values(state.emails).map((email) => email.subject)).toEqual(['Healthy first', 'Healthy last'])`; `expect(state.emails['mail-03']).toEqual({...fixture.last, id:'mail-03', receivedAt:'2026-10-01T20:00:00.000Z', seen:true, box:'imbox', originBox:'imbox', pile:null})`; `expect(repo.getNotices()).toEqual([skipped('mail-02')])`; `expect(vi.mocked(console.warn).mock.calls).toEqual([[skipped('mail-02').message, skipped('mail-02')]])` | All four raw fields missing/null/wrong-type; invalid records and unknown/prototype/blank sender skipped with exact warning payload | Yes |
| Pure fallback diagnostics | `:88-92` `expect(result.restoredSeed).toBe(true)`; `expect(result.diagnostics).toEqual([{code:'seed-restored', reason, message:'Restored sample mailbox'}, ...skips])`; `expect(console.warn).not.toHaveBeenCalled()`; healthy payload helper `:34-44` invoked at `:87` | IMBOX-05 and malformed edge compose; no logging from core | Yes |
| First load, JSON/version/envelope fallback, storage access/read failure, reset | `:125-129` `expect(repo.getNotices()).toHaveLength(expected.length)`; `expect(repo.getNotices()).toEqual(expect.arrayContaining(expected))`; `expect(observed.at(-1)).toEqual(repo.getNotices())`; `expect(vi.mocked(console.warn).mock.calls).toHaveLength(expected.length)`; `expect(vi.mocked(console.warn).mock.calls).toEqual(expect.arrayContaining(expected.map((notice) => [notice.message, notice])))`; healthy payload `:34-44` invoked at `:118,130`; reset storage `:131` `expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(state)` | Exact skip payloads plus applicable restoration/storage notice, observable and logged; healthy state durably reset | Yes |
| Real shell initial/reset warnings and usable healthy mail | `:142` initial reset-path notice absent; `:146` `expect(within(banner).getByText(notice.message)).toBeVisible()` for both skips; `:147` `expect(screen.getAllByRole('article').map((row) => row.getAttribute('aria-label'))).toEqual(['Healthy last', 'Healthy first'])`; `:148` complete stored-state helper `:34-44`; `:149-150` `expect(repo.getNotices()).toEqual(skips)` and exact log tuples; `:152-153` `expect(screen.getByTestId('email-body')).toHaveTextContent('Last body')`; `expect(banner).toBeVisible()` | No lost warning on UI reset, no bad mail, persisted healthy mail remains readable while notice stays nonblocking | Yes |
| Existing behavior preserved | Unchanged `src/data/seed.test.ts:8` `expect(Object.keys(seed.emails)).toHaveLength(40)`; `src/data/repository.test.ts:28` `expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(state)`; `src/state/AppStore.test.tsx:56` `expect(currentState()).toEqual(beforeReload)`; all original tests included in 192-test gate | Valid seed, normalization and triage persistence unchanged | Yes |

| Assertions (C, new suite unless noted) | Maps to | Keep |
| --- | --- | --- |
| `:34-44,49-53` exact healthy records/order and no core log | T22 import safety, stable IDs, pure reset; malformed edge | Yes |
| `:72-79` healthy IDs/payload and exact identified skip/log | Malformed/missing-field edge, T22 unknown-sender validation | Yes |
| `:87-92` healthy state, restored flag, combined diagnostics, no logging | IMBOX-05, malformed edge, AD-001 purity | Yes |
| `:114-115,118,125-131` initial empty state/no warnings, exact notices/logs, subscription snapshot, healthy cached/reset state and persisted payload | T22 first load/fallback/reset, storage failure and observability | Yes |
| `:142,146-153` absent initial notice, visible skip messages, exact rows, stored payload, logger/notices, usable reader with banner | T22 real-shell reset integration and nonblocking malformed-mail warning | Yes |
| Existing `seed.test.ts:8`, `repository.test.ts:28`, `AppStore.test.tsx:56` above | T3/T10/T11 regression preservation | Yes |

Adequacy A-D passed: full healthy payloads and exact diagnostic code/emailId/
message checked, warning order left unspecified where the spec does not define
it (exact membership plus length), no mock-only outcome claims. Every new
case maps to this bounded repair; AD-004/co-location followed. No original
tests changed, weakened, removed or skipped. Independent verification pending.

### T23: Specify newest-first Focus order (F3)

**What**: Carry the user's explicit most-recent-first choice into REPLY-03.
Keep approved design, implementation, and original ordering assertions intact.
**Where**: `.specs/features/hey-mail-reader/spec.md`
**Depends on**: T17
**Reuses**: Approved design, existing triage and Reply Later regression tests
**Files**: spec.md, tasks.md, STATE.md (Handoff only)

**Done when**:

- [x] REPLY-03 explicitly says newest-first, consistent with approved design and user choice.
- [x] Existing core and real-shell tests assert newest reply first, older next, one message at a time; no behavior/test changes.
- [x] Final build/lint/all-tests gate passes with all 161 original tests retained; Handoff says repairs done, independent re-verification pending.

**Tests**: unit (existing spec-derived core and UI regression assertions)
**Gate**: build; targeted `npm test -- src/domain/triage.test.ts src/features/reply-later/ReplyLater.test.tsx`, then `npm run build && npm run lint && npm test`
**Commit**: `docs(spec): specify newest-first focus reply order`

**Execution evidence (T23)**: User explicitly confirmed most recent first.
REPLY-03 and its independent test now specify newest-first by received time,
matching the already-approved design and implementation. No behavior or tests
changed. Targeted core/Reply Later gate: 38 passed. Final build + lint + all
tests: 192 passed, 17 files, zero failed/skipped. Compared to `0576807`, test
changes are only the two added regression files; all 161 original tests remain
unchanged. Handoff records repairs complete and independent re-verification
pending, not a feature-level PASS.

| Criterion (A) | Exact assertion evidence | Spec-defined outcome | Covered |
| --- | --- | --- | --- |
| Newest-first core queue/current item | `src/domain/triage.test.ts:203-205`: `expect(ids(selectPile(next, 'replyLater'))).toEqual(['new', 'old'])`; `expect(selectFocusReply(next)).toEqual(state.emails.new)`; `expect(next.focusReply).toEqual({active:true, cursor:0})` | REPLY-03 now explicitly names the existing newest-received-first oracle | Yes |
| One reply only, newest visible first | `src/features/reply-later/ReplyLater.test.tsx:19-22`: `expect(screen.getAllByTestId('email-body')).toHaveLength(1)`; `expect(screen.getByTestId('email-body')).toHaveTextContent('Message newer')`; `expect(screen.queryByText('Subject older')).not.toBeInTheDocument()`; `expect(screen.queryByText('Subject unrelated')).not.toBeInTheDocument()` | Exactly the newest reply, no older or non-reply body | Yes |
| Older reply next | `ReplyLater.test.tsx:25`: `expect(screen.getByTestId('email-body')).toHaveTextContent('Message older')`; `:27`: `expect(app.storedState().emails.newer).toEqual(message('newer', {receivedAt:'2026-10-11T09:00:00.000Z', seen:true}))` | REPLY-03/04 newest completed before older | Yes |

| Assertions (C) | Maps to | Keep |
| --- | --- | --- |
| `triage.test.ts:203-205` exact order, active message and focus state above | REPLY-03, T23 confirmed ordering | Yes (unchanged) |
| `ReplyLater.test.tsx:19-22` count, newest body, excluded others above | REPLY-03 | Yes (unchanged) |
| `ReplyLater.test.tsx:25,27` older body and completed newer payload above | REPLY-03/04 | Yes (unchanged) |

Adequacy A-D passed: the user resolves the precision gap; existing exact
assertions now match the AC rather than design alone. No duplicate tests or
unclaimed assertions added; AD-004 and original co-location retained.

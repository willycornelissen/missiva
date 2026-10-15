# HEY-style Mail Reader Validation

## Validation: PASS

All 23 P1 acceptance criteria match their specified outcomes. All five listed
edge cases pass. Repair round 1 resolves F1, F2 and F3. The independent full
gate passes with 192 tests, and all three behavior mutations are killed.
The independent verdict is based on automated/static implementation verification.
After that verdict, the orchestrator recorded the user's acceptance of all five
P1 workflows below. No claim is made that a HEY user approved visual resemblance.

- **Date:** 2026-10-15
- **Verifier:** fresh independent sub-agent; author != verifier; no nested agents.
- **Spec:** `.specs/features/hey-mail-reader/spec.md`.
- **Full diff range:** `2a7fdae..f4e2a03`.
- **Verified HEAD:** `f4e2a03d0dd485c1df089c440b4e4e90b9b995fc`.
- **Repair range:** `0576807..f4e2a03`: `edda10e` (F1), `613b0c2` (F2),
  `f4e2a03` (F3).
- **Scope:** five P1 stories, all five edges, all twelve confirmed assumptions,
  T1–T23, production wiring and test integrity. Seven P2/P3 requirements remain
  explicitly deferred and are not completion gaps.
- **Method:** independently read current production code and test assertions,
  compare their oracles with the spec, run the exact full gate, run isolated
  behavior mutations, restore/discard scratch, compare real-tree porcelain.
- **Write boundary:** only this report changed persistently. Implementation,
  tests, spec, tasks, STATE and existing lessons were not edited. No commits,
  stash, dependency installation, push or deployment.

## Original findings: resolution

| Finding | Original failure and required outcome | Current evidence | Disposition |
| --- | --- | --- | --- |
| F1, Major | Approve Noah → open his mail → Reset demo left pending mail visible in the Imbox reader. SCRN-01 and reset require it to disappear and return to Screener. | `src/features/imbox/ImboxView.tsx:15-16` resolves the reader from both current eligible Imbox groups, rather than all stored emails. `src/features/imbox/ImboxReset.test.tsx:18-20` asserts the entire persisted seed, decision `pending`, and box `screener`; lines 21–24 assert reader/body/row absence and restored list; lines 28–29 assert Noah and his Yes control in Screener. Ordinary opening still displays `Message fresh` and persists `seen:true` at `src/features/imbox/ImboxView.test.tsx:23-24`. Sensor M1 reintroduced the bug and this regression failed at line 21. | **Resolved** by `edda10e`; independently reproduced the regression test's discrimination. |
| F2, Major | Missing bundled fields were retained, and unknown sender references crashed before diagnostics. Malformed records must be skipped, healthy records retained, and warnings nonblocking. | `src/data/seed.ts:24-28` validates before sender dereference. `src/domain/validation.ts:14-16` checks record, known own sender key, and all raw string fields. `src/data/seed-validation.test.tsx:34-44` enumerates complete healthy records and stable source-index IDs/timestamps; lines 49–53 cover eager import, factory and pure core reset; lines 72–79 cover 18 invalid-record variants with exact skip/log payloads. Lines 87–92 verify combined pure fallback diagnostics. Lines 118–131 cover seven repository entry paths. Lines 145–153 assert both visible skip notices, exactly healthy rows, persisted healthy state and usable reader for startup/reset. Sensor M2 suppressed seed diagnostic publication and killed 25 cases, including both real-shell paths. | **Resolved** by `613b0c2`; no retained malformed mail/import crash or missing-warning gap remains in the tested entry paths. |
| F3, Minor precision | REPLY-03 previously said only “in order”; newest-first was documented in design but not the AC. | `spec.md:107` now explicitly requires newest-first by received time, confirmed by the user in this verification request. `src/domain/triage.test.ts:203-205` asserts exact newest-first pile and current message; `src/features/reply-later/ReplyLater.test.tsx:19-22,25` asserts one newest body, no older/unrelated subject, then the older body. Sensor M3 reversed Focus selection and failed both core and UI assertions. | **Resolved** by `f4e2a03`; the existing oracle now directly matches the confirmed AC. |

No ranked implementation gaps remain. No further repair task is proposed.

## Task completion

| Tasks | Recorded completion | Independent assessment |
| --- | --- | --- |
| T1–T3 | Done | Scaffold and types build/lint; seed is 40 complete linked messages with demo categories, decisions, seen states and piles. |
| T4–T9 | Done | P1 reducer/selectors, receive routing, both pile conflicts, Focus, persisted normalization and fresh reset verified. |
| T10–T12 | Done | Durable repository, observable failure diagnostics, real provider wiring and sanitizer verified. |
| T13–T20 | Done | Five real routes, rows/readers, dock, empties, triage, shortcuts, notices and reset verified; layout/motion declarations inspected statically. |
| T21 | Done | F1 regression passes and fails when eligibility repair is reverted in scratch. |
| T22 | Done | Thirty new raw-seed/core/repository/shell cases pass; repaired diagnostic regression is discriminating. |
| T23 | Done | User-confirmed precise ordering matches unchanged core/UI tests; full independent gate passes. |

All 23 task definitions have checked Done-when boxes. Task-local historical
gate claims were not substituted for this verifier's independent gate.
Read-only spec/task/STATE statuses remain unchanged; the orchestrator may
reconcile their “Implementing / independent verification pending” text using
this report.

## Spec-anchored acceptance criteria

Paths and assertion lines below are at the verified HEAD. Exact copy where the
spec prescribes none is a UI choice, not an invented requirement. Structural
CSS inspection supplements DOM assertions for physical layout.

| AC | Spec-defined expected outcome | `file:line` and actual assertion expression | Assessment |
| --- | --- | --- | --- |
| IMBOX-01 | “New for you” before “Previously seen”, with separate memberships | `src/features/imbox/ImboxView.test.tsx:16`: `expect(fresh.compareDocumentPosition(seen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()`; lines 17,19 assert the fresh/seen articles in their own regions. `src/domain/triage.test.ts:37-38`: group IDs equal `['new','old']` and `['read-new','read-old']`. | PASS |
| IMBOX-02 | Opening new mail marks it seen and moves it to Previously seen | `src/features/imbox/ImboxView.test.tsx:23-28`: body contains `Message fresh`, `expect(storedState().emails.fresh.seen).toBe(true)`, New article absent, fresh article visible in Seen after closing, Imbox count `0`. `src/domain/triage.test.ts:106`: complete email equals `{...state.emails.new, seen:true}`. | PASS |
| IMBOX-03 | Unseen indicator distinct from seen | `src/features/common/common.test.tsx:27`: `expect(within(row).getByLabelText('Unseen')).toBeVisible()`; lines 34–35 assert Unseen absent / Seen present. `src/features/common/Common.module.css:21-22` supplies filled versus outlined dots. | PASS |
| IMBOX-04 | Dedicated empty New state when no new mail | `src/features/imbox/ImboxView.test.tsx:33-34`: caught-up heading visible inside New and `Subject read` retained in Seen; lines 39–41 assert both dedicated empties and no articles for entirely empty Imbox. | PASS |
| IMBOX-05 | Unknown schema restores bundled seed and nonblocking notice | `src/domain/normalize.test.ts:9-13`: state equals `buildSeedState()`, restored flag true, exact `seed-restored/schema-version` diagnostic. `src/features/common/NoticeBanner.test.tsx:18,21-22`: “Restored sample mailbox” visible, triage changes Set Aside count to `2`, notice stays visible. Malformed-seed fallback is additionally covered by `src/data/seed-validation.test.tsx:87-92`. | PASS |
| SCRN-01 | Undecided sender's mail only in Screener, outside Imbox/Feed | `src/domain/triage.test.ts:46-48`: Imbox groups empty, incoming email equals complete `screener` box/origin payload, Screener contains the pending sender. `src/features/feed/FeedView.test.tsx:28-30`: pending newsletter excluded. `src/features/imbox/ImboxReset.test.tsx:18-24,28-29`: complete seed restored, no pending reader/body/row, Noah back in Screener. | PASS, including repaired reset composition |
| SCRN-02 | Approve all current/future personal mail to Imbox, newsletters to Feed | `src/domain/triage.test.ts:62`: every `first/second/future` equals `email(id,{box,originBox:box})`, with explicit personal/newsletter cases. `src/features/screener/ScreenerView.test.tsx:22-23`: actual persisted decision `'approved'` and each current email's box equals destination. `src/features/feed/FeedView.test.tsx:38-39`: approved body visible, Imbox `0`. | PASS |
| SCRN-03 | Reject current mail from all active boxes; suppress future mail | `src/domain/triage.test.ts:77-81`: complete current/future emails equal `screenedOut` box/origin with null pile; decision rejected, unrelated Imbox mail retained. `src/features/screener/ScreenerView.test.tsx:39-46`: removed sender, zero Imbox/Feed, both current boxes screened out, unrelated sender still pending. | PASS |
| SCRN-04 | Persist per-sender choice and do not screen again | `src/domain/triage.test.ts:89-92`: repeated decision unchanged, future mail in Imbox, no Screener sender. `src/data/repository.test.ts:28-30`: actual JSON and new-repository load equal full state, decision `'approved'`. `src/state/AppStore.test.tsx:56`: remounted state equals `beforeReload`. | PASS |
| SCRN-05 | Dedicated empty Screener | `src/features/screener/ScreenerView.test.tsx:51-53`: dedicated heading/message visible and Yes controls absent. | PASS |
| REPLY-01 | Marking Reply Later adds email to bottom-docked pile | `src/features/reply-later/ReplyLater.test.tsx:15-17`: moved row absent from Imbox, click counted dock, expanded article IDs equal `['Subject newer','Subject older']`. `src/features/common/common.test.tsx:37`: one-email dock href `/reply-later`. `src/features/common/Common.module.css:48`: fixed, bottom `0`, right `38px`. | PASS |
| REPLY-02 | Visible pile item count | `src/features/reply-later/ReplyLater.test.tsx:16,26,31`: counted dock is used at `2`, then asserted visible at `1` and `0`. `src/domain/triage.test.ts:190-191`: exact repeated pile payload and length `1`, not duplicate insertion. | PASS |
| REPLY-03 | Only Reply Later mail, one at a time, newest received first | `src/domain/triage.test.ts:203-205`: pile IDs `['new','old']`, Focus equals `state.emails.new`, focus `{active:true,cursor:0}`. `src/features/reply-later/ReplyLater.test.tsx:19-22`: exactly one body, `Message newer`, older/unrelated subjects absent. Fixture dates at lines 10 and `src/test/mailbox.tsx:11` establish newest vs older received time. | PASS, precise user-confirmed oracle |
| REPLY-04 | Finish advances to next reply until none remain | `src/features/reply-later/ReplyLater.test.tsx:25,27,33`: next body `Message older`, completed newer and older equal complete expected seen records. `src/domain/triage.test.ts:212-220`: remaining queue, next message, final cleared pile and restored seen records. | PASS |
| REPLY-05 | Empty pile exits Focus and shows dedicated empty state | `src/features/reply-later/ReplyLater.test.tsx:29-32`: empty heading, absent Finish, visible zero count, focus exactly `{active:false,cursor:0}`; lines 52–54 cover initially empty route without Focus button. | PASS |
| ASIDE-01 | Set Aside adds email to bottom-docked pile | `src/features/set-aside/SetAside.test.tsx:11-14`: source article absent, caught-up heading, counted dock clicked, reference article visible in pile. Physical placement is shared fixed dock at `src/features/common/Common.module.css:48`. | PASS |
| ASIDE-02 | Visible Set Aside count | `src/features/common/common.test.tsx:40`: one-email link has `/set-aside` href; `src/features/set-aside/SetAside.test.tsx:17`: zero-email link visible after removal. | PASS |
| ASIDE-03 | Removing restores originating box | `src/features/set-aside/SetAside.test.tsx:19-20`: reference row in New and entire email equals original `message('reference')`; lines 31–33 assert Feed `1`, Imbox `0`, full newsletter equals `{...original,pile:null,seen:true}` after reading/return. `src/domain/triage.test.ts:271-275` covers both origins and seen flags. | PASS |
| ASIDE-04 | Set Aside mail excluded from New | `src/features/set-aside/SetAside.test.tsx:11-12`: source article absent and caught-up heading visible. `src/domain/triage.test.ts:257`: `expect(selectImbox(repeated).newForYou).toEqual([])`. | PASS |
| FEED-01 | Approved newsletters in Feed instead of Imbox | `src/domain/triage.test.ts:129-131`: exact Feed email and empty Imbox. `src/features/feed/FeedView.test.tsx:38-39`: actual Screener approval/navigation produces newsletter body and zero Imbox count. | PASS |
| FEED-02 | Expanded, newest-first, single scrollable column | `src/features/feed/FeedView.test.tsx:17-18`: exact article order `['Subject new','Subject old']`, exact full sanitized body HTML for both. `src/features/feed/FeedView.module.css:1` declares flex column in document scroll flow; `src/app/AppShell.module.css:36` leaves main in that flow. | PASS, layout statically inspected |
| FEED-03 | Feed scrolling does not clear Imbox unseen count | `src/features/feed/FeedView.test.tsx:20-23`: Imbox `1` before/after scroll and `expect(app.storedState()).toEqual(state)`. `src/features/feed/FeedView.tsx:8-25` has no scroll/read dispatch. | PASS |
| FEED-04 | Dedicated empty Feed | `src/features/feed/FeedView.test.tsx:28-30`: quiet heading, newsletter empty-state message, and no articles. | PASS |

**Accounting:** 23/23 P1 ACs matched to exact assertions and spec outcomes;
zero remaining functional or spec-precision gaps. Group order is required by
IMBOX-01; newest-first within those groups is a compatible design choice.
Empty-state copy is not prescribed by the spec, so the criterion is a dedicated
state rather than one mandatory phrase.

## Edge cases

| Edge | Expected outcome and direct evidence | Assessment |
| --- | --- | --- |
| Malformed/missing mail | Skip, warn, retain healthy mail without crashing. Persisted fields/values/nonrecords at `src/domain/normalize.test.ts:58-66,81-97` assert bad absence, healthy count/content and identified diagnostics. Raw seed variants at `src/data/seed-validation.test.tsx:72-79` assert healthy subjects/IDs, complete last record, exact skip notice and log tuple. Eager import/core reset lines 49–53, pure fallback lines 87–92, seven repository paths lines 118–131 and real-shell startup/reset lines 145–153 cover the repaired failure surfaces. | PASS |
| Unsafe HTML | Sanitize before rendering, retaining safe message content. `src/lib/sanitize.test.ts:9-11,19-20,24-25` assert exact removal of scripts/handlers/unsafe URLs/non-HTML content. `src/features/common/common.test.tsx:60` and `src/features/feed/FeedView.test.tsx:18` assert actual rendered safe HTML. All reader/Focus/preview/Feed bodies use `src/features/common/index.tsx:50-51`. | PASS |
| Conflicting piles | Most recently chosen pile only. `src/domain/triage.test.ts:284-288` asserts exact selected pile payload, other pile empty, origin preserved, both directions. `src/features/set-aside/SetAside.test.tsx:40-43` asserts old pile `0`, new pile membership and persisted `'replyLater'`; `src/features/common/useShortcuts.test.tsx:102-106` covers focused-reply transfer and empty exit. | PASS |
| Storage unavailable/full | Start from seed if storage inaccessible, warn no persistence, continue in memory. `src/data/repository.test.ts:97-108` asserts seed and exact warning plus usable triage/reset; lines 125–131 assert retained current work on later failed save. `src/features/common/NoticeBanner.test.tsx:37-43` asserts visible no-persist notice, current pile and usable reset. `src/data/seed-validation.test.tsx:118-129` additionally covers skips with storage access/read failure. Retaining current work on a later failure follows `design.md:130-133`, rather than destructively reseeding it. | PASS |
| Dual personal/newsletter classification | Personal/Imbox wins in either classification order. `src/domain/triage.test.ts:171-173`: current/future Imbox IDs `['future','first']`, Feed `[]`, future box `'imbox'` for both parameterized orders. | PASS |

**Accounting:** 5/5 listed edges pass. The raw seed supplies senderId, subject,
snippet and bodyHtml; factory-generated ID/time/seen/routing fields have
separate persisted-record normalization tests. This distinction avoids claiming
that generated fields were accepted from malformed raw input.

## Confirmed assumptions

| Confirmed decision | Evidence and assessment |
| --- | --- |
| Bundled static ~40-email JSON | `src/data/seed.test.ts:8,14-22`: length `40`, linked sender IDs, nonempty content, valid timestamps and sorted order; lines 28–38 assert category/decision/seen/pile sets and deterministic seed equality. Raw bad alternatives are now safely skipped. PASS. |
| Versioned localStorage and reset | `src/data/repository.ts:6`: `missiva.mailbox.v${SCHEMA_VERSION}`. `src/data/repository.test.ts:28-31,81-86` asserts full durable state/reset and untouched unrelated key; `src/features/imbox/ImboxReset.test.tsx:18-24` verifies reset eligibility, not only storage. PASS. |
| Hand-rolled CSS Modules without UI kit | Package manifest has no component kit; shell and all feature views import their own CSS Modules. Build compiles them. PASS by static dependency/source inspection, not visual judgment. |
| List rows: sender, subject, snippet, time, New/Seen grouping | `src/features/common/common.test.tsx:23-27` asserts each field, exact datetime and unseen label; Imbox grouping evidence above. PASS. |
| Counted bottom-right tiles open piles | `src/features/common/Common.module.css:48,69-70` declares fixed bottom/right docking and mobile bounds. Reply Later/Set Aside route tests click counted dock links and inspect contents. PASS by DOM plus CSS inspection; no measured viewport claim. |
| Yes/No sender choice remembered | SCRN-02–04 exact decision/destination and new-repository/remount assertions above; F1 reset regression covers returning a decided sender to pending seed. PASS. |
| Approved newsletters route to Feed | `src/domain/triage.test.ts:62,129-131`, real-shell Feed approval test lines 38–39. PASS. |
| j/k/e/r/y/n shortcuts | `src/features/common/useShortcuts.test.tsx:13-25` asserts selection/clamping and exact chosen piles; lines 47–52 assert approved/rejected destinations; lines 63–64 cover Feed and both pile routes; lines 79–81 assert unchanged state for editable/modifier/composition events. PASS. |
| Subtle slide/fade; respect reduced motion | `src/index.css:27-34` encloses all declared animations/transitions in `prefers-reduced-motion: no-preference`, with 180ms arrive animation and 150ms control transitions. Inspected stylesheet scope; no independent computed-style/browser execution claimed. PASS by static CSS verification. |
| Sanitized HTML/plain text; inline remote images | `src/lib/sanitize.test.ts:33` asserts full safe formatting/link/table/HTTPS-image fixture unchanged; lines 37–38 assert plain and empty bodies unchanged. Shared body uses DOMPurify HTML profile at `src/lib/sanitize.ts:4`; image sizing/inline flow at `src/features/common/Common.module.css:41`. PASS. |
| Dedicated empty message and illustration placeholder per box/pile | All five route empties have direct assertions above; `src/features/common/common.test.tsx:45-47` asserts message, heading, decorative illustration with `aria-hidden="true"`; every empty route uses that shared component. PASS. |
| Five deep-linkable client routes | `src/app/AppShell.tsx:59-63` declares the five paths; `src/app/AppShell.test.tsx:18-19` asserts each heading/active link; feature suites initialize routes directly. Production BrowserRouter is at `src/App.tsx:5`. PASS for client routing; production host rewrite configuration is outside this local prototype gate. |

**Accounting:** 12/12 decisions inspected. Assertions cover behavioral
decisions; implementation/CSS/package evidence covers structural decisions.
No human judgment, computed pixel position, or interactive UAT is inferred
from jsdom visibility.

## Production wiring and quality

`src/test/mailbox.tsx:22-29` renders the real shell/provider/routes/repository
over serialized storage, not mocked selectors or dispatch calls. Repository
and provider tests separately verify real localStorage and fresh-instance
reload. `src/main.tsx:7-9`, `src/App.tsx:5` and `src/app/AppShell.tsx:15`
connect StrictMode, BrowserRouter and the store in production.

The F2 repair preserves the layer boundary: seed and normalization return
structured diagnostics; `src/data/repository.ts:29-44` logs/publishes them.
`src/state/AppStore.tsx:27-33` intercepts reset at the event boundary, calls
repository reset outside a reducer and installs returned state with a pure
internal action. Its save effect remains at lines 35–37. The new content guard
has type-only model dependencies, so seed → guard and triage → seed/guard do
not introduce an import cycle.

| Quality check | Assessment |
| --- | --- |
| Surgical P1-only scope | PASS. Greenfield app and directly related scaffold/docs/tests; no transport/auth/backend or deferred P2/P3 views. Repair changes address the three identified findings. |
| Appropriate abstractions | PASS. Shared rows/body/reader/dock/actions serve multiple routes; storage adapter and provider have concrete persistence roles; the shared content guard serves raw and persisted validation. |
| Patterns and layering | PASS. Pure TypeScript domain, repository-owned effects, React dispatch/select consumers, CSS Modules, one sanitizer seam. |
| Payload/conjunction rule | PASS. Tests assert complete mail/state payloads, exact decisions/destinations, persisted state, diagnostic code/id/message and log tuples, not merely invocation counts. |
| Spec-derived assertions | PASS. 23 ACs and five edges mapped above. Newest-first is explicitly user-confirmed; non-prescribed empty-state wording is not misrepresented as mandated. |
| Per-layer coverage expectations | PASS for scoped AC/edge/error outcomes. Domain covers the P1 obligations; each route covers happy/empty paths; relevant load/reset/error paths cross repository/store/shell. No numerical statement of total branch coverage is made. |
| Every test has an owner | PASS. Seed → T3/T22; triage → P1/edges; normalization → T9/edges; repository/provider → T10–T11/T22; sanitizer → T12/body edge; shell/common → T13–T14/assumptions; route suites → their P1 stories; reset → T21; shortcuts/notices → T20/assumptions/errors. |
| Project guidance | PASS. `.specs/STATE.md:5-38` AD-001..004 and tasks Test Coverage Matrix: Vitest + RTL + jsdom, co-located tests, pure core/repository split. No pre-existing application testing standard; strong defaults applied. |
| Existing design deviations | Reviewed, unchanged semantics, no newly unresolved deviation. Details below. |

Existing design clarifications at `design.md:209-228` remain consistent with
P1: multiple sender kinds and personal precedence (triage assertions 171–173),
explicit pending Screener versus rejected screenedOut (47,77), approved
receipts in P1 Imbox (180–181), head cursor for shrinking reply queue
(212–220), and pure diagnostics logged by adapters
(`src/data/repository.test.ts:72-73`). These five historical signals already
have lessons L-004..L-008. F1/F2/F3 already have L-001..L-003. They are not new
failures or reasons to duplicate lessons on this clean repair verification.

## Independent full gate and test integrity

Executed in the real project, exactly as mandated by tasks:

```sh
npm run build && npm run lint && npm test
```

- **Build:** exit 0. TypeScript and Vite production build, 48 transformed modules.
- **Lint:** exit 0.
- **Tests:** exit 0; **17 files, 192 passed, 0 failed, 0 skipped**.
- **Independent test run:** started 10:25:37, reported duration 41.11s.
- **Baseline before feature:** 0 tests. `git ls-tree -r --name-only 2a7fdae`
  lists only STATE, design, spec and tasks documents.
- **Before repairs:** 161 tests at `0576807`.
- **After repairs:** 192 tests, +31 (one F1 regression, 30 F2 cases).
- **Full-feature delta:** +192 tests. Every original test file is unchanged
  across the repair range; `git diff --name-status 0576807..f4e2a03` for test
  files contains only additions `ImboxReset.test.tsx` and
  `seed-validation.test.tsx`.
- No skipped/todo/only test bypasses found. No baseline test deletion or
  weakened original assertion. `git diff --check 2a7fdae..f4e2a03` passes.
- No test/build dependency was installed for this verification.

Inventory reconciles to 192: seed 2; seed-validation 30; triage 35;
normalization 60; repository 12; provider 7; sanitizer 7; shell 2; common 5;
Imbox 3; Imbox reset 1; Screener 4; Reply Later 3; Set Aside 4; Feed 4;
shortcuts 9; notices 4.

## Discrimination sensor

**Depth:** lightweight, three independent behavior mutations. The full real
gate passed before mutation. A detached scratch worktree at the verified HEAD
then ran the selected unmutated suites: **4 files, 69/69 passed**.

| ID | Production line mutated in scratch only | Target command | Actual observation |
| --- | --- | --- | --- |
| M1 | `src/features/imbox/ImboxView.tsx:16`: replace eligible-list lookup with `openId ? state.emails[openId] : undefined` | `npm test -- src/features/imbox/ImboxReset.test.tsx --reporter=dot` | **Killed**, exit 1, 1 failed / 0 passed. `ImboxReset.test.tsx:21:95` fails reader-absence assertion after preceding complete seed/pending/Screener assertions pass. Reproduces repaired F1, not a setup failure. |
| M2 | `src/data/repository.ts:43`: remove `publish(result.diagnostics)` from `loadSeed()` while retaining healthy state | `npm test -- src/data/seed-validation.test.tsx --reporter=dot` | **Killed**, exit 1, 25 failed / 5 passed. Line 78 gets `[]` rather than exact skip diagnostic; line 125 receives incomplete notice counts; both shell startup/reset fail the banner query at line 145. Exercises repaired F2 warning paths without corrupting mail construction. |
| M3 | `src/domain/triage.ts:57`: reverse Reply Later queue only in `selectFocusReply` before selecting the cursor | `npm test -- src/domain/triage.test.ts src/features/reply-later/ReplyLater.test.tsx --reporter=dot` | **Killed**, exit 1, 3 failed / 35 passed. Core line 204 receives old instead of new email; progression line 212 fails completed payload; UI line 20 receives older body instead of `Message newer`. Confirms REPLY-03's specified newest-first oracle discriminates. |

**Outcome:** **3 injected, 3 killed, 0 survived**. Every kill is an executed
behavioral assertion failure, not a transform/import/compiler failure.
Each mutation was restored before the next. After restoring M3,
`git -C .github/verifier-hey-f4e2a03/worktree diff --exit-code` returned 0.
No new test was added or any real implementation/test mutated by the sensor.

**Exact scratch paths, all cleaned:**

- `.github/verifier-hey-f4e2a03/worktree`, detached at `f4e2a03`.
- Its `node_modules` symlink pointed to the existing project installation.
- `.github/verifier-hey-f4e2a03/porcelain-before.txt`
- `.github/verifier-hey-f4e2a03/porcelain-after.txt`
- `.github/verifier-hey-f4e2a03/m1.log`
- `.github/verifier-hey-f4e2a03/m2.log`
- `.github/verifier-hey-f4e2a03/m3.log`

The shell's canonical project path is
`/mnt/c/Users/willy.cornelissen/Desktop/Sandbox/missiva`; tools also expose
`/home/willycornelissen/Desktop/Sandbox/missiva`. All deliberate scratch
writes stayed inside the project's named scratch directory.

Real porcelain before the sensor and after scratch worktree removal was
identical:

```text
?? .github/
?? .specs/LESSONS.md
?? .specs/features/hey-mail-reader/validation.md
?? .specs/lessons.json
```

The exact snapshot comparison used `cmp` and printed
`SENSOR ISOLATION UNCHANGED`, exit 0. Cleanup removed that exact worktree via
`git worktree remove --force`, removed only the five named scratch files,
then removed its empty parent using `rmdir`. A final `git worktree list`
showed only the original `master` worktree at `f4e2a03`; final porcelain
matched the same baseline. No stash operation was used.

## Interactive UAT and limits

The independent verifier did not perform interactive UAT or use a new browser
session, screenshot, viewport measurement, computed-style probe or deployment.
Its evidence is executable RTL/jsdom/domain/repository coverage plus static
CSS/wiring review. Prior author's browser claims are not adopted as independent
evidence.

After independent verification, the orchestrator presented one manual workflow
at a time. The user returned **"Passou"** for each, without additional comments:

| Test | Observable expected outcome | User result |
| --- | --- | --- |
| Imbox | Opening new mail marks it seen, moves it to Previously seen and survives reload. | Passou |
| Screener | Yes routes to Imbox/Feed, No removes mail from active boxes, decisions survive reload. | Passou |
| Reply Later / Focus & Reply | Dock count updates; newest-first messages appear one at a time; completion empties and exits Focus. | Passou |
| Set Aside | Mail leaves Imbox, pile count updates, removal restores its originating box. | Passou |
| Feed | Expanded newsletters appear newest-first in one scrollable column; scrolling does not change Imbox new count. | Passou |

The implementation's P1 acceptance criteria pass within that scope. Human
judgment of HEY resemblance and end-user visual acceptance remains unclaimed,
not silently converted into automated success. This report does not mark the
spec's subjective success checkboxes or edit its traceability table.

## Closing disposition

- **P1 ACs:** 23/23 pass.
- **Listed edges:** 5/5 pass.
- **Confirmed assumptions:** 12/12 reviewed; structural/visual declarations
  checked statically, behavioral obligations asserted.
- **Original findings:** F1/F2/F3 resolved.
- **Ranked remaining implementation gaps:** none.
- **Gate:** build + lint + 192 tests pass.
- **Sensor:** 3/3 killed, no survivors.
- **Persistent artifact written:** this `validation.md`.
- **Lessons:** no new signal; existing eight lessons left unchanged. No
  lesson added for a clean repair verification.
- **Traceability recommendation:** orchestrator may mark the 23 P1
  requirements Verified; leave the seven deferred P2/P3 requirements Pending.

Executed the completion gate against this persisted report:

```sh
/usr/bin/python3 .github/skills/tlc-spec-driven/scripts/validate_state.py hey-mail-reader
```

Exit **0**:

```text
validate_state: 0 error(s) across [hey-mail-reader]
```

Final real-tree `git diff --exit-code` also returned 0. The report remains
untracked as it was on entry, persisted at the required path; no commit was
created. Scratch absence and unchanged real porcelain were rechecked.

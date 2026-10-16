# HEY-style Mail Reader Validation

## Validation: PASS

All 23 P1 acceptance criteria and all 4 P2 acceptance criteria (`PAPER-01`,
`PAPER-02`, `BNDL-01`, `BNDL-02`) match their specified outcomes. All five
listed edge cases pass (including multi-classification precedence
`personal > receipt > newsletter`). Repair round 1 resolves F1, F2 and F3, and
Phase 6 completes T24–T28. The independent full gate passes with 207 tests
across 18 files, and all six behavior mutations (3 P1 + 3 P2) are killed.
The independent verdict is based on automated/static implementation verification.
After that verdict, the orchestrator recorded the user's acceptance of all five
P1 workflows below. No claim is made that a HEY user approved visual resemblance.

- **Date:** 2026-10-16
- **Verifier:** fresh independent sub-agent; author != verifier; no nested agents.
- **Spec:** `.specs/features/hey-mail-reader/spec.md`.
- **Full diff range:** `2a7fdae..4be27f0`.
- **Verified HEAD:** `4be27f0fff9094ab81d0943ce1ba60daa6e68d46`.
- **Repair range:** `0576807..f4e2a03`: `edda10e` (F1), `613b0c2` (F2),
  `f4e2a03` (F3).
- **P2 range:** `f4e2a03..4be27f0` (T24–T28: `PAPER-01`, `PAPER-02`, `BNDL-01`, `BNDL-02`).
- **Scope:** five P1 stories, two P2 stories (`Paper Trail`, `Bundles`), all
  five edges, all fifteen confirmed assumptions, T1–T28, production wiring and
  test integrity. Three P3 requirements (`BUBBLE-01`, `READ-01`, `SPY-01`)
  remain explicitly deferred and are not completion gaps.
- **Method:** independently read current production code and test assertions,
  compare their oracles with the spec, run the exact full gate, run isolated
  behavior mutations in a temporary detached worktree, discard scratch, compare
  real-tree porcelain.
- **Write boundary:** only this report changed persistently. Implementation,
  tests, spec, tasks, STATE and existing lessons were not edited. No commits,
  stash, dependency installation, push or deployment.

## Original findings: resolution

| Finding | Original failure and required outcome | Current evidence | Disposition |
| --- | --- | --- | --- |
| F1, Major | Approve Noah → open his mail → Reset demo left pending mail visible in the Imbox reader. SCRN-01 and reset require it to disappear and return to Screener. | `src/features/imbox/ImboxView.tsx:15-16` resolves the reader from both current eligible Imbox groups, rather than all stored emails. `src/features/imbox/ImboxReset.test.tsx:18-20` asserts the entire persisted seed, decision `pending`, and box `screener`; lines 21–24 assert reader/body/row absence and restored list; lines 28–29 assert Noah and his Yes control in Screener. Ordinary opening still displays `Message fresh` and persists `seen:true` at `src/features/imbox/ImboxView.test.tsx:23-24`. Sensor M1 reintroduced the bug and this regression failed at line 21. | **Resolved** by `edda10e`; independently reproduced the regression test's discrimination. |
| F2, Major | Missing bundled fields were retained, and unknown sender references crashed before diagnostics. Malformed records must be skipped, healthy records retained, and warnings nonblocking. | `src/data/seed.ts:24-28` validates before sender dereference. `src/domain/validation.ts:14-16` checks record, known own sender key, and all raw string fields. `src/data/seed-validation.test.tsx:34-44` enumerates complete healthy records and stable source-index IDs/timestamps; lines 49–53 cover eager import, factory and pure core reset; lines 72–79 cover 18 invalid-record variants with exact skip/log payloads. Lines 87–92 verify combined pure fallback diagnostics. Lines 118–131 cover seven repository entry paths. Lines 145–153 assert both visible skip notices, exactly healthy rows, persisted healthy state and usable reader for startup/reset. Sensor M2 suppressed seed diagnostic publication and killed 25 cases, including both real-shell paths. | **Resolved** by `613b0c2`; no retained malformed mail/import crash or missing-warning gap remains in the tested entry paths. |
| F3, Minor precision | REPLY-03 previously said only “in order”; newest-first was documented in design but not the AC. | `spec.md:110` now explicitly requires newest-first by received time, confirmed by the user in this verification request. `src/domain/triage.test.ts:221-223` asserts exact newest-first pile and current message; `src/features/reply-later/ReplyLater.test.tsx:19-22,25` asserts one newest body, no older/unrelated subject, then the older body. Sensor M3 reversed Focus selection and failed both core and UI assertions. | **Resolved** by `f4e2a03`; the existing oracle now directly matches the confirmed AC. |

No ranked implementation gaps remain. No further repair task is proposed.

## Task completion

| Tasks | Recorded completion | Independent assessment |
| --- | --- | --- |
| T1–T3 | Done | Scaffold and types build/lint; seed is 40 complete linked messages with demo categories, decisions, seen states and piles. |
| T4–T9 | Done | P1 reducer/selectors, receive routing, both pile conflicts, Focus, persisted normalization and fresh reset verified. |
| T10–T12 | Done | Durable repository, observable failure diagnostics, real provider wiring and sanitizer verified. |
| T13–T20 | Done | Client routes, rows/readers, dock, empties, triage, shortcuts, notices and reset verified; layout/motion declarations inspected statically. |
| T21 | Done | F1 regression passes and fails when eligibility repair is reverted in scratch. |
| T22 | Done | Thirty raw-seed/core/repository/shell cases pass; repaired diagnostic regression is discriminating. |
| T23 | Done | User-confirmed precise ordering matches unchanged core/UI tests; full independent gate passes. |
| T24 | Done | `Sender.bundled?: boolean`, `DisplayEntry`, and `SET_BUNDLE` exported in `src/domain/types.ts:14,33-35,52`; build/lint/test clean. |
| T25 | Done | Approved receipt senders route to `paperTrail` with `personal > receipt > newsletter` precedence (`src/domain/triage.ts:21-28`, `src/data/seed.ts:29-32`), `selectPaperTrail(state, query?)` filters case-insensitively by sender name, address, and subject (`src/domain/triage.ts:35-43`), and piles support `paperTrail` round-trip (`src/domain/triage.ts:80-84,101-108`). |
| T26 | Done | `SET_BUNDLE` immutably updates `sender.bundled` (`src/domain/triage.ts:146-150`), `selectDisplayEntries` collapses bundled sender emails into a single entry at the newest position with newest-first inner emails (`src/domain/triage.ts:45-61`), and `normalizeState` validates boolean `bundled` (`src/domain/triage.ts:172`). |
| T27 | Done | `PaperTrailView` (`src/features/paper-trail/PaperTrailView.tsx:8-38`) renders `/paper-trail` with live sidebar count (`src/app/AppShell.tsx:25,66`), real-time search + clear button + empty-search state, sanitized `MailReader`, keyboard shortcuts, and `Return to Paper Trail` (`src/features/common/index.tsx:97`). |
| T28 | Done | `BundleRow`, `EmailList`, and `MailActions` bundle toggle (`src/features/common/index.tsx:33-92`) collapse/expand bundled senders newest-first per Imbox group (`New for you` / `Previously seen`) and in Paper Trail, persisting `sender.bundled`. |

All 28 task definitions (T1–T28) have checked Done-when boxes. Task-local historical
gate claims were not substituted for this verifier's independent gate.
Read-only spec/task/STATE statuses remain unchanged; the orchestrator may
reconcile their “Implementing / awaiting independent Verifier” text using
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
| PAPER-01 | Approved receipt senders without personal classification route to Paper Trail instead of Imbox or Feed | `src/domain/triage.test.ts:180-185`: `expect(selectImbox(next)).toEqual({ newForYou: [], previouslySeen: [] })`, `expect(selectFeed(next)).toEqual([])`, `expect(ids(selectPaperTrail(next))).toEqual(['future-receipt', 'receipt'])`, and `next.emails['future-receipt']` has `box: 'paperTrail', originBox: 'paperTrail'`. `src/data/seed.test.ts:43-44`: all seeded receipt emails have `box: 'paperTrail', originBox: 'paperTrail'`. `src/features/paper-trail/PaperTrailView.test.tsx:22-28,35-41,96-102`: `/paper-trail` displays receipt rows newest-first, supports pile round-trip via `Return to Paper Trail`, and receives newly screened receipt senders. | PASS |
| PAPER-02 | Paper Trail searchable case-insensitively by sender name, sender email address, and subject, with dedicated empty state when no emails match | `src/domain/triage.test.ts:342-347`: `expect(ids(selectPaperTrail(state, '  NORTH rail '))).toEqual(['older-rail'])`, `expect(ids(selectPaperTrail(state, 'ORDERS@BOOKS.EXAMPLE'))).toEqual(['newer-book'])`, `expect(ids(selectPaperTrail(state, 'utrecht'))).toEqual(['older-rail'])`, `expect(selectPaperTrail(state, 'nonexistent')).toEqual([])`. `src/features/paper-trail/PaperTrailView.test.tsx:55-73`: real-time filtering by sender name (`NORTH RAIL`), address (`orders@books.example`), and subject (`reservation 14a`), plus `No matching receipts` empty state and `Clear search` reset. | PASS |
| BNDL-01 | Bundling a sender persists `bundled` state and collapses that sender's emails into a single expandable row within each Imbox group ("New for you" and "Previously seen") and in Paper Trail | `src/domain/triage.test.ts:354-359,370-375`: `expect(bundled.senders.friend.bundled).toBe(true)` and `selectDisplayEntries` returns `{ kind: 'bundle', sender: { ...rail, bundled: true }, emails: [e3, e1], latest: e3 }` positioned at newest email. `src/domain/normalize.test.ts:31-37,103-114`: preserves boolean `bundled` and rejects non-boolean `bundled: 'true'`. `src/features/imbox/ImboxView.test.tsx:55-60`: `expect(storedState().senders.maya.bundled).toBe(true)`, `Maya Chen (2)` in `New for you` and `Maya Chen (1)` in `Previously seen`. `src/features/paper-trail/PaperTrailView.test.tsx:121-126`: `expect(app.storedState().senders.rail.bundled).toBe(true)` and `North Rail (2)` row in Paper Trail. | PASS |
| BNDL-02 | Expanding a bundle lists that sender's emails in that group newest first by received time and allows unbundling or individual email actions | `src/features/imbox/ImboxView.test.tsx:62-74`: expands `Maya Chen (2)` to `['Latest unseen note', 'Older unseen note']` and unbundles back to individual rows with `storedState().senders.maya.bundled === false`. `src/features/paper-trail/PaperTrailView.test.tsx:128-145`: expands `North Rail (2)` to `['Evening train receipt', 'Morning train receipt']`, opens individual bundled email (`Message rail-old`) in `MailReader`, and unbundles back to `['Evening train receipt', 'Bookshop invoice', 'Morning train receipt']`. | PASS |

**Accounting:** 27/27 P1+P2 ACs (23 P1 + 4 P2) matched to exact assertions and
spec outcomes; zero remaining functional or spec-precision gaps. Group order is
required by IMBOX-01; newest-first within those groups is a compatible design
choice. Empty-state copy is not prescribed by the spec, so the criterion is a
dedicated state rather than one mandatory phrase.

## Edge cases

| Edge | Expected outcome and direct evidence | Assessment |
| --- | --- | --- |
| Malformed/missing mail | Skip, warn, retain healthy mail without crashing. Persisted fields/values/nonrecords at `src/domain/normalize.test.ts:58-66,81-97` assert bad absence, healthy count/content and identified diagnostics (and line 103 rejects invalid `bundled: 'true'` sender field). Raw seed variants at `src/data/seed-validation.test.tsx:72-79` assert healthy subjects/IDs, complete last record, exact skip notice and log tuple. Eager import/core reset lines 49–53, pure fallback lines 87–92, seven repository paths lines 118–131 and real-shell startup/reset lines 145–153 cover the repaired failure surfaces. | PASS |
| Unsafe HTML | Sanitize before rendering, retaining safe message content. `src/lib/sanitize.test.ts:9-11,19-20,24-25` assert exact removal of scripts/handlers/unsafe URLs/non-HTML content. `src/features/common/common.test.tsx:60`, `src/features/feed/FeedView.test.tsx:18`, and `src/features/paper-trail/PaperTrailView.test.tsx:32` assert actual rendered safe HTML. All reader/Focus/preview/Feed/PaperTrail bodies use `src/features/common/index.tsx:102-104`. | PASS |
| Conflicting piles | Most recently chosen pile only. `src/domain/triage.test.ts:301-309` asserts exact selected pile payload, other pile empty, origin preserved, both directions. `src/features/set-aside/SetAside.test.tsx:40-43` asserts old pile `0`, new pile membership and persisted `'replyLater'`; `src/features/common/useShortcuts.test.tsx:102-106` covers focused-reply transfer and empty exit. | PASS |
| Storage unavailable/full | Start from seed if storage inaccessible, warn no persistence, continue in memory. `src/data/repository.test.ts:97-108` asserts seed and exact warning plus usable triage/reset; lines 125–131 assert retained current work on later failed save. `src/features/common/NoticeBanner.test.tsx:37-43` asserts visible no-persist notice, current pile and usable reset. `src/data/seed-validation.test.tsx:118-129` additionally covers skips with storage access/read failure. Retaining current work on a later failure follows `design.md:130-133`, rather than destructively reseeding it. | PASS |
| Multi-classification precedence (`personal > receipt > newsletter`) | Routes by precedence `personal > receipt > newsletter` (`imbox > paperTrail > feed`) regardless of array order. `src/domain/triage.test.ts:164-174,188-200` parameterize `['newsletter','personal']`, `['personal','newsletter']`, `['receipt','personal']`, `['personal','receipt']`, `['newsletter','receipt']`, and `['receipt','newsletter']`, asserting exact `imbox` or `paperTrail` routing for current and future mail. | PASS |

**Accounting:** 5/5 listed edges pass. The raw seed supplies senderId, subject,
snippet and bodyHtml; factory-generated ID/time/seen/routing fields have
separate persisted-record normalization tests. This distinction avoids claiming
that generated fields were accepted from malformed raw input.

## Confirmed assumptions

| Confirmed decision | Evidence and assessment |
| --- | --- |
| Bundled static ~40-email JSON | `src/data/seed.test.ts:8,14-22`: length `40`, linked sender IDs, nonempty content, valid timestamps and sorted order; lines 28–47 assert category/decision/seen/pile/box sets (including `paperTrail`) and deterministic seed equality. Raw bad alternatives are safely skipped. PASS. |
| Versioned localStorage and reset | `src/data/repository.ts:6`: `missiva.mailbox.v${SCHEMA_VERSION}`. `src/data/repository.test.ts:28-31,81-86` asserts full durable state/reset and untouched unrelated key; `src/features/imbox/ImboxReset.test.tsx:18-24` verifies reset eligibility, not only storage. PASS. |
| Hand-rolled CSS Modules without UI kit | Package manifest has no component kit; shell and all feature views (including `PaperTrailView.module.css`) import their own CSS Modules. Build compiles them. PASS by static dependency/source inspection, not visual judgment. |
| List rows: sender, subject, snippet, time, New/Seen grouping | `src/features/common/common.test.tsx:23-27` asserts each field, exact datetime and unseen label; Imbox grouping evidence above. PASS. |
| Counted bottom-right tiles open piles | `src/features/common/Common.module.css:48,69-70` declares fixed bottom/right docking and mobile bounds. Reply Later/Set Aside route tests click counted dock links and inspect contents. PASS by DOM plus CSS inspection; no measured viewport claim. |
| Yes/No sender choice remembered | SCRN-02–04 exact decision/destination and new-repository/remount assertions above; F1 reset regression covers returning a decided sender to pending seed. PASS. |
| Approved newsletters route to Feed | `src/domain/triage.test.ts:62,129-131`, real-shell Feed approval test lines 38–39. PASS. |
| Receipt sender routing & precedence (`personal > receipt > newsletter`) | `src/domain/triage.ts:21-28,80-84,101-108`, `src/domain/triage.test.ts:176-200,282,285`, `src/features/paper-trail/PaperTrailView.test.tsx:35-41,98-102`. PASS. |
| Paper Trail search (case-insensitive trimmed substring + clearable empty state) | `src/domain/triage.ts:35-43`, `src/domain/triage.test.ts:342-347`, `src/features/paper-trail/PaperTrailView.test.tsx:55-73`. PASS. |
| Per-sender bundling (`bundled: boolean`, per-group Imbox & Paper Trail) | `src/domain/triage.ts:45-61,146-150`, `src/features/common/index.tsx:33-92`, `src/features/imbox/ImboxView.test.tsx:44-75`, `src/features/paper-trail/PaperTrailView.test.tsx:105-146`. PASS. |
| j/k/e/r/y/n shortcuts | `src/features/common/useShortcuts.test.tsx:13-25` asserts selection/clamping and exact chosen piles; lines 47–52 assert approved/rejected destinations; lines 63–64 cover Feed and both pile routes; lines 79–81 assert unchanged state for editable/modifier/composition events; `PaperTrailView.tsx:16` wires `useMailShortcuts`. PASS. |
| Subtle slide/fade; respect reduced motion | `src/index.css:27-34` encloses all declared animations/transitions in `prefers-reduced-motion: no-preference`, with 180ms arrive animation and 150ms control transitions. Inspected stylesheet scope; no independent computed-style/browser execution claimed. PASS by static CSS verification. |
| Sanitized HTML/plain text; inline remote images | `src/lib/sanitize.test.ts:33` asserts full safe formatting/link/table/HTTPS-image fixture unchanged; lines 37–38 assert plain and empty bodies unchanged. Shared body uses DOMPurify HTML profile at `src/lib/sanitize.ts:4`; image sizing/inline flow at `src/features/common/Common.module.css:41`. PASS. |
| Dedicated empty message and illustration placeholder per box/pile | All six route empties (including Paper Trail empty and empty-search) have direct assertions above; `src/features/common/common.test.tsx:45-47` asserts message, heading, decorative illustration with `aria-hidden="true"`; every empty route uses that shared component. PASS. |
| Six deep-linkable client routes (`/imbox`, `/feed`, `/paper-trail`, `/screener`, `/reply-later`, `/set-aside`) | `src/app/AppShell.tsx:60-67` declares all six paths; `src/app/AppShell.test.tsx:16-20` asserts each heading/active link; feature suites initialize routes directly. Production BrowserRouter is at `src/App.tsx:5`. PASS for client routing. |

**Accounting:** 15/15 decisions inspected. Assertions cover behavioral
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
internal action. Its save effect remains at lines 35–37. The content guard
has type-only model dependencies, so seed → guard and triage → seed/guard do
not introduce an import cycle. Phase 6 P2 keeps all routing, search, and
bundle-collapsing logic inside pure `src/domain/triage.ts`, while `ImboxView`,
`PaperTrailView`, and `EmailList`/`BundleRow` remain pure dispatch/select adapters.

| Quality check | Assessment |
| --- | --- |
| Surgical P1+P2 scope | PASS. Greenfield app and directly related scaffold/docs/tests; no transport/auth/backend or deferred P3 views. Phase 6 changes are scoped strictly to Paper Trail and Bundles (T24–T28). |
| Appropriate abstractions | PASS. Shared `EmailList`, `BundleRow`, `EmailRow`, `MailReader`, `PileDock`, and `MailActions` serve multiple routes (`ImboxView`, `PaperTrailView`, piles); storage adapter and provider have concrete persistence roles; the shared content guard serves raw and persisted validation. |
| Patterns and layering | PASS. Pure TypeScript domain, repository-owned effects, React dispatch/select consumers, CSS Modules, one sanitizer seam. |
| Payload/conjunction rule | PASS. Tests assert complete mail/state payloads, exact decisions/destinations, persisted state, display entry structures, diagnostic code/id/message and log tuples, not merely invocation counts. |
| Spec-derived assertions | PASS. 27 ACs (23 P1 + 4 P2) and five edges mapped above. Newest-first is explicitly user-confirmed; non-prescribed empty-state wording is not misrepresented as mandated. |
| Per-layer coverage expectations | PASS for scoped AC/edge/error outcomes. Domain covers all P1 and P2 obligations; each route covers happy/empty paths; relevant load/reset/error paths cross repository/store/shell. |
| Every test has an owner | PASS. Seed → T3/T22/T25; triage → P1/P2/edges; normalization → T9/T25/T26/edges; repository/provider → T10–T11/T22; sanitizer → T12/body edge; shell/common → T13–T14/T27/assumptions; route suites → their P1/P2 stories (`PaperTrailView.test.tsx` → T27/T28, `ImboxView.test.tsx` → T15/T28); reset → T21; shortcuts/notices → T20/assumptions/errors. |
| Project guidance | PASS. `.specs/STATE.md:5-38` AD-001..004 and tasks Test Coverage Matrix: Vitest + RTL + jsdom, co-located tests, pure core/repository split. No pre-existing application testing standard; strong defaults applied. |
| Existing design deviations | Reviewed, unchanged semantics, no newly unresolved deviation. Details below. |

Existing design clarifications at `design.md:212-235` remain consistent with
P1 and P2: multiple sender kinds and `personal > receipt > newsletter` precedence
(triage assertions 164–174, 188–200), explicit pending Screener versus rejected
screenedOut (47,77), approved receipts now routed to `paperTrail` in P2 (`PAPER-01`,
triage assertions 176–186), head cursor for shrinking reply queue (226–239),
and pure diagnostics logged by adapters (`src/data/repository.test.ts:72-73`).
These historical signals already have lessons L-001..L-008. No new failures or
deviations were introduced in P2.

## Independent full gate and test integrity

Executed in the real project, exactly as mandated by tasks:

```sh
npm run build && npm run lint && npx vitest run
```

- **Build:** exit 0. TypeScript and Vite production build, 50 transformed modules.
- **Lint:** exit 0 (zero warnings/errors).
- **Tests:** exit 0; **18 files, 207 passed, 0 failed, 0 skipped**.
- **Independent test run:** started 13:06:37, reported duration 36.86s.
- **Baseline before feature:** 0 tests. `git ls-tree -r --name-only 2a7fdae`
  lists only STATE, design, spec and tasks documents.
- **Before repairs (P1):** 161 tests at `0576807`.
- **After P1 repairs:** 192 tests at `f4e2a03` (+31: one F1 regression, 30 F2 cases).
- **After Phase 6 (P2):** 207 tests at `4be27f0` (+15 across `triage.test.ts`,
  `normalize.test.ts`, `ImboxView.test.tsx`, and new `PaperTrailView.test.tsx`).
- **Full-feature delta:** +207 tests across 18 test files.
- No skipped/todo/only test bypasses found. No baseline test deletion or
  weakened assertion. `git diff --check 2a7fdae..4be27f0` passes.
- No test/build dependency was installed for this verification.

Inventory reconciles to 207 across 18 files: seed 2; seed-validation 30;
triage 44; normalization 61; repository 12; provider 7; sanitizer 7; shell 2;
common 5; Imbox 4; Imbox reset 1; Paper Trail 4; Screener 4; Reply Later 3;
Set Aside 4; Feed 4; shortcuts 9; notices 4.

## Discrimination sensor

**Depth:** lightweight, six independent behavior mutations across P1 (M1–M3 at
`f4e2a03`) and P2 (M4–M6 at `4be27f0`). The full real gate passed before
mutation. All P2 mutations ran exclusively inside a detached temporary git
worktree at `/tmp/missiva-verifier-sensor` (`git worktree add --detach /tmp/missiva-verifier-sensor HEAD`
with `node_modules` symlinked to the main repo), restoring between mutations
and removing the worktree via `git worktree remove --force /tmp/missiva-verifier-sensor`.

| ID | Production line mutated in scratch only | Target command | Actual observation |
| --- | --- | --- | --- |
| M1 (P1) | `src/features/imbox/ImboxView.tsx:16`: replace eligible-list lookup with `openId ? state.emails[openId] : undefined` | `npm test -- src/features/imbox/ImboxReset.test.tsx --reporter=dot` | **Killed**, exit 1, 1 failed / 0 passed. `ImboxReset.test.tsx:21:95` fails reader-absence assertion after preceding complete seed/pending/Screener assertions pass. |
| M2 (P1) | `src/data/repository.ts:43`: remove `publish(result.diagnostics)` from `loadSeed()` while retaining healthy state | `npm test -- src/data/seed-validation.test.tsx --reporter=dot` | **Killed**, exit 1, 25 failed / 5 passed. Line 78 gets `[]` rather than exact skip diagnostic; line 125 receives incomplete notice counts; both shell startup/reset fail the banner query at line 145. |
| M3 (P1) | `src/domain/triage.ts:57`: reverse Reply Later queue only in `selectFocusReply` before selecting the cursor | `npm test -- src/domain/triage.test.ts src/features/reply-later/ReplyLater.test.tsx --reporter=dot` | **Killed**, exit 1, 3 failed / 35 passed. Core line 204 receives old instead of new email; progression line 212 fails completed payload; UI line 20 receives older body instead of `Message newer`. |
| M4 (P2 `PAPER-01`) | `src/domain/triage.ts:26`: change `if (kinds.includes('receipt')) return 'paperTrail'` to `return 'imbox'` | `npx vitest run src/domain/triage.test.ts src/features/paper-trail/PaperTrailView.test.tsx --reporter=dot` | **Killed**, exit 1, 7 failed / 41 passed. `triage.test.ts:180` fails exclusive Paper Trail routing (`newForYou` receives receipt emails); `triage.test.ts:197` fails `receipt+newsletter` precedence; `PaperTrailView.test.tsx:23,121` fail because receipt emails are repaired out of Paper Trail. |
| M5 (P2 `PAPER-02`) | `src/domain/triage.ts:41`: change `[sender.name, sender.address, email.subject].some((field) => field.toLowerCase().includes(needle))` to `[sender.name, email.subject].some((field) => field.includes(needle))` | `npx vitest run src/domain/triage.test.ts src/features/paper-trail/PaperTrailView.test.tsx --reporter=dot` | **Killed**, exit 1, 2 failed / 46 passed. `triage.test.ts:344` fails case-insensitive/address search (`'  NORTH rail '` returns `[]` instead of `['older-rail']`); `PaperTrailView.test.tsx:57` fails real-time search box filtering for `'NORTH RAIL'`. |
| M6 (P2 `BNDL-01`/`BNDL-02`) | `src/domain/triage.ts:51`: change `if (!sender.bundled)` to `if (true)` in `selectDisplayEntries` | `npx vitest run src/domain/triage.test.ts src/features/imbox/ImboxView.test.tsx src/features/paper-trail/PaperTrailView.test.tsx --reporter=dot` | **Killed**, exit 1, 3 failed / 49 passed. `triage.test.ts:372` receives unbundled `kind: 'email'` entries instead of `kind: 'bundle'`; `ImboxView.test.tsx:58` finds 2 articles instead of 1 collapsed `Maya Chen (2)` bundle in `New for you`; `PaperTrailView.test.tsx:123` fails collapsed `North Rail (2)` row assertion. |

**Outcome:** **6 injected (3 P1 + 3 P2), 6 killed, 0 survived**. Every kill is
an executed behavioral assertion failure, not a transform/import/compiler
failure. Each mutation was restored before the next, and `/tmp/missiva-verifier-sensor`
was forcefully removed via `git worktree remove --force /tmp/missiva-verifier-sensor`.
Real working tree `git status --porcelain` before and after the P2 sensor matched
identically (`cmp` exit 0: `ISOLATION VERIFIED: PORCELAIN UNCHANGED`), and
`git worktree list` confirmed only the primary worktree at `4be27f0` remained.
No stash operation was used.

## Interactive UAT and limits

The independent verifier did not perform interactive UAT or use a new browser
session, screenshot, viewport measurement, computed-style probe or deployment.
Its evidence is executable RTL/jsdom/domain/repository coverage plus static
CSS/wiring review. Prior author's browser claims are not adopted as independent
evidence.

After P1 independent verification, the orchestrator presented one manual workflow
at a time. The user returned **"Passou"** for each, without additional comments:

| Test | Observable expected outcome | User result |
| --- | --- | --- |
| Imbox | Opening new mail marks it seen, moves it to Previously seen and survives reload. | Passou |
| Screener | Yes routes to Imbox/Feed, No removes mail from active boxes, decisions survive reload. | Passou |
| Reply Later / Focus & Reply | Dock count updates; newest-first messages appear one at a time; completion empties and exits Focus. | Passou |
| Set Aside | Mail leaves Imbox, pile count updates, removal restores its originating box. | Passou |
| Feed | Expanded newsletters appear newest-first in one scrollable column; scrolling does not change Imbox new count. | Passou |

The implementation's P1 and P2 acceptance criteria pass within automated/static
scope. Human judgment of HEY resemblance and end-user visual acceptance remains
unclaimed, not silently converted into automated success. This report does not
mark the spec's subjective success checkboxes or edit its traceability table.

## Closing disposition

- **P1 ACs:** 23/23 pass.
- **P2 ACs (`PAPER-01`, `PAPER-02`, `BNDL-01`, `BNDL-02`):** 4/4 pass.
- **Listed edges:** 5/5 pass (including `personal > receipt > newsletter` multi-classification precedence).
- **Confirmed assumptions:** 15/15 reviewed (12 P1 + 3 P2); structural/visual declarations
  checked statically, behavioral obligations asserted.
- **Original findings:** F1/F2/F3 resolved.
- **Ranked remaining implementation gaps:** none.
- **Gate:** build + lint + 207 tests (18 files) pass with 0 warnings/errors.
- **Sensor:** 6/6 killed (3 P1 + 3 P2), no survivors.
- **Persistent artifact written:** this `validation.md`.
- **Lessons:** no new signal; existing eight lessons left unchanged. No
  lesson added for a clean verification.
- **Traceability recommendation:** orchestrator may mark `PAPER-01`, `PAPER-02`,
  `BNDL-01`, and `BNDL-02` as `Verified` alongside the 23 P1 requirements (27/30
  total Verified); leave the 3 deferred P3 requirements (`BUBBLE-01`, `READ-01`,
  `SPY-01`) as `Pending`.


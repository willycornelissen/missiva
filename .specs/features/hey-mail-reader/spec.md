# HEY-style Mail Reader Specification

## Problem Statement

Traditional inboxes mix urgent personal mail, newsletters, and receipts into one
undifferentiated pile, forcing the user to triage constantly. This feature delivers a
HEY-inspired mail reader that separates mail by intent (Imbox, Feed, Paper Trail),
gatekeeps new senders (The Screener), and gives lightweight "deal with it later" piles
(Reply Later, Set Aside) — reproducing HEY's signature design and interactions as a
front-end prototype over realistic mock data.

## Goals

- [ ] Reproduce HEY's signature triage model (Imbox / Feed / Screener / Paper Trail) with its New-vs-Seen split in a single-user web prototype.
- [ ] Deliver the five P1 interaction patterns (Imbox, Screener, Reply Later + Focus & Reply, Set Aside, Feed) and two P2 interaction patterns (Paper Trail, Bundles) each independently demoable over mock data.
- [ ] Match HEY's visual language closely enough that a HEY user recognizes it (layout, density, states, piles docked at the bottom).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Real email transport (IMAP/SMTP/Gmail API) | Browser cannot open IMAP/SMTP sockets; real transport needs a backend — deferred to a future fullstack feature. All data is mock. |
| Authentication / multi-user / login | Single-user prototype by decision; no accounts, sessions, or OAuth. |
| Sending / composing / replying for real | Prototype has no transport; "Reply" affordances change local state only, they do not send mail. |
| Backend, database, server persistence | Front-end only (React + Vite); state lives in memory/local-storage. |
| Calendar, Journal, Contacts, Workflows, Collections, big-files, send-as | HEY sub-products unrelated to the reader MVP. |
| Bubble Up, Read Together, Spy-pixel blocker | Deferred to P3 (see User Stories), not part of P1/P2. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Mock data source | A bundled static JSON seed of ~40 emails across senders/categories, loaded at startup | No backend; a fixed seed makes every interaction demoable and tests deterministic | y |
| State persistence between reloads | `localStorage` keyed by a schema version; reset-to-seed control available | Lets triage decisions survive refresh without a backend, while staying resettable for demos | y |
| Visual framework | Hand-rolled CSS (CSS Modules) approximating HEY's look; no CSS UI kit | HEY's look is custom; a generic kit would fight the target aesthetic | y |
| Imbox layout density | List rows (sender, subject, snippet, time), grouped under "New for you" and "Previously seen" headers | Mirrors HEY's Imbox with its New/Seen split | y |
| Piles UI (Reply Later / Set Aside) | Docked tiles at the bottom-right of the screen showing a count; click expands the pile | Matches HEY's bottom-docked piles | y |
| Screener decision model | First email from an unknown sender lands in The Screener; user picks Yes (→ Imbox) or No (→ screened-out); choice is remembered per sender | Core HEY Screener behavior | y |
| New sender routing of newsletters | Newsletters from approved senders route to The Feed, not the Imbox | Matches HEY's Feed concept | y |
| Receipt sender routing & precedence | Approved receipt senders route to Paper Trail (`personal > receipt > newsletter`); Paper Trail emails support Reply Later / Set Aside piles and return to Paper Trail | Matches HEY's Paper Trail and preserves personal-first priority | y |
| Paper Trail search | Real-time case-insensitive trimmed substring filter over sender name, sender address, and email subject, with a dedicated empty-search state and clear control | Makes receipts immediately searchable by sender or subject | y |
| Sender bundling scope & seed state | Per-sender `bundled: boolean` (default `false` in seed, persisted in `AppState`) collapses a sender's emails into one expandable row (newest-first when expanded) within each Imbox group (`New for you` / `Previously seen`) and in Paper Trail | Preserves Imbox New/Seen separation while letting users bundle noisy senders live | y |
| Keyboard shortcuts | Minimal set for P1/P2: `j/k` move selection, `e` set aside, `r` reply-later, `y/n` screener decision | Keeps HEY's keyboard-first feel without a full shortcut system | y |
| Animations/transitions | Subtle slide/fade when mail moves between piles/boxes; respect `prefers-reduced-motion` | HEY feels animated; accessibility guard required | y |
| Mail body rendering | Render sanitized mock HTML/plain-text bodies; remote images shown inline (no spy-pixel blocking in P1) | Spy-pixel blocking is P3; sanitization still required for safety | y |
| Empty states | Each box/pile shows a dedicated empty-state message and illustration placeholder | HEY uses friendly empty states; prevents blank screens | y |
| Routing | Client-side routes: `/imbox`, `/feed`, `/paper-trail`, `/screener`, `/reply-later`, `/set-aside` | Deep-linkable boxes aid demo and testing | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: The Imbox with New / Seen states ⭐ MVP

**User Story**: As a user, I want a focused Imbox that separates new mail from mail I've
already seen, so that important immediate mail stays front-and-center.

**Why P1**: The Imbox is HEY's core surface; every other feature routes to or from it.

**Acceptance Criteria** (each line is one EARS pattern):

1. The system SHALL render the Imbox as two ordered groups, "New for you" above "Previously seen".  <!-- ubiquitous -->
2. WHEN the user opens an email in the "New for you" group THEN the system SHALL move that email to "Previously seen" and mark it seen.  <!-- event-driven -->
3. WHILE an email is unseen the system SHALL display it with an unseen indicator distinct from seen emails.  <!-- state-driven -->
4. WHEN the Imbox has no new emails THEN the system SHALL show a dedicated empty "New for you" state instead of an empty list.  <!-- event-driven -->
5. IF a stored email references an unknown schema version THEN the system SHALL fall back to the bundled seed and surface a non-blocking notice.  <!-- unwanted-behavior -->

**Independent Test**: Load the app, see seeded emails split into New/Seen; open a new email and watch it drop into "Previously seen".

---

### P1: The Screener ⭐ MVP

**User Story**: As a user, I want to approve or reject first-time senders, so that only
people I allow can reach my Imbox.

**Why P1**: The Screener is HEY's signature gatekeeper and defines what reaches the Imbox.

**Acceptance Criteria**:

1. WHEN an email arrives from a sender with no prior decision THEN the system SHALL place it in The Screener and keep it out of the Imbox and Feed.  <!-- event-driven -->
2. WHEN the user approves a screened sender THEN the system SHALL move that sender's current and future emails into the Imbox (or Feed for newsletters).  <!-- event-driven -->
3. WHEN the user rejects a screened sender THEN the system SHALL remove that sender's emails from active boxes and suppress future emails from them.  <!-- event-driven -->
4. The system SHALL persist each per-sender screening decision so a sender is screened only once.  <!-- ubiquitous -->
5. WHEN The Screener has no pending senders THEN the system SHALL show a dedicated empty Screener state.  <!-- event-driven -->

**Independent Test**: With seeded unknown senders in The Screener, approve one and see its mail appear in the Imbox; reject another and see it disappear.

---

### P1: Reply Later + Focus & Reply ⭐ MVP

**User Story**: As a user, I want to stash emails that need a reply into a pile and later
work through them one by one, so that I can reply in a focused batch.

**Why P1**: Reply Later + Focus & Reply is a defining HEY workflow for handling email debt.

**Acceptance Criteria**:

1. WHEN the user marks an email "Reply Later" THEN the system SHALL add it to the Reply Later pile docked at the bottom of the screen.  <!-- event-driven -->
2. The system SHALL display the Reply Later pile with a visible count of items in it.  <!-- ubiquitous -->
3. WHEN the user enters Focus & Reply THEN the system SHALL present only Reply Later emails, one at a time, newest-first by received time (most recent first).  <!-- event-driven -->
4. WHEN the user finishes an email in Focus & Reply THEN the system SHALL advance to the next Reply Later email until none remain.  <!-- event-driven -->
5. WHEN the Reply Later pile is empty THEN the system SHALL exit Focus & Reply and show an empty-pile state.  <!-- event-driven -->

**Independent Test**: Mark two emails Reply Later, open Focus & Reply, and step through the newest received email first, then the older email, until the pile empties.

---

### P1: Set Aside ⭐ MVP

**User Story**: As a user, I want to set aside emails I'll need to reference later into a
neat pile, so that they're at hand but out of my Imbox.

**Why P1**: Set Aside is HEY's reference pile and pairs with Reply Later as a core triage move.

**Acceptance Criteria**:

1. WHEN the user sets an email aside THEN the system SHALL add it to the Set Aside pile docked at the bottom of the screen.  <!-- event-driven -->
2. The system SHALL display the Set Aside pile with a visible count of items in it.  <!-- ubiquitous -->
3. WHEN the user removes an email from Set Aside THEN the system SHALL return it to its originating box.  <!-- event-driven -->
4. WHILE an email is in Set Aside the system SHALL keep it out of the "New for you" group of the Imbox.  <!-- state-driven -->

**Independent Test**: Set an email aside, confirm it leaves the Imbox and appears in the Set Aside pile with an updated count, then return it.

---

### P1: The Feed ⭐ MVP

**User Story**: As a user, I want newsletters in a separate scrollable feed shown already
open, so that they don't crowd my Imbox.

**Why P1**: The Feed is HEY's dedicated newsletter surface and completes the triage model.

**Acceptance Criteria**:

1. WHEN an approved sender is classified as a newsletter THEN the system SHALL route its emails to The Feed instead of the Imbox.  <!-- event-driven -->
2. The system SHALL render Feed items already expanded, newest first, in a single scrollable column.  <!-- ubiquitous -->
3. WHILE the user scrolls The Feed the system SHALL not mark Feed items as unseen-cleared from any Imbox counter.  <!-- state-driven -->
4. WHEN The Feed has no items THEN the system SHALL show a dedicated empty Feed state.  <!-- event-driven -->

**Independent Test**: Open The Feed and scroll through seeded newsletters rendered already-open with the newest on top.

---

### P2: Paper Trail

**User Story**: As a user, I want receipts and transactional emails in a separate Paper
Trail, so that they stay out of my way but easy to find.

**Why P2**: Valuable triage surface that separates receipts/transactional messages from personal mail and newsletters.

**Acceptance Criteria**:

1. WHEN an approved sender is classified as a receipt without personal classification THEN the system SHALL route its emails to the Paper Trail instead of the Imbox or Feed.  <!-- event-driven -->
2. The system SHALL make Paper Trail emails searchable case-insensitively by sender name, sender email address, and subject, showing a dedicated empty state when no emails match.  <!-- ubiquitous -->

**Independent Test**: Seeded receipts (`North Rail` and `Corner Bookshop`) appear only in the Paper Trail (`/paper-trail`), can be filtered by sender or subject (with a clearable empty-search state), and can round-trip through Reply Later / Set Aside back to Paper Trail.

---

### P2: Bundles

**User Story**: As a user, I want to bundle a dominating sender's emails into one row, so
that a noisy sender takes up minimal space.

**Why P2**: Enhances the Imbox and Paper Trail by collapsing multi-email senders without losing New/Seen separation.

**Acceptance Criteria**:

1. WHEN the user bundles a sender THEN the system SHALL persist that sender's bundled state and collapse that sender's emails into a single expandable row within each Imbox group ("New for you" and "Previously seen") and in the Paper Trail.  <!-- event-driven -->
2. WHEN the user expands a bundle THEN the system SHALL list that sender's emails in that group newest first by received time and allow unbundling or individual email actions.  <!-- event-driven -->

**Independent Test**: Bundle a seeded high-volume sender in the Imbox or Paper Trail, confirm its emails collapse to one expandable row per group, expand it to see emails ordered newest first, and confirm the bundled choice persists across reloads.

---

### P3: Bubble Up

**User Story**: As a user, I want to send an email away and have it return to the top of my
Imbox later, so that I deal with it at the right time.

**Why P3**: Nice-to-have scheduling convenience on top of the core model.

**Acceptance Criteria**:

1. WHEN the user bubbles up an email to a future time THEN the system SHALL hide it until that time and then return it to the top of the Imbox as new.  <!-- event-driven -->

**Independent Test**: Bubble an email to a near-future time (demo clock) and watch it reappear at the top.

---

### P3: Read Together

**User Story**: As a user, I want to open several emails at once and scroll them like a
feed, so that I read a batch efficiently.

**Why P3**: Reading convenience; not required to prove the triage model.

**Acceptance Criteria**:

1. WHEN the user selects multiple emails and chooses Read Together THEN the system SHALL render them stacked in one scrollable view.  <!-- event-driven -->

**Independent Test**: Select three emails, Read Together, and scroll through all three in one view.

---

### P3: Spy-pixel blocker

**User Story**: As a user, I want tracking pixels blocked and flagged, so that senders can't
spy on my opens.

**Why P3**: Privacy enhancement layered on top of mail rendering.

**Acceptance Criteria**:

1. WHEN an email body contains a known tracking-pixel pattern THEN the system SHALL block the request and flag the sender as a tracker.  <!-- event-driven -->

**Independent Test**: Open a seeded email containing a tracking-pixel marker and confirm it is blocked and the sender flagged.

---

## Edge Cases

- IF a mock email has a malformed or missing field THEN the system SHALL skip it and log a non-blocking warning rather than crash.  <!-- unwanted-behavior -->
- IF an email body contains unsafe HTML THEN the system SHALL sanitize it before rendering.  <!-- unwanted-behavior -->
- WHEN the same email is targeted by two conflicting piles (Reply Later and Set Aside) THEN the system SHALL keep it in the most recently chosen pile only.  <!-- event-driven -->
- IF `localStorage` is unavailable or full THEN the system SHALL run from the in-memory seed and warn that triage will not persist.  <!-- unwanted-behavior -->
- WHEN a sender has multiple classifications THEN the system SHALL route by precedence `personal > receipt > newsletter` (`imbox` > `paperTrail` > `feed`).  <!-- event-driven -->

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IMBOX-01 | P1: The Imbox | T4 core / T15 UI | Verified |
| IMBOX-02 | P1: The Imbox | T4 core / T15 UI | Verified |
| IMBOX-03 | P1: The Imbox | T4 core / T14-T15 UI | Verified |
| IMBOX-04 | P1: The Imbox | T4 selector / T15 UI | Verified |
| IMBOX-05 | P1: The Imbox | T9-T11 guard/repository/store complete / T20 notice / T22 seed fallback repair complete | Verified |
| SCRN-01 | P1: The Screener | T5 core / T16 UI / T21 reset-reader repair complete | Verified |
| SCRN-02 | P1: The Screener | T5 core / T16 UI | Verified |
| SCRN-03 | P1: The Screener | T5 core / T16 UI | Verified |
| SCRN-04 | P1: The Screener | T5 state + T10-T11 persistence/wiring complete | Verified |
| SCRN-05 | P1: The Screener | T5 selector / T16 UI | Verified |
| REPLY-01 | P1: Reply Later + Focus & Reply | T7 core / T14-T17 UI | Verified |
| REPLY-02 | P1: Reply Later + Focus & Reply | T7 count / T14-T17 UI | Verified |
| REPLY-03 | P1: Reply Later + Focus & Reply | T7 core / T17 UI / T23 newest-first precision repair complete | Verified |
| REPLY-04 | P1: Reply Later + Focus & Reply | T7 core / T17 UI | Verified |
| REPLY-05 | P1: Reply Later + Focus & Reply | T7 core / T17 UI | Verified |
| ASIDE-01 | P1: Set Aside | T8 core / T14-T18 UI | Verified |
| ASIDE-02 | P1: Set Aside | T8 count / T14-T18 UI | Verified |
| ASIDE-03 | P1: Set Aside | T8 core / T18 UI | Verified |
| ASIDE-04 | P1: Set Aside | T8 isolation / T15 UI | Verified |
| FEED-01 | P1: The Feed | T5-T6 core / T19 UI | Verified |
| FEED-02 | P1: The Feed | T6 selector / T19 UI | Verified |
| FEED-03 | P1: The Feed | T6 isolation / T19 UI | Verified |
| FEED-04 | P1: The Feed | T6 selector / T19 UI | Verified |
| PAPER-01 | P2: Paper Trail | T25 core + T27 UI | Verified |
| PAPER-02 | P2: Paper Trail | T25 core + T27 UI | Verified |
| BNDL-01 | P2: Bundles | T24 types + T26 core + T28 UI | Verified |
| BNDL-02 | P2: Bundles | T24 types + T26 core + T28 UI | Verified |
| BUBBLE-01 | P3: Bubble Up | T29 core complete / T31 UI | Implementing |
| READ-01 | P3: Read Together | T31 UI | Implementing |
| SPY-01 | P3: Spy-pixel blocker | T30 sanitizer + seed / T32 UI | Implementing |

**ID format:** `[CATEGORY]-[NUMBER]` (e.g., `IMBOX-01`, `SCRN-03`).

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 30 total; 27 P1/P2 requirements Verified; 3 P3 requirements Implementing (T29 complete).

**Execution history:** The entries below preserve each task's result at its
commit; references to pending work are historical, superseded by the final
verification above.
T1 foundation verified with build/lint/test (0 tests).
No user-facing acceptance criterion is complete yet.
T2 models compile; the design records representations for pending mail and the
dual-classification edge. P2 Paper Trail remains deferred.
T3 supplies the bundled 40-email JSON and fresh `buildSeedState()` factory;
seed completeness and demo coverage verified by 2 tests.
T6 verifies the dual-classification edge: personal wins regardless of kind order.
T8 verifies both directions of the most-recent-pile conflict edge and restoration.
T9 verifies unknown-version fallback, explicit notices, skipped malformed
records, invariant repairs, and fresh reset (97 total tests). Malformed-record
warnings are pure diagnostics; adapter logging and visible notices remain T10-T20.
T10 adds durable round-trip/reset, cached in-memory fallback, and observable
logged diagnostics (109 total tests). Unknown version and invalid JSON restore
seed with an explicit notice; failed saves retain triage and signal no-persist.
Visible banners remain T20, not claimed complete by adapter tests.
T11 verifies provider initialization, dispatch/save/reload, complete reset,
startup diagnostics, and live failed-save notices through React consumers
(116 total tests). State and notice hooks are ready for T13-T20; no UI AC or
independent verification is claimed complete.
T12 verifies the sanitizer edge with scripts, event handlers, embedded content,
executable URL variants, safe formatting/links/tables/images, and plain/empty
bodies. The phase boundary build + lint + all 123 tests passed. Rendering-time
integration remains T14/T19; final independent verification remains after T20.
T13 mounts the persistent store and five client routes in a responsive shell;
navigation and empty stored counts verified (125 tests). UI stories remain
Implementing until their views and independent verification are complete.
T14 adds visible unseen indicators, counted bottom-docked pile navigation,
shared empty states, and the sanitized reader seam (130 tests). Row triage
controls exercise real store updates, including single-pile conflict behavior.
T15 integrates IMBOX-01..04 and ASIDE-04/SCRN-01 isolation through the real
route/store. Opening displays the body, persists seen, updates the count, and
returns the row to Previously seen; both empty paths pass (133 tests).
T16 integrates SCRN-01..05: pending sender previews, approve-to-Imbox/Feed,
reject-all-current messages, remembered decision after remount, and empty
Screener (137 tests). Future-mail behavior remains covered by the pure core.
T17 integrates REPLY-01..05 end to end: dock counts, expanded pile, safe
reading, newest-first single-message Focus, complete progression/empty exit,
and explicit exit preserving the pile (140 tests). No send operation exists.
T18 integrates ASIDE-01..04 and the conflict edge: counted expansion,
safe reading, original Imbox/Feed restoration with seen state preserved,
and empty Set Aside (144 tests).
T19 integrates FEED-01..04 with actual screening arrival, expanded ordered
sanitized bodies, scroll preserving the complete mailbox state, empty Feed,
and Feed/pile round-trip (148 tests). All five routes are implemented.
T20 completes keyboard selection/triage on all routes (including opened/focused
messages), editable-field guards, exact nonblocking restoration/storage notices,
malformed-mail warning UI, and visible durable reset. Full build + lint +
161 tests passed. Desktop/mobile browser flows and computed reduced-motion
behavior passed. All 23 P1 requirements have task-local evidence; the
orchestrator's independent Verifier must decide final Verified status.
T21 repairs F1: reset after approving/opening a pending sender removes the
ineligible Imbox reader, restores the complete persisted seed, and returns the
sender to Screener. Ordinary open-to-seen still keeps the reader open. Full
build + lint + 162 tests passed; independent re-verification remains pending.
T22 repairs F2's malformed/missing-field edge for raw bundled mail, including
unknown sender references before dereference. Healthy records retain original
IDs/timestamps; first load, every fallback, repository reset and real-shell
reset expose skip diagnostics through repository logging/notices. Shared pure
guards introduce no dependency cycle; core stays side-effect-free. Full build
+ lint + 192 tests passed, including all original 161 tests. Independent
re-verification remains pending; no Verified status is claimed.
T23 resolves F3 with the user's explicit newest-first-by-received-time choice.
The AC now matches the approved design and existing tests; behavior is unchanged.
Final build + lint + all 192 tests passed (17 files, none failed/skipped).
T21-T23 are complete; the orchestrator owns fresh independent re-verification.
T24-T28 implement P2 Paper Trail (`PAPER-01`, `PAPER-02`) and Sender Bundles (`BNDL-01`, `BNDL-02`): receipt routing with `personal > receipt > newsletter` precedence, Paper Trail pile round-trip, real-time sender/address/subject search with clearable no-match state, and per-sender expandable bundles in Imbox groups and Paper Trail. Independent P2 Verifier (`author != verifier`) confirmed PASS across all 27 P1+P2 ACs, 207 tests (18 files), and 3/3 P2 discrimination mutations (`M4`–`M6`) killed in an isolated worktree.

---

## Success Criteria

How we know the feature is successful:

- [ ] A user can triage a seeded Imbox end-to-end: open new mail, screen a sender, reply-later, set-aside, and read the Feed — without a page reload breaking state.
- [ ] All five P1 stories are independently demoable from their own route.
- [ ] A HEY user shown the prototype recognizes the Imbox New/Seen split, The Screener, the bottom-docked piles, and The Feed as HEY-like.
- [ ] Zero unhandled runtime errors while exercising the P1 flows over the bundled seed.

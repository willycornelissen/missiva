# HEY-style Mail Reader Specification

## Problem Statement

Traditional inboxes mix urgent personal mail, newsletters, and receipts into one
undifferentiated pile, forcing the user to triage constantly. This feature delivers a
HEY-inspired mail reader that separates mail by intent (Imbox, Feed, Paper Trail),
gatekeeps new senders (The Screener), and gives lightweight "deal with it later" piles
(Reply Later, Set Aside) — reproducing HEY's signature design and interactions as a
front-end prototype over realistic mock data.

## Goals

- [ ] Reproduce HEY's signature triage model (Imbox / Feed / Screener) with its New-vs-Seen split in a single-user web prototype.
- [ ] Deliver the five P1 interaction patterns (Imbox, Screener, Reply Later + Focus & Reply, Set Aside, Feed) each independently demoable over mock data.
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
| Paper Trail, Bundles, Bubble Up, Read Together, Spy-pixel blocker | Deferred to P2/P3 (see User Stories), not part of P1. |

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
| Keyboard shortcuts | Minimal set for P1: `j/k` move selection, `e` set aside, `r` reply-later, `y/n` screener decision | Keeps HEY's keyboard-first feel without a full shortcut system | y |
| Animations/transitions | Subtle slide/fade when mail moves between piles/boxes; respect `prefers-reduced-motion` | HEY feels animated; accessibility guard required | y |
| Mail body rendering | Render sanitized mock HTML/plain-text bodies; remote images shown inline (no spy-pixel blocking in P1) | Spy-pixel blocking is P3; sanitization still required for safety | y |
| Empty states | Each box/pile shows a dedicated empty-state message and illustration placeholder | HEY uses friendly empty states; prevents blank screens | y |
| Routing | Client-side routes: `/imbox`, `/feed`, `/screener`, `/reply-later`, `/set-aside` | Deep-linkable boxes aid demo and testing | y |

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
3. WHEN the user enters Focus & Reply THEN the system SHALL present only Reply Later emails, one at a time, in order.  <!-- event-driven -->
4. WHEN the user finishes an email in Focus & Reply THEN the system SHALL advance to the next Reply Later email until none remain.  <!-- event-driven -->
5. WHEN the Reply Later pile is empty THEN the system SHALL exit Focus & Reply and show an empty-pile state.  <!-- event-driven -->

**Independent Test**: Mark two emails Reply Later, open Focus & Reply, and step through both until the pile empties.

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

**Why P2**: Valuable triage surface, but the Imbox/Feed/Screener trio already proves the model.

**Acceptance Criteria**:

1. WHEN an email is classified as a receipt or transactional message THEN the system SHALL route it to the Paper Trail.  <!-- event-driven -->
2. The system SHALL make Paper Trail emails searchable by sender and subject.  <!-- ubiquitous -->

**Independent Test**: Seeded receipts appear only in the Paper Trail and can be found by search.

---

### P2: Bundles

**User Story**: As a user, I want to bundle a dominating sender's emails into one row, so
that a noisy sender takes up minimal space.

**Why P2**: Enhances the Imbox but isn't needed to demonstrate the core triage model.

**Acceptance Criteria**:

1. WHEN the user bundles a sender THEN the system SHALL collapse that sender's emails into a single expandable row.  <!-- event-driven -->
2. WHEN the user expands a bundle THEN the system SHALL list that sender's emails newest first.  <!-- event-driven -->

**Independent Test**: Bundle a seeded high-volume sender and confirm it collapses to one expandable row.

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
- WHEN a sender appears in both newsletter and personal classifications THEN the system SHALL treat it as personal (Imbox) by default.  <!-- event-driven -->

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| IMBOX-01 | P1: The Imbox | T4 core / T15 UI | Implementing |
| IMBOX-02 | P1: The Imbox | T4 core / T15 UI | Implementing |
| IMBOX-03 | P1: The Imbox | T4 core / T14-T15 UI | Implementing |
| IMBOX-04 | P1: The Imbox | T4 selector / T15 UI | Implementing |
| IMBOX-05 | P1: The Imbox | T9-T11 guard/repository/store complete / T20 notice | Implementing |
| SCRN-01 | P1: The Screener | T5 core / T16 UI | Implementing |
| SCRN-02 | P1: The Screener | T5 core / T16 UI | Implementing |
| SCRN-03 | P1: The Screener | T5 core / T16 UI | Implementing |
| SCRN-04 | P1: The Screener | T5 state + T10-T11 persistence/wiring complete | Implementing |
| SCRN-05 | P1: The Screener | T5 selector / T16 UI | Implementing |
| REPLY-01 | P1: Reply Later + Focus & Reply | T7 core / T14-T17 UI | Implementing |
| REPLY-02 | P1: Reply Later + Focus & Reply | T7 count / T14-T17 UI | Implementing |
| REPLY-03 | P1: Reply Later + Focus & Reply | T7 core / T17 UI | Implementing |
| REPLY-04 | P1: Reply Later + Focus & Reply | T7 core / T17 UI | Implementing |
| REPLY-05 | P1: Reply Later + Focus & Reply | T7 core / T17 UI | Implementing |
| ASIDE-01 | P1: Set Aside | T8 core / T14-T18 UI | Implementing |
| ASIDE-02 | P1: Set Aside | T8 count / T14-T18 UI | Implementing |
| ASIDE-03 | P1: Set Aside | T8 core / T18 UI | Implementing |
| ASIDE-04 | P1: Set Aside | T8 isolation / T15 UI | Implementing |
| FEED-01 | P1: The Feed | T5-T6 core / T19 UI | Implementing |
| FEED-02 | P1: The Feed | T6 selector / T19 UI | Implementing |
| FEED-03 | P1: The Feed | T6 isolation / T19 UI | Implementing |
| FEED-04 | P1: The Feed | T6 selector / T19 UI | Implementing |
| PAPER-01 | P2: Paper Trail | - | Pending |
| PAPER-02 | P2: Paper Trail | - | Pending |
| BNDL-01 | P2: Bundles | - | Pending |
| BNDL-02 | P2: Bundles | - | Pending |
| BUBBLE-01 | P3: Bubble Up | - | Pending |
| READ-01 | P3: Read Together | - | Pending |
| SPY-01 | P3: Spy-pixel blocker | - | Pending |

**ID format:** `[CATEGORY]-[NUMBER]` (e.g., `IMBOX-01`, `SCRN-03`).

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 30 total; all 23 P1 requirements mapped with core evidence;
7 deferred P2/P3 requirements remain pending. UI/persistence and independent
verification remain outstanding for P1.
Task-local assertion evidence is recorded under each completed task in `tasks.md`;
Implementing means core covered, not full UI acceptance or independent verification.

**Execution progress:** T1 foundation verified with build/lint/test (0 tests).
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

---

## Success Criteria

How we know the feature is successful:

- [ ] A user can triage a seeded Imbox end-to-end: open new mail, screen a sender, reply-later, set-aside, and read the Feed — without a page reload breaking state.
- [ ] All five P1 stories are independently demoable from their own route.
- [ ] A HEY user shown the prototype recognizes the Imbox New/Seen split, The Screener, the bottom-docked piles, and The Feed as HEY-like.
- [ ] Zero unhandled runtime errors while exercising the P1 flows over the bundled seed.

# HEY-style Mail Reader (P2: Paper Trail & Bundles) Context

**Gathered:** 2026-10-16
**Spec:** `.specs/features/hey-mail-reader/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Deliver the two P2 stories of `hey-mail-reader` on top of the verified P1 foundation:
1. **P2: Paper Trail (`PAPER-01`, `PAPER-02`)** — dedicated `/paper-trail` route and box for approved receipt/transactional emails, with real-time search by sender and subject.
2. **P2: Bundles (`BNDL-01`, `BNDL-02`)** — per-sender bundling that collapses a sender's emails into a single expandable row (ordered newest-first when expanded) in the Imbox (within each `New for you` / `Previously seen` group) and in the Paper Trail.

P3 stories (`Bubble Up`, `Read Together`, `Spy-pixel blocker`) remain deferred.

---

## Implementation Decisions

### Paper Trail Routing, Precedence & Piles (`PAPER-01`)

- Approved senders with `kind: 'receipt'` (including seeded senders `North Rail` and `Corner Bookshop`) route to `box: 'paperTrail'` and `originBox: 'paperTrail'`.
- Multi-kind classification precedence for approved senders is `personal > receipt > newsletter`:
  - Any sender with `'personal'` routes to `imbox`.
  - Otherwise, any sender with `'receipt'` (including `['receipt', 'newsletter']`) routes to `paperTrail`.
  - Otherwise, `'newsletter'` routes to `feed`.
- Pending and rejected receipt senders still obey The Screener gatekeeper (`pending` -> `screener`, `rejected` -> `screenedOut`); approving a pending receipt sender routes its emails to `paperTrail`.
- Paper Trail emails support moving to `Reply Later` and `Set Aside` piles (leaving the Paper Trail list while in a pile) and return to `Paper Trail` (`Return to Paper Trail`) when removed from a pile or finished in Focus & Reply.
- Client route `/paper-trail` is added to the sidebar navigation (`AppShell`) with an active item count.

### Paper Trail Search & Reading Experience (`PAPER-02`)

- Real-time, case-insensitive, trimmed substring filter matching **sender name**, **sender email address**, and **email subject**.
- Single chronological list (newest first by `receivedAt`, no `New for you` / `Previously seen` split), opening the shared sanitized `MailReader` on click and supporting keyboard shortcuts (`j`/`k`, `r`, `e`).
- Two distinct empty states in Paper Trail:
  - Dedicated empty-box state when no emails are in the Paper Trail.
  - Dedicated no-matches search state (with a clear-search control) when the Paper Trail has emails but none match the current query.

### Bundles Scope & Interaction (`BNDL-01`, `BNDL-02`)

- Bundling applies in **The Imbox** (grouping a bundled sender's emails separately within `New for you` and within `Previously seen` so the New/Seen boundary remains intact) and in **Paper Trail**.
- When a sender has `bundled: true`, their emails in a list section collapse into a single expandable bundle row positioned at the timestamp of the newest email in that group, displaying sender identity, message count, newest subject/snippet, and controls to expand/collapse or unbundle.
- Expanding a bundle row lists that sender's emails in that section ordered **newest first** (`receivedAt` descending), allowing each email to be opened or triaged (`Reply Later`, `Set Aside`) individually.
- Users can toggle bundling (`Bundle sender` / `Unbundle sender`) from email/reader actions and from the bundle row header.

### Bundles Persistence & Seed State

- `Sender` includes `bundled?: boolean` (normalized to `boolean`, defaulting to `false` when omitted in legacy persisted `localStorage` data so existing v1 state upgrades cleanly without losing triage decisions).
- All senders in `seed.ts` start with `bundled: false` by default, enabling live demonstration of bundling a high-volume sender and watching its rows collapse.
- `Reset demo` (`RESET_SEED`) restores all senders to `bundled: false`.

### Agent's Discretion

- Visual styling details of the bundle row badge/chevron and Paper Trail search input within the existing CSS Modules aesthetic.
- Exact copy for empty Paper Trail and empty search-result states.

### Declined / Undiscussed Gray Areas → Assumptions

- None — all 4 feature-specific gray areas were discussed and confirmed by the user.

---

## Specific References

- HEY's Paper Trail box for receipts/transactional mail and HEY's "Bundle this sender" row grouping inside Imbox/Paper Trail.

---

## Deferred Ideas

- None — discussion stayed within the P2 feature scope (`PAPER-01`, `PAPER-02`, `BNDL-01`, `BNDL-02`).

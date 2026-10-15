# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Revalidate open readers against current mailbox eligibility after resetting triage state.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: hey-mail-reader
- evidence: src/features/imbox/ImboxView.tsx:15 (ui)
- last seen: 2026-10-15T13:04:17Z

### L-002 - Validate bundled mail records and sender references before constructing seed state, and surface skipped-record diagnostics through the repository.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `data` · harmful: 0
- features: hey-mail-reader
- evidence: src/data/seed.ts:22 (data)
- last seen: 2026-10-15T13:04:17Z

### L-003 - Keep the Focus and Reply ordering contract explicit and shared with its pile selector.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `triage` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/spec.md:107 (triage)
- last seen: 2026-10-15T13:04:17Z

### L-004 - Represent all sender classifications and apply personal precedence before routing newsletters.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/design.md:194 (domain)
- last seen: 2026-10-15T13:04:17Z

### L-005 - Model pending and rejected mail as distinct locations to preserve screening invariants.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/design.md:197 (domain)
- last seen: 2026-10-15T13:04:17Z

### L-006 - Route approved receipt mail to an accessible P1 box while Paper Trail is deferred.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `triage` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/design.md:199 (triage)
- last seen: 2026-10-15T13:04:18Z

### L-007 - Keep the active index at the head when completing a reply removes it from the remaining queue.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `triage` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/design.md:204 (triage)
- last seen: 2026-10-15T13:04:18Z

### L-008 - Return structured diagnostics from pure mailbox normalization and log and display them in adapters.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `data` · harmful: 0
- features: hey-mail-reader
- evidence: .specs/features/hey-mail-reader/design.md:211 (data)
- last seen: 2026-10-15T13:04:18Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_

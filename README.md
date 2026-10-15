# Missiva

A front-end mail-reader prototype using React, TypeScript, and Vite. Mail and
triage are local demo data; no messages are sent.

Requires Node.js 24 and npm 11.

```sh
npm install
npm run dev
npm run build
npm run lint
npm test
```

Tests use Vitest, jsdom, and React Testing Library. Domain tests are co-located
with pure TypeScript rules in `src/domain`; browser adapters and views live
outside that layer. Approved requirements and tasks live in
`.specs/features/hey-mail-reader/`.

## Core and adapter contract

`src/domain/types.ts` exports the mail/sender/action types and `SCHEMA_VERSION`.
`src/data/seed.ts` exports `seed` and `buildSeedState()` (fresh, deterministic
40-message state). The pure core in `src/domain/triage.ts` exports:

- `reduce(state, action)` for all triage actions, including `RESET_SEED`.
- `routeIncoming(state, email)` for a new message from a registered sender.
  First-time senders must already have a sender record with `decision: 'pending'`.
- `selectImbox`, `selectFeed`, `selectScreener`, `selectPile`, `selectFocusReply`.
  Lists are newest-first; global `state.order` is oldest-first.
- `normalizeState(unknown)` returning `{ state, restoredSeed, diagnostics }`.
  Use it after parsing persisted JSON, before exposing state to the UI.

The repository/store adapter must surface `diagnostics`, not discard them:
`seed-restored` carries the non-blocking "Restored sample mailbox" notice;
`malformed-email` / `malformed-sender` identify skipped records for warnings;
`state-repaired` identifies order, routing, or Focus repair. The core never
logs, accesses storage, or imports browser/React APIs. A missing storage key
should load a fresh seed without a corruption notice; JSON parse and storage
failures are adapter responsibilities.

Sender kinds can be a single kind or an array; personal wins over newsletter.
Approved receipts use Imbox in P1 (Paper Trail UI is deferred). Focus completion
removes the current reply from the remaining queue and marks it seen; its cursor
therefore stays at zero. `selectFocusReply` returns an email or `null`. Removing
or moving the final reply exits Focus. Explicit exit leaves the pile intact.

Persistence, sanitization, and mail-reader views are implemented in later tasks;
the current app is only the foundation shell.

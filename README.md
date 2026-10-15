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

## Storage repository

`src/data/repository.ts` exports `repository` (the browser-session singleton),
`createRepository(getStorage?)`, `MailRepository`, `RepositoryNotice`, and
`STORAGE_KEY` (`missiva.mailbox.v1`). The factory optionally accepts a storage
accessor returning `getItem`/`setItem`, so even access-denied getters are caught.

- `load(): AppState` reads and normalizes once per repository instance, then
  returns independent copies of its session state.
- `save(state): void` retains a copy in memory and writes the complete JSON state.
- `reset(): AppState` writes and returns a fresh seed; unrelated keys are untouched.
- `getNotices(): readonly RepositoryNotice[]` is a stable snapshot until new
  notices arrive. `subscribe(listener)` observes changes and returns unsubscribe.
  Read the snapshot after subscribing so load-time notices are not missed.

All normalization diagnostics are logged with `console.warn(message, notice)`
and retained for the UI. Invalid JSON adds `seed-restored` with
`reason: 'invalid-json'`. Storage failures add `storage-unavailable` with
`operation: 'load' | 'save' | 'reset'` and the message
`Changes won't be saved this session`. Fallback is sticky for that instance:
loading starts from seed; a failed later write retains the latest triage rather
than losing work. Reset still works in memory. Notices remain for the session,
including after successful saves/reset; missing keys produce no notice.

## React store

`src/state/AppStore.tsx` exports `AppStoreProvider`, `useAppState()`,
`useDispatch()`, and `useAppNotices()`. Mount the provider once around the app.
It uses the browser `repository` by default; tests can supply an isolated
`repository={createRepository(...)}`. Keep that adapter stable for the mount.

The provider initializes from `load()`, delegates every `TriageAction` to the
pure reducer, and saves on mount and every state change. Dispatch
`{ type: 'RESET_SEED' }` to restore all seed fields and persist them through the
same effect. Views must not access storage or call repository reset directly.
`useAppNotices()` subscribes to the repository's current notice snapshot,
including startup repairs and failures arising during later save effects.
The eventual non-blocking banner should render notice messages from this hook.
Hooks require the provider. No banner or mail-reader UI is implemented here.

## Email body rendering

`src/lib/sanitize.ts` exports `sanitizeHtml(raw: string): string`, wrapping
DOMPurify with its HTML-only profile. Scripts, event handlers, executable URLs,
and active non-HTML content are removed. Safe formatting, HTTPS links, tables,
plain text, and inline remote images are retained (pixel blocking is not P1).
Views must call this at every email HTML render seam and must not append raw
markup after sanitizing. The helper needs a browser DOM (jsdom in tests).

Mail-reader views and their sanitizer integration are implemented in T13-T20;
the current app is still only the foundation shell.

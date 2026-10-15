# Missiva

A front-end mail-reader prototype using React, TypeScript, and Vite. Mail and
triage are local demo data; no messages are sent.

## Take a look around

- **The Imbox** (`/imbox`): New for you sits above Previously seen. Open a row
  to read it and mark it seen; use **Back to mail** to return.
- **The Screener** (`/screener`): preview first-time senders, then choose Yes
  or No. Approved newsletters go to The Feed; personal mail and receipts go
  to Imbox. Rejections suppress all mail from that sender.
- **Reply Later** (`/reply-later`): use a row's ↩ action or the reader toolbar,
  then open the counted bottom tile. **Focus & Reply** shows one message at a
  time, newest first. **Finish & next** marks it handled and seen, restores
  its original box, and advances. Nothing is composed or sent. **Exit focus**
  keeps the remaining pile.
- **Set Aside** (`/set-aside`): use the ▱ action to keep a reference nearby.
  Open the bottom tile to read or return messages to their original box.
  Moving an email between piles always keeps only the latest assignment.
- **The Feed** (`/feed`): newsletters are already open in one scrollable
  column. Reading or scrolling does not clear Imbox counts.

Use **Reset demo** in the top bar to restore all 40 sample emails and screening
decisions. This overwrites only the local demo mailbox, not other browser data.
Triage survives reloads when browser storage is available. A nonblocking
notice explains seed restoration, skipped malformed mail, or storage failures;
after a storage failure, current-session triage and reset still work in memory.

### Keyboard and accessibility

| Key | Action |
| --- | --- |
| `j` / `k` | Select next / previous message or screened sender |
| `r` | Put selected/open message in Reply Later |
| `e` | Put selected/open message in Set Aside |
| `y` / `n` | Approve / reject selected screened sender |

With no selection, `j` selects the first item and `k` the last. Selection stops
at the ends; `Enter` opens a focused row button. In a reader or Focus & Reply,
`r`/`e` target only the displayed message and `j`/`k` do not change it.
Shortcuts ignore editable fields, composition, held/repeating keys, and
Ctrl/Alt/Meta/Shift combinations. The top-bar guide is keyboard accessible.
Navigation, actions, safe message links, and a skip-to-mail link also work
with Tab. Motion is opt-in only when `prefers-reduced-motion: no-preference`.
The responsive sidebar becomes horizontally scrollable navigation on phones;
both counted piles remain docked and every view keeps space below its content.

## Development

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
40-message state for the valid bundle), plus `buildSeed()` returning
`{ state, diagnostics }` for adapters. Raw bundled messages are validated before
sender lookup or email construction; invalid fields and unknown senders produce
`malformed-email` diagnostics. Healthy IDs and timestamps retain their original
source indices even when earlier records are skipped. Shared pure content guards
live in `src/domain/validation.ts`; neither seed building nor core normalization
logs. The pure core in `src/domain/triage.ts` exports:

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
should load a fresh seed without a corruption notice; malformed bundled records
still generate skip warnings. JSON parse and storage failures are adapter
responsibilities. Normalization fallback includes seed skip diagnostics.

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

All normalization and seed diagnostics are logged with `console.warn(message, notice)`
and retained for the UI, including first load, fallback, and reset. Invalid JSON adds `seed-restored` with
`reason: 'invalid-json'`. Storage failures add `storage-unavailable` with
`operation: 'load' | 'save' | 'reset'` and the message
`Changes won't be saved this session`. Fallback is sticky for that instance:
loading starts from seed; a failed later write retains the latest triage rather
than losing work. Reset still works in memory. Notices remain for the session,
including after successful saves/reset; missing keys with a valid seed produce no notice.

## React store

`src/state/AppStore.tsx` exports `AppStoreProvider`, `useAppState()`,
`useDispatch()`, and `useAppNotices()`. Mount the provider once around the app.
It uses the browser `repository` by default; tests can supply an isolated
`repository={createRepository(...)}`. Keep that adapter stable for the mount.

The provider initializes from `load()`, delegates triage to the pure reducer,
and saves on mount and every state change. Dispatch `{ type: 'RESET_SEED' }`
to restore all seed fields. The store handles that event through
`repository.reset()` outside the reducer, preserving seed diagnostics and
persistence, then installs the returned state with a pure internal action.
The ordinary save effect also sees the restored state. Views must not access
storage or call repository reset directly.
`useAppNotices()` subscribes to the repository's current notice snapshot,
including startup repairs and failures arising during later save effects.
The non-blocking `NoticeBanner` renders messages from this hook without
discarding diagnostics. Hooks require the provider.

## Email body rendering

`src/lib/sanitize.ts` exports `sanitizeHtml(raw: string): string`, wrapping
DOMPurify with its HTML-only profile. Scripts, event handlers, executable URLs,
and active non-HTML content are removed. Safe formatting, HTTPS links, tables,
plain text, and inline remote images are retained (pixel blocking is not P1).
Views must call this at every email HTML render seam and must not append raw
markup after sanitizing. The helper needs a browser DOM (jsdom in tests).

`EmailBody` is the single HTML-rendering seam used by the reader, screening
preview, Focus & Reply, and Feed. UI uses CSS Modules with shared global
tokens/base styles. Routes and store are composed in `src/app/AppShell.tsx`.
The pure reducer remains the only authority for routing and triage rules.

Deploying this SPA requires a host fallback from client routes to `index.html`.
No service, external account, real send, Paper Trail, search, or backend is
included in this P1 prototype.

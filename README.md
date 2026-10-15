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

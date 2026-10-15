import { buildSeedState } from '../data/seed'
import { SCHEMA_VERSION } from './types'
import type { AppState, BoxKind, Email, NormalizationDiagnostic, NormalizationResult, PileKind, Sender, TriageAction } from './types'

function orderedEmails(state: AppState): Email[] {
  return [...state.order].reverse()
    .flatMap((id) => state.emails[id] ? [state.emails[id]] : [])
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
}

export function selectImbox(state: AppState): { newForYou: Email[]; previouslySeen: Email[] } {
  const emails = orderedEmails(state).filter((email) =>
    state.senders[email.senderId]?.decision === 'approved' && email.box === 'imbox' && email.pile === null)
  return {
    newForYou: emails.filter((email) => !email.seen),
    previouslySeen: emails.filter((email) => email.seen),
  }
}

function destination(sender: Sender): BoxKind {
  if (sender.decision === 'pending') return 'screener'
  if (sender.decision === 'rejected') return 'screenedOut'
  const kinds = Array.isArray(sender.kind) ? sender.kind : [sender.kind]
  return kinds.includes('newsletter') && !kinds.includes('personal') ? 'feed' : 'imbox'
}

export function selectFeed(state: AppState): Email[] {
  return orderedEmails(state).filter((email) =>
    state.senders[email.senderId]?.decision === 'approved' && email.box === 'feed' && email.pile === null)
}

export function selectScreener(state: AppState): Sender[] {
  const senderIds = [...new Set(orderedEmails(state).map((email) => email.senderId))]
  return senderIds.flatMap((id) => state.senders[id]?.decision === 'pending' ? [state.senders[id]] : [])
}

export function routeIncoming(state: AppState, email: Email): AppState {
  const sender = state.senders[email.senderId]
  if (!sender || state.emails[email.id]) return state
  const box = destination(sender)
  const emails = { ...state.emails, [email.id]: { ...email, box, originBox: box, pile: null } }
  return {
    ...state, emails,
    order: [...state.order, email.id].sort((a, b) =>
      Date.parse(emails[a].receivedAt) - Date.parse(emails[b].receivedAt)),
  }
}

export function selectPile(state: AppState, pile: PileKind): Email[] {
  return orderedEmails(state).filter((email) =>
    state.senders[email.senderId]?.decision === 'approved' &&
    (email.box === 'imbox' || email.box === 'feed') && email.pile === pile)
}

export function selectFocusReply(state: AppState): Email | null {
  return state.focusReply.active ? selectPile(state, 'replyLater')[state.focusReply.cursor] ?? null : null
}

function replaceEmail(state: AppState, email: Email): AppState {
  const next = { ...state, emails: { ...state.emails, [email.id]: email } }
  return {
    ...next,
    focusReply: {
      active: next.focusReply.active && selectPile(next, 'replyLater').length > 0,
      cursor: 0,
    },
  }
}

function putInPile(state: AppState, emailId: string, pile: PileKind): AppState {
  const email = state.emails[emailId]
  if (!email || state.senders[email.senderId]?.decision !== 'approved' ||
    (email.box !== 'imbox' && email.box !== 'feed')) return state
  return replaceEmail(state, {
    ...email, pile, originBox: email.pile === null ? email.box : email.originBox,
  })
}

export function reduce(state: AppState, action: TriageAction): AppState {
  switch (action.type) {
    case 'RESET_SEED':
      return buildSeedState()
    case 'SET_ASIDE':
      return putInPile(state, action.emailId, 'setAside')
    case 'REMOVE_FROM_PILE': {
      const email = state.emails[action.emailId]
      if (!email || email.pile === null) return state
      return replaceEmail(state, { ...email, pile: null, box: email.originBox })
    }
    case 'REPLY_LATER':
      return putInPile(state, action.emailId, 'replyLater')
    case 'FOCUS_REPLY_START':
      return { ...state, focusReply: { active: selectPile(state, 'replyLater').length > 0, cursor: 0 } }
    case 'FOCUS_REPLY_NEXT': {
      if (!state.focusReply.active) return state
      const email = selectFocusReply(state)
      if (!email) return { ...state, focusReply: { active: false, cursor: 0 } }
      return replaceEmail(state, { ...email, pile: null, seen: true, box: email.originBox })
    }
    case 'FOCUS_REPLY_EXIT':
      return { ...state, focusReply: { active: false, cursor: 0 } }
    case 'SCREEN_DECIDE': {
      const sender = state.senders[action.senderId]
      if (!sender || sender.decision !== 'pending') return state
      const decided = { ...sender, decision: action.decision }
      const box = destination(decided)
      return {
        ...state,
        senders: { ...state.senders, [sender.id]: decided },
        emails: Object.fromEntries(Object.entries(state.emails).map(([id, email]) => [
          id, email.senderId === sender.id ? { ...email, box, originBox: box, pile: null } : email,
        ])),
      }
    }
    case 'OPEN_EMAIL': {
      const email = state.emails[action.emailId]
      if (!email || email.seen) return state
      return { ...state, emails: { ...state.emails, [email.id]: { ...email, seen: true } } }
    }
    default:
      return state
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return options.some((option) => option === value)
}

const senderKinds = ['personal', 'newsletter', 'receipt'] as const
const boxes = ['imbox', 'feed', 'screener', 'screenedOut', 'paperTrail'] as const

function validSender(value: unknown, id: string): value is Sender {
  return isRecord(value) && nonempty(value.id) && value.id === id &&
    nonempty(value.name) && nonempty(value.address) &&
    oneOf(value.decision, ['pending', 'approved', 'rejected']) &&
    (oneOf(value.kind, senderKinds) || (Array.isArray(value.kind) && value.kind.length > 0 &&
      value.kind.every((kind: unknown) => oneOf(kind, senderKinds))))
}

function validEmail(value: unknown, id: string, senders: AppState['senders']): value is Email {
  return isRecord(value) && nonempty(value.id) && value.id === id &&
    nonempty(value.senderId) && Object.hasOwn(senders, value.senderId) &&
    typeof value.subject === 'string' && typeof value.snippet === 'string' &&
    typeof value.bodyHtml === 'string' && typeof value.seen === 'boolean' &&
    typeof value.receivedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value.receivedAt) &&
    Number.isFinite(Date.parse(value.receivedAt)) &&
    oneOf(value.box, boxes) && oneOf(value.originBox, boxes) &&
    (value.pile === null || oneOf(value.pile, ['replyLater', 'setAside']))
}

export function normalizeState(input: unknown): NormalizationResult {
  const restore = (reason: 'schema-version' | 'invalid-state'): NormalizationResult => ({
    state: buildSeedState(), restoredSeed: true,
    diagnostics: [{ code: 'seed-restored', reason, message: 'Restored sample mailbox' }],
  })
  if (!isRecord(input)) return restore('invalid-state')
  if (input.schemaVersion !== SCHEMA_VERSION) return restore('schema-version')
  if (!isRecord(input.senders) || !isRecord(input.emails) || !Array.isArray(input.order)) {
    return restore('invalid-state')
  }

  const diagnostics: NormalizationDiagnostic[] = []
  const senderEntries: [string, Sender][] = []
  for (const [id, value] of Object.entries(input.senders)) {
    if (!validSender(value, id)) {
      diagnostics.push({ code: 'malformed-sender', senderId: id, message: `Skipped malformed sender "${id}"` })
      continue
    }
    senderEntries.push([id, { ...value, kind: Array.isArray(value.kind) ? [...value.kind] : value.kind }])
  }
  const senders = Object.fromEntries(senderEntries)
  const emailEntries: [string, Email][] = []
  let routingRepaired = false
  for (const [id, value] of Object.entries(input.emails)) {
    if (!validEmail(value, id, senders)) {
      diagnostics.push({ code: 'malformed-email', emailId: id, message: `Skipped malformed email "${id}"` })
      continue
    }
    const box = destination(senders[value.senderId])
    const pile = senders[value.senderId].decision === 'approved' ? value.pile : null
    routingRepaired ||= box !== value.box || box !== value.originBox || pile !== value.pile
    emailEntries.push([id, { ...value, box, originBox: box, pile }])
  }
  if (routingRepaired) {
    diagnostics.push({ code: 'state-repaired', field: 'routing', message: 'Repaired mailbox routing' })
  }
  const emails = Object.fromEntries(emailEntries)
  const knownIds = input.order.filter((id): id is string => typeof id === 'string' && Object.hasOwn(emails, id))
  const order = [...new Set([...knownIds, ...Object.keys(emails)])]
    .sort((a, b) => Date.parse(emails[a].receivedAt) - Date.parse(emails[b].receivedAt))
  if (input.order.length !== order.length || input.order.some((id, index) => id !== order[index])) {
    diagnostics.push({ code: 'state-repaired', field: 'order', message: 'Repaired mailbox receive order' })
  }
  const focus = isRecord(input.focusReply) ? input.focusReply : {}
  const active = focus.active === true && emailEntries.some(([, email]) => email.pile === 'replyLater')
  if (focus.active !== active || focus.cursor !== 0) {
    diagnostics.push({ code: 'state-repaired', field: 'focusReply', message: 'Repaired Focus & Reply state' })
  }
  return {
    state: { schemaVersion: SCHEMA_VERSION, senders, emails, order, focusReply: { active, cursor: 0 } },
    restoredSeed: false,
    diagnostics,
  }
}

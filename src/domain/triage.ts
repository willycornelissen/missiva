import type { AppState, BoxKind, Email, PileKind, Sender, TriageAction } from './types'

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

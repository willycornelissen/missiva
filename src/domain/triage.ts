import type { AppState, Email, TriageAction } from './types'

function orderedEmails(state: AppState): Email[] {
  return [...state.order].reverse()
    .flatMap((id) => state.emails[id] ? [state.emails[id]] : [])
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
}

export function selectImbox(state: AppState): { newForYou: Email[]; previouslySeen: Email[] } {
  const emails = orderedEmails(state).filter((email) => email.box === 'imbox' && email.pile === null)
  return {
    newForYou: emails.filter((email) => !email.seen),
    previouslySeen: emails.filter((email) => email.seen),
  }
}

export function reduce(state: AppState, action: TriageAction): AppState {
  switch (action.type) {
    case 'OPEN_EMAIL': {
      const email = state.emails[action.emailId]
      if (!email || email.seen) return state
      return { ...state, emails: { ...state.emails, [email.id]: { ...email, seen: true } } }
    }
    default:
      return state
  }
}

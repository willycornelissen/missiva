import messages from './seed.json'
import { SCHEMA_VERSION } from '../domain/types'
import type { AppState, BoxKind, Email, NormalizationDiagnostic, Sender } from '../domain/types'
import { validEmailContent } from '../domain/validation'

const senders: Sender[] = [
  { id: 'maya', name: 'Maya Chen', address: 'maya@example.com', kind: 'personal', decision: 'approved' },
  { id: 'studio', name: 'The Quiet Web', address: 'letters@quiet.example', kind: 'newsletter', decision: 'approved' },
  { id: 'rail', name: 'North Rail', address: 'tickets@rail.example', kind: 'receipt', decision: 'approved' },
  { id: 'noah', name: 'Noah de Vries', address: 'noah@example.com', kind: 'personal', decision: 'pending' },
  { id: 'lea', name: 'Lea Martins', address: 'lea@example.com', kind: 'personal', decision: 'approved' },
  { id: 'field', name: 'Field Notes', address: 'hello@field.example', kind: 'newsletter', decision: 'approved' },
  { id: 'bookshop', name: 'Corner Bookshop', address: 'orders@books.example', kind: 'receipt', decision: 'approved' },
  { id: 'omar', name: 'Omar Hassan', address: 'omar@example.com', kind: 'personal', decision: 'approved' },
  { id: 'offers', name: 'Unwanted Offers', address: 'offers@promo.example', kind: 'newsletter', decision: 'rejected' },
  { id: 'club', name: 'Neighbourhood Reading Club', address: 'news@club.example', kind: 'newsletter', decision: 'pending' },
]

export function buildSeed(): { state: AppState; diagnostics: NormalizationDiagnostic[] } {
  const bySender = Object.fromEntries(senders.map((sender) => [sender.id, { ...sender }]))
  const diagnostics: NormalizationDiagnostic[] = []
  const emails = messages.flatMap((message: unknown, index): Email[] => {
    const id = `mail-${String(index + 1).padStart(2, '0')}`
    if (!validEmailContent(message, bySender)) {
      diagnostics.push({ code: 'malformed-email', emailId: id, message: `Skipped malformed email "${id}"` })
      return []
    }
    const sender = bySender[message.senderId]
    const box: BoxKind = sender.decision === 'pending' ? 'screener'
      : sender.decision === 'rejected' ? 'screenedOut'
        : sender.kind === 'receipt' ? 'paperTrail'
          : sender.kind === 'newsletter' ? 'feed' : 'imbox'
    return [{
      senderId: message.senderId, subject: message.subject,
      snippet: message.snippet, bodyHtml: message.bodyHtml, id,
      receivedAt: new Date(Date.UTC(2026, 9, 1, 8 + index * 6)).toISOString(),
      seen: index < 20,
      box,
      originBox: box,
      pile: index === 24 || index === 37 ? 'replyLater' : index === 20 ? 'setAside' : null,
    }]
  })
  return {
    state: {
      schemaVersion: SCHEMA_VERSION,
      senders: bySender,
      emails: Object.fromEntries(emails.map((email) => [email.id, email])),
      order: emails.map((email) => email.id),
      focusReply: { active: false, cursor: 0 },
    },
    diagnostics,
  }
}

export function buildSeedState(): AppState {
  return buildSeed().state
}

export const seed = buildSeedState()

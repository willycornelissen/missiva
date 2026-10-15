export const SCHEMA_VERSION = 1

export type SenderId = string
export type EmailId = string
export type SenderDecision = 'pending' | 'approved' | 'rejected'
export type SenderKind = 'personal' | 'newsletter' | 'receipt'

export interface Sender {
  id: SenderId
  name: string
  address: string
  kind: SenderKind | SenderKind[]
  decision: SenderDecision
}

export type BoxKind = 'imbox' | 'feed' | 'screener' | 'paperTrail' | 'screenedOut'
export type PileKind = 'replyLater' | 'setAside'

export interface Email {
  id: EmailId
  senderId: SenderId
  subject: string
  snippet: string
  bodyHtml: string
  receivedAt: string
  seen: boolean
  box: BoxKind
  pile: PileKind | null
  originBox: BoxKind
}

export interface AppState {
  schemaVersion: number
  senders: Record<SenderId, Sender>
  emails: Record<EmailId, Email>
  /** Receive order, oldest first; selectors present newest first. */
  order: EmailId[]
  focusReply: { active: boolean; cursor: number }
}

export type TriageAction =
  | { type: 'OPEN_EMAIL'; emailId: EmailId }
  | { type: 'SCREEN_DECIDE'; senderId: SenderId; decision: 'approved' | 'rejected' }
  | { type: 'REPLY_LATER'; emailId: EmailId }
  | { type: 'SET_ASIDE'; emailId: EmailId }
  | { type: 'REMOVE_FROM_PILE'; emailId: EmailId }
  | { type: 'FOCUS_REPLY_START' }
  | { type: 'FOCUS_REPLY_NEXT' }
  | { type: 'FOCUS_REPLY_EXIT' }
  | { type: 'RESET_SEED' }

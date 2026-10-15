import type { AppState, Email } from './types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validEmailContent(
  value: unknown, senders: AppState['senders'],
): value is Record<string, unknown> & Pick<Email, 'senderId' | 'subject' | 'snippet' | 'bodyHtml'> {
  return isRecord(value) && nonempty(value.senderId) && Object.hasOwn(senders, value.senderId) &&
    typeof value.subject === 'string' && typeof value.snippet === 'string' &&
    typeof value.bodyHtml === 'string'
}

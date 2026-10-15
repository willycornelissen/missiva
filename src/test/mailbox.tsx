import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../app/AppShell'
import { createRepository } from '../data/repository'
import { buildSeedState } from '../data/seed'
import type { AppState, Email } from '../domain/types'

export function message(id: string, overrides: Partial<Email> = {}): Email {
  return {
    id, senderId: 'maya', subject: `Subject ${id}`, snippet: `Preview ${id}`,
    bodyHtml: `<p>Message ${id}</p>`, receivedAt: '2026-10-10T09:00:00.000Z',
    seen: false, box: 'imbox', originBox: 'imbox', pile: null, ...overrides,
  }
}

export function mailbox(emails: Email[] = []): AppState {
  return { ...buildSeedState(), emails: Object.fromEntries(emails.map((email) => [email.id, email])),
    order: emails.map((email) => email.id).sort((a, b) =>
      Date.parse(emails.find((email) => email.id === a)!.receivedAt) - Date.parse(emails.find((email) => email.id === b)!.receivedAt)) }
}

export function renderMailbox(state: AppState, route = '/imbox') {
  let stored = JSON.stringify(state)
  const repository = createRepository(() => ({
    getItem: () => stored,
    setItem: (_key, value) => { stored = value },
  }))
  return { ...render(<MemoryRouter initialEntries={[route]}><AppShell repository={repository} /></MemoryRouter>),
    repository, storedState: () => JSON.parse(stored) as AppState }
}

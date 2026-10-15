import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../../app/AppShell'
import { createRepository } from '../../data/repository'
import { buildSeedState } from '../../data/seed'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

afterEach(() => vi.restoreAllMocks())

describe('mailbox notices and reset', () => {
  it('surfaces unknown-schema restoration without blocking triage', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    const repository = createRepository(() => ({ getItem: () => '{"schemaVersion":999}', setItem: () => {} }))
    render(<MemoryRouter><AppShell repository={repository} /></MemoryRouter>)
    expect(within(screen.getByRole('status', { name: 'Mailbox notices' })).getByText('Restored sample mailbox')).toBeVisible()
    const row = screen.getAllByRole('article')[0]
    await user.click(within(row).getByRole('button', { name: /Set aside:/ }))
    expect(screen.getByRole('link', { name: 'Set Aside, 2 emails' })).toBeVisible()
    expect(screen.getByRole('status', { name: 'Mailbox notices' })).toBeVisible()
  })

  it('shows a live failed-save warning while preserving current triage and working reset', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    let failSave = false
    const repository = createRepository(() => ({
      getItem: () => JSON.stringify(mailbox([message('keep')])),
      setItem: () => { if (failSave) throw new Error('full') },
    }))
    render(<MemoryRouter><AppShell repository={repository} /></MemoryRouter>)
    expect(screen.queryByRole('status', { name: 'Mailbox notices' })).not.toBeInTheDocument()
    failSave = true
    await user.click(screen.getByRole('button', { name: 'Reply later: Subject keep' }))
    expect(screen.getByRole('status', { name: 'Mailbox notices' })).toHaveTextContent("Changes won't be saved this session")
    expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()
    expect(repository.load().emails.keep.pile).toBe('replyLater')
    await user.click(screen.getByRole('button', { name: 'Reset sample mailbox' }))
    expect(repository.load()).toEqual(buildSeedState())
    expect(screen.getByRole('link', { name: 'Reply Later, 2 emails' })).toBeVisible()
    expect(screen.getByRole('status', { name: 'Mailbox notices' })).toHaveTextContent("Changes won't be saved this session")
  })

  it('surfaces skipped malformed mail while keeping healthy messages usable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = mailbox([message('good'), message('bad')])
    const input = { ...state, emails: { ...state.emails, bad: { id: 'bad' } } }
    const repository = createRepository(() => ({ getItem: () => JSON.stringify(input), setItem: () => {} }))
    render(<MemoryRouter><AppShell repository={repository} /></MemoryRouter>)
    expect(screen.getByRole('status', { name: 'Mailbox notices' })).toHaveTextContent('Skipped malformed email "bad"')
    expect(screen.getByRole('article', { name: 'Subject good' })).toBeVisible()
    expect(screen.queryByRole('article', { name: 'Subject bad' })).not.toBeInTheDocument()
  })

  it('restores and persists the complete seed through the visible reset affordance', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox(), '/set-aside')
    await user.click(screen.getByRole('button', { name: 'Reset sample mailbox' }))
    expect(app.storedState()).toEqual(buildSeedState())
    expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
})

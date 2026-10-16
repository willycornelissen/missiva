import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createRepository } from '../data/repository'
import { buildSeedState } from '../data/seed'
import { AppShell } from './AppShell'

describe('mailbox shell', () => {
  it('navigates all five P1 routes inside the persistent shell', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/imbox']}><AppShell repository={createRepository(() => ({
      getItem: () => JSON.stringify(buildSeedState()), setItem: () => {},
    }))} /></MemoryRouter>)
    const nav = screen.getByRole('navigation', { name: 'Mailbox' })
    for (const title of ['The Feed', 'Paper Trail', 'The Screener', 'Reply Later', 'Set Aside', 'The Imbox']) {
      await user.click(within(nav).getByRole('link', { name: new RegExp(title) }))
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible()
      expect(within(nav).getByRole('link', { name: new RegExp(title) })).toHaveAttribute('aria-current', 'page')
    }
  })

  it('redirects unknown routes and loads counts from the store rather than hardcoding seed', () => {
    const empty = { ...buildSeedState(), emails: {}, order: [] }
    render(<MemoryRouter initialEntries={['/unknown']}><AppShell repository={createRepository(() => ({
      getItem: () => JSON.stringify(empty), setItem: () => {},
    }))} /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'The Imbox' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('main')).toBeVisible()
  })
})

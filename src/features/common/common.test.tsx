import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createRepository } from '../../data/repository'
import { AppStoreProvider } from '../../state/AppStore'
import { mailbox, message } from '../../test/mailbox'
import { EmailRow, EmptyState, MailReader, PileDock } from './index'
import type { ReactNode } from 'react'

function mount(children: ReactNode, emails = [message('new')]) {
  const state = mailbox(emails)
  return render(<MemoryRouter><AppStoreProvider repository={createRepository(() => ({
    getItem: () => JSON.stringify(state), setItem: () => {},
  }))}>{children}</AppStoreProvider></MemoryRouter>)
}

describe('shared mail components', () => {
  it('shows sender, subject, preview, date and a distinct unseen indicator', () => {
    const email = message('new')
    mount(<EmailRow email={email} sender={mailbox().senders.maya} onOpen={() => {}} />)
    const row = screen.getByRole('article', { name: 'Subject new' })
    expect(within(row).getByText('Maya Chen')).toBeVisible()
    expect(within(row).getByText('Subject new')).toBeVisible()
    expect(within(row).getByText('Preview new')).toBeVisible()
    expect(row.querySelector('time')).toHaveAttribute('dateTime', email.receivedAt)
    expect(within(row).getByLabelText('Unseen')).toBeVisible()
  })

  it('marks seen rows distinctly and lets row actions update actual dock counts', async () => {
    const user = userEvent.setup()
    const email = message('read', { seen: true })
    mount(<><EmailRow email={email} sender={mailbox().senders.maya} onOpen={() => {}} /><PileDock /></>, [email])
    expect(screen.queryByLabelText('Unseen')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Seen')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reply later: Subject read' }))
    expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toHaveAttribute('href', '/reply-later')
    await user.click(screen.getByRole('button', { name: 'Set aside: Subject read' }))
    expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toHaveAttribute('href', '/set-aside')
  })

  it('provides a dedicated empty message and decorative illustration', () => {
    render(<EmptyState title="Nothing new" message="Enjoy a little breathing room." />)
    expect(screen.getByRole('heading', { name: 'Nothing new' })).toBeVisible()
    expect(screen.getByText('Enjoy a little breathing room.')).toBeVisible()
    expect(screen.getByTestId('empty-illustration')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders zero counts for empty piles', () => {
    mount(<PileDock />, [])
    expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()
  })

  it('sanitizes at the reader seam while preserving safe body and sender metadata', () => {
    const email = message('unsafe', { bodyHtml: '<p onclick="alert(1)">Safe <strong>story</strong></p><script>alert(1)</script>' })
    mount(<MailReader email={email} onClose={() => {}} />, [email])
    const body = screen.getByTestId('email-body')
    expect(body.innerHTML).toBe('<p>Safe <strong>story</strong></p>')
    expect(screen.getByText('maya@example.com')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Subject unsafe' })).toBeVisible()
  })

  it('blocks tracking pixels in MailReader, shows Spy pixel blocked notice, and flags the sender (SPY-01)', () => {
    const tracked = message('tracked', {
      bodyHtml: '<p>Tracked dispatch</p><img src="https://pixel.tracker.example/open.gif?id=99" width="1" height="1" alt=""><img src="https://images.example/photo.png" alt="Photo">',
    })
    mount(<><EmailRow email={tracked} sender={mailbox().senders.maya} onOpen={() => {}} /><MailReader email={tracked} onClose={() => {}} /></>, [tracked])
    const body = screen.getByTestId('email-body')
    expect(body.innerHTML).toBe('<p>Tracked dispatch</p><img src="https://images.example/photo.png" alt="Photo">')
    expect(screen.getByText('Spy pixel blocked')).toBeVisible()
    expect(screen.getAllByText('Tracker flagged')).toHaveLength(2)
  })
})


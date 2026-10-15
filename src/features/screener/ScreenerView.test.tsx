import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('The Screener', () => {
  it.each([
    ['noah', 'Noah de Vries', 'imbox', 'The Imbox 2'],
    ['club', 'Neighbourhood Reading Club', 'feed', 'The Feed 2'],
  ])('approves %s and routes all their mail durably', async (senderId, name, destination, navLabel) => {
    const user = userEvent.setup()
    const state = mailbox(['first', 'second'].map((id) => message(id, { senderId, box: 'screener', originBox: 'screener' })))
    const app = renderMailbox(state, '/screener')
    const card = screen.getByRole('article', { name })
    expect(within(card).getByText(state.senders[senderId].address)).toBeVisible()
    await user.click(within(card).getByText('Preview email'))
    expect(within(card).getByTestId('email-body')).toHaveTextContent('Message second')
    await user.click(within(card).getByRole('button', { name: `Yes, let them in: ${name}` }))
    expect(screen.queryByRole('article', { name })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "You're in good company" })).toBeVisible()
    expect(screen.getByRole('link', { name: navLabel })).toBeVisible()
    expect(app.storedState().senders[senderId].decision).toBe('approved')
    for (const id of ['first', 'second']) expect(app.storedState().emails[id].box).toBe(destination)
    const saved = app.storedState()
    app.unmount()
    renderMailbox(saved, '/screener')
    expect(screen.queryByRole('article', { name })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: navLabel })).toBeVisible()
  })

  it('rejects every message from the sender without removing unrelated pending mail', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([
      message('first', { senderId: 'noah', box: 'screener', originBox: 'screener' }),
      message('second', { senderId: 'noah', box: 'screener', originBox: 'screener' }),
      message('other', { senderId: 'club', box: 'screener', originBox: 'screener' }),
    ]), '/screener')
    await user.click(screen.getByRole('button', { name: 'No, thanks: Noah de Vries' }))
    expect(screen.queryByRole('article', { name: 'Noah de Vries' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Neighbourhood Reading Club' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Feed 0' })).toBeVisible()
    expect(app.storedState().senders.noah.decision).toBe('rejected')
    expect(app.storedState().emails.first.box).toBe('screenedOut')
    expect(app.storedState().emails.second.box).toBe('screenedOut')
    expect(app.storedState().senders.club.decision).toBe('pending')
  })

  it('renders a dedicated empty state without decision controls', () => {
    renderMailbox(mailbox(), '/screener')
    expect(screen.getByRole('heading', { name: "You're in good company" })).toBeVisible()
    expect(screen.getByText('No new senders to screen. You decide who gets your attention.')).toBeVisible()
    expect(screen.queryByRole('button', { name: /Yes, let them in/ })).not.toBeInTheDocument()
  })
})

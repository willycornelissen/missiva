import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('Set Aside', () => {
  it('adds from Imbox, expands the counted pile and returns unseen mail to New for you', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([message('reference')]))
    await user.click(screen.getByRole('button', { name: 'Set aside: Subject reference' }))
    expect(screen.queryByRole('article', { name: 'Subject reference' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "You're all caught up" })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Set Aside, 1 email' }))
    expect(screen.getByRole('article', { name: 'Subject reference' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Return to Imbox: Subject reference' }))
    expect(screen.getByRole('heading', { name: 'A little space for later' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'The Imbox 1' }))
    expect(within(screen.getByRole('region', { name: 'New for you' })).getByText('Subject reference')).toBeVisible()
    expect(app.storedState().emails.reference).toEqual(message('reference'))
  })

  it('reads a Feed-origin reference safely and returns it to Feed, never Imbox', async () => {
    const user = userEvent.setup()
    const original = message('newsletter', { senderId: 'studio', box: 'feed', originBox: 'feed', pile: 'setAside' })
    const app = renderMailbox(mailbox([original]), '/set-aside')
    await user.click(screen.getByRole('button', { name: 'Open Subject newsletter' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message newsletter')
    await user.click(screen.getByRole('button', { name: 'Return to Feed: Subject newsletter' }))
    expect(screen.getByRole('heading', { name: 'A little space for later' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Feed 1' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()
    expect(app.storedState().emails.newsletter).toEqual({ ...original, pile: null, seen: true })
  })

  it('moves a reference exclusively into Reply Later when that pile is chosen next', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([message('reference', { pile: 'setAside' })]), '/set-aside')
    await user.click(screen.getByRole('button', { name: 'Reply later: Subject reference' }))
    expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Reply Later, 1 email' }))
    expect(screen.getByRole('article', { name: 'Subject reference' })).toBeVisible()
    expect(app.storedState().emails.reference.pile).toBe('replyLater')
  })

  it('renders the dedicated empty pile', () => {
    renderMailbox(mailbox(), '/set-aside')
    expect(screen.getByRole('heading', { name: 'A little space for later' })).toBeVisible()
    expect(screen.getByText('Tickets, plans, and things worth keeping close. Set them aside here.')).toBeVisible()
    expect(screen.queryByRole('button', { name: /Return to/ })).not.toBeInTheDocument()
  })
})

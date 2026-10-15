import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('Imbox', () => {
  it('orders New above Seen, opens safely, persists seen and moves the row', async () => {
    const user = userEvent.setup()
    const { storedState } = renderMailbox(mailbox([
      message('fresh'), message('read', { seen: true }),
      message('aside', { pile: 'setAside' }),
      message('pending', { senderId: 'noah', box: 'screener', originBox: 'screener' }),
    ]))
    const fresh = screen.getByRole('region', { name: 'New for you' })
    const seen = screen.getByRole('region', { name: 'Previously seen' })
    expect(fresh.compareDocumentPosition(seen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(fresh).getByRole('article', { name: 'Subject fresh' })).toBeVisible()
    expect(within(fresh).getByLabelText('Unseen')).toBeVisible()
    expect(within(seen).getByRole('article', { name: 'Subject read' })).toBeVisible()
    expect(screen.queryByRole('article', { name: 'Subject aside' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Subject pending' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open Subject fresh' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message fresh')
    expect(storedState().emails.fresh.seen).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Back to mail' }))
    expect(within(screen.getByRole('region', { name: 'New for you' })).queryByRole('article')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Previously seen' })).getByRole('article', { name: 'Subject fresh' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()
  })

  it('shows the dedicated no-new state while keeping previously seen mail', () => {
    renderMailbox(mailbox([message('read', { seen: true })]))
    expect(within(screen.getByRole('region', { name: 'New for you' })).getByRole('heading', { name: "You're all caught up" })).toBeVisible()
    expect(within(screen.getByRole('region', { name: 'Previously seen' })).getByText('Subject read')).toBeVisible()
  })

  it('shows both empty states for an entirely empty Imbox', () => {
    renderMailbox(mailbox())
    expect(screen.getByRole('heading', { name: "You're all caught up" })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'A fresh start' })).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})

import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('Reply Later and Focus & Reply', () => {
  it('adds from Imbox, counts the pile and finishes newest-first one at a time until empty', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([
      message('older'), message('newer', { receivedAt: '2026-10-11T09:00:00.000Z' }),
      message('unrelated'),
    ]))
    await user.click(screen.getByRole('button', { name: 'Reply later: Subject older' }))
    await user.click(screen.getByRole('button', { name: 'Reply later: Subject newer' }))
    expect(screen.queryByRole('article', { name: 'Subject newer' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Reply Later, 2 emails' }))
    expect(screen.getAllByRole('article').map((row) => row.getAttribute('aria-label'))).toEqual(['Subject newer', 'Subject older'])
    await user.click(screen.getByRole('button', { name: 'Focus & Reply' }))
    expect(screen.getAllByTestId('email-body')).toHaveLength(1)
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message newer')
    expect(screen.queryByText('Subject older')).not.toBeInTheDocument()
    expect(screen.queryByText('Subject unrelated')).not.toBeInTheDocument()
    expect(screen.getByText('Nothing is sent. Finishing marks this email handled.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Finish & next' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message older')
    expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()
    expect(app.storedState().emails.newer).toEqual(message('newer', { receivedAt: '2026-10-11T09:00:00.000Z', seen: true }))
    await user.click(screen.getByRole('button', { name: 'Finish & next' }))
    expect(screen.getByRole('heading', { name: 'Nothing waiting on you' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Finish & next' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()
    expect(app.storedState().focusReply).toEqual({ active: false, cursor: 0 })
    expect(app.storedState().emails.older).toEqual(message('older', { seen: true }))
  })

  it('opens pile mail and explicitly exits focus without consuming the pile', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([message('waiting', { pile: 'replyLater' })]), '/reply-later')
    await user.click(screen.getByRole('button', { name: 'Open Subject waiting' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message waiting')
    await user.click(screen.getByRole('button', { name: 'Back to mail' }))
    await user.click(screen.getByRole('button', { name: 'Focus & Reply' }))
    await user.click(screen.getByRole('button', { name: 'Exit focus' }))
    expect(within(screen.getByRole('main')).getByRole('article', { name: 'Subject waiting' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()
    expect(app.storedState().focusReply).toEqual({ active: false, cursor: 0 })
    expect(app.storedState().emails.waiting.pile).toBe('replyLater')
  })

  it('does not offer focus for an empty pile', () => {
    renderMailbox(mailbox(), '/reply-later')
    expect(screen.getByRole('heading', { name: 'Nothing waiting on you' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Focus & Reply' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reply Later, 0 emails' })).toBeVisible()
  })
})

import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

const newsletter = (id: string, newer = false) => message(id, {
  senderId: 'studio', box: 'feed', originBox: 'feed',
  receivedAt: newer ? '2026-10-11T09:00:00.000Z' : '2026-10-10T09:00:00.000Z',
})

describe('The Feed', () => {
  it('expands safe bodies newest-first in one column without clearing Imbox counts on scroll', () => {
    const newest = { ...newsletter('new', true), bodyHtml: '<h2>Fresh edition</h2><p onmouseover="alert(1)">Full story</p><script>alert(1)</script>' }
    const state = mailbox([newsletter('old'), newest, message('personal')])
    const app = renderMailbox(state, '/feed')
    const feed = screen.getByRole('region', { name: 'Newsletter feed' })
    expect(within(feed).getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual(['Subject new', 'Subject old'])
    expect(within(feed).getAllByTestId('email-body').map((body) => body.innerHTML)).toEqual(['<h2>Fresh edition</h2><p>Full story</p>', '<p>Message old</p>'])
    expect(within(feed).queryByText('Subject personal')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'The Imbox 1' })).toBeVisible()
    fireEvent.scroll(feed, { target: { scrollTop: 400 } })
    expect(screen.getByRole('link', { name: 'The Imbox 1' })).toBeVisible()
    expect(app.storedState()).toEqual(state)
  })

  it('keeps pending newsletters out and shows a dedicated empty state', () => {
    renderMailbox(mailbox([message('pending', { senderId: 'club', box: 'screener', originBox: 'screener' })]), '/feed')
    expect(screen.getByRole('heading', { name: 'A quiet moment' })).toBeVisible()
    expect(screen.getByText('Your favorite newsletters will unfold here. No rush to catch up.')).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('shows an approved newsletter in Feed rather than Imbox', async () => {
    const user = userEvent.setup()
    renderMailbox(mailbox([message('club', { senderId: 'club', box: 'screener', originBox: 'screener' })]), '/screener')
    await user.click(screen.getByRole('button', { name: 'Yes, let them in: Neighbourhood Reading Club' }))
    await user.click(screen.getByRole('link', { name: 'The Feed 1' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message club')
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()
  })

  it('sets aside an expanded newsletter and restores the same expanded body to Feed', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([newsletter('reference')]), '/feed')
    await user.click(screen.getByRole('button', { name: 'Set aside: Subject reference' }))
    expect(screen.getByRole('heading', { name: 'A quiet moment' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Set Aside, 1 email' }))
    await user.click(screen.getByRole('button', { name: 'Return to Feed: Subject reference' }))
    await user.click(screen.getByRole('link', { name: 'The Feed 1' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message reference')
    expect(app.storedState().emails.reference).toEqual(newsletter('reference'))
    expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()
  })
})

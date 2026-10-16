import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { buildSeedState } from '../../data/seed'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('Paper Trail (PAPER-01..02)', () => {
  it('lists approved receipt emails newest first, opens sanitized body, and returns piled receipts to Paper Trail', async () => {
    const user = userEvent.setup()
    const older = message('rail-old', {
      senderId: 'rail', subject: 'Ticket receipt: Amsterdam to Utrecht',
      box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-08T09:00:00.000Z',
    })
    const newer = message('book-new', {
      senderId: 'bookshop', subject: 'Order confirmation #418',
      bodyHtml: '<p>Thank you for your order</p><script>window.__hack = true</script>',
      box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-10T09:00:00.000Z',
    })
    const imboxMail = message('personal-1', { senderId: 'maya', subject: 'Dinner plans' })
    const app = renderMailbox(mailbox([older, newer, imboxMail]), '/paper-trail')

    expect(screen.getByRole('heading', { level: 1, name: 'Paper Trail' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Paper Trail 2' })).toHaveAttribute('aria-current', 'page')
    const articles = screen.getAllByRole('article')
    expect(articles.map((el) => el.getAttribute('aria-label'))).toEqual([
      'Order confirmation #418',
      'Ticket receipt: Amsterdam to Utrecht',
    ])

    await user.click(screen.getByRole('button', { name: 'Open Order confirmation #418' }))
    expect(screen.getByTestId('email-body')).toHaveTextContent('Thank you for your order')
    expect(screen.getByTestId('email-body').innerHTML).toBe('<p>Thank you for your order</p>')
    expect(app.storedState().emails['book-new'].seen).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Set aside: Order confirmation #418' }))
    expect(screen.getByRole('link', { name: 'Paper Trail 1' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Set Aside, 1 email' }))
    await user.click(screen.getByRole('button', { name: 'Return to Paper Trail: Order confirmation #418' }))
    await user.click(screen.getByRole('link', { name: 'Paper Trail 2' }))
    expect(screen.getByRole('article', { name: 'Order confirmation #418' })).toBeVisible()
  })

  it('filters Paper Trail in real time by sender name, sender address, or subject and clears no-match search', async () => {
    const user = userEvent.setup()
    const railMail = message('rail-1', {
      senderId: 'rail', subject: 'Seat reservation 14A',
      box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-08T09:00:00.000Z',
    })
    const bookMail = message('book-1', {
      senderId: 'bookshop', subject: 'Invoice for field notes',
      box: 'paperTrail', originBox: 'paperTrail', receivedAt: '2026-10-10T09:00:00.000Z',
    })
    renderMailbox(mailbox([railMail, bookMail]), '/paper-trail')

    const search = screen.getByRole('searchbox', { name: 'Search Paper Trail' })
    await user.type(search, 'NORTH RAIL')
    expect(screen.getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual(['Seat reservation 14A'])

    await user.clear(search)
    await user.type(search, 'orders@books.example')
    expect(screen.getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual(['Invoice for field notes'])

    await user.clear(search)
    await user.type(search, 'reservation 14a')
    expect(screen.getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual(['Seat reservation 14A'])

    await user.clear(search)
    await user.type(search, 'nonexistent receipt')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No matching receipts' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('renders a dedicated empty state when Paper Trail has no receipts and receives newly screened receipt senders', async () => {
    const user = userEvent.setup()
    const base = buildSeedState()
    const pendingReceiptState = {
      ...base,
      senders: {
        ...base.senders,
        rail: { ...base.senders.rail, decision: 'pending' as const },
      },
      emails: {
        'pending-rail': {
          ...message('pending-rail', {
            senderId: 'rail', subject: 'Night train booking',
            box: 'screener', originBox: 'screener',
          }),
        },
      },
      order: ['pending-rail'],
    }
    renderMailbox(pendingReceiptState, '/paper-trail')
    expect(screen.getByRole('heading', { name: 'A clean paper trail' })).toBeVisible()

    const nav = screen.getByRole('navigation', { name: 'Mailbox' })
    await user.click(within(nav).getByRole('link', { name: /The Screener/ }))
    await user.click(screen.getByRole('button', { name: 'Yes, let them in: North Rail' }))
    await user.click(within(nav).getByRole('link', { name: 'Paper Trail 1' }))
    expect(screen.getByRole('article', { name: 'Night train booking' })).toBeVisible()
  })
})

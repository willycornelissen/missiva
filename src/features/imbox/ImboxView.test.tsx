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

  it('bundles a sender separately within New for you and Previously seen, expands newest first, persists, and unbundles (BNDL-01..02)', async () => {
    const user = userEvent.setup()
    const mayaOldNew = message('maya-old-new', { senderId: 'maya', subject: 'Older unseen note', receivedAt: '2026-10-08T09:00:00.000Z' })
    const mayaLatestNew = message('maya-latest-new', { senderId: 'maya', subject: 'Latest unseen note', receivedAt: '2026-10-10T09:00:00.000Z' })
    const mayaSeen = message('maya-seen', { senderId: 'maya', subject: 'Earlier seen note', seen: true, receivedAt: '2026-10-07T09:00:00.000Z' })
    const { storedState } = renderMailbox(mailbox([mayaOldNew, mayaLatestNew, mayaSeen]))

    const fresh = screen.getByRole('region', { name: 'New for you' })
    const seen = screen.getByRole('region', { name: 'Previously seen' })
    expect(within(fresh).getAllByRole('article')).toHaveLength(2)

    await user.click(within(fresh).getAllByRole('button', { name: 'Bundle Maya Chen' })[0])
    expect(storedState().senders.maya.bundled).toBe(true)

    expect(within(fresh).getAllByRole('article')).toHaveLength(1)
    expect(within(fresh).getByRole('article', { name: 'Maya Chen (2)' })).toBeVisible()
    expect(within(seen).getByRole('article', { name: 'Maya Chen (1)' })).toBeVisible()

    await user.click(within(fresh).getByRole('button', { name: 'Expand bundle from Maya Chen (2)' }))
    const expandedGroup = within(fresh).getByRole('group', { name: 'Bundled emails from Maya Chen' })
    expect(within(expandedGroup).getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual([
      'Latest unseen note',
      'Older unseen note',
    ])

    await user.click(within(fresh).getAllByRole('button', { name: 'Unbundle Maya Chen' })[0])
    expect(storedState().senders.maya.bundled).toBe(false)
    expect(within(fresh).getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual([
      'Latest unseen note',
      'Older unseen note',
    ])
  })

  it('bubbles up an email until a scheduled time and returns it to the top of New for you when released (BUBBLE-01)', async () => {
    const user = userEvent.setup()
    const olderSeen = message('older-seen', { subject: 'Follow up on contract', seen: true, receivedAt: '2026-10-08T09:00:00.000Z' })
    const newerNew = message('newer-new', { subject: 'Latest update', seen: false, receivedAt: '2026-10-10T09:00:00.000Z' })
    const { storedState } = renderMailbox(mailbox([olderSeen, newerNew]))

    const seenSection = screen.getByRole('region', { name: 'Previously seen' })
    expect(within(seenSection).getByRole('article', { name: 'Follow up on contract' })).toBeVisible()

    await user.click(within(seenSection).getByRole('button', { name: 'Bubble up: Follow up on contract' }))
    expect(storedState().emails['older-seen'].bubbledUntil).toBeTruthy()
    expect(within(seenSection).queryByRole('article', { name: 'Follow up on contract' })).not.toBeInTheDocument()

    const bubbledTray = screen.getByRole('region', { name: 'Bubbled Up' })
    expect(within(bubbledTray).getByText('Follow up on contract')).toBeVisible()

    await user.click(within(bubbledTray).getByRole('button', { name: 'Release bubbled mail' }))
    expect(screen.queryByRole('region', { name: 'Bubbled Up' })).not.toBeInTheDocument()

    const freshSection = screen.getByRole('region', { name: 'New for you' })
    expect(within(freshSection).getAllByRole('article').map((el) => el.getAttribute('aria-label'))).toEqual([
      'Follow up on contract',
      'Latest update',
    ])
    expect(storedState().emails['older-seen'].seen).toBe(false)
    expect(storedState().emails['older-seen'].bubbledUntil).toBeFalsy()
  })

  it('opens multiple selected emails stacked in a single Read Together scrollable view and marks them seen (READ-01)', async () => {
    const user = userEvent.setup()
    const first = message('first', { subject: 'First briefing', bodyHtml: '<p>Body of first briefing</p>', receivedAt: '2026-10-10T11:00:00.000Z' })
    const second = message('second', { subject: 'Second briefing', bodyHtml: '<p>Body of second briefing</p><script>alert(1)</script>', receivedAt: '2026-10-10T10:00:00.000Z' })
    const third = message('third', { subject: 'Third briefing', bodyHtml: '<p>Body of third briefing</p>', receivedAt: '2026-10-10T09:00:00.000Z' })
    const { storedState } = renderMailbox(mailbox([first, second, third]))

    await user.click(screen.getByRole('checkbox', { name: 'Select First briefing' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Second briefing' }))

    await user.click(screen.getByRole('button', { name: 'Read together (2)' }))

    const reader = screen.getByRole('region', { name: 'Read Together' })
    const articles = within(reader).getAllByRole('article')
    expect(articles.map((el) => el.getAttribute('aria-label'))).toEqual([
      'First briefing',
      'Second briefing',
    ])
    expect(within(reader).getByText('Body of first briefing')).toBeVisible()
    expect(within(reader).getByText('Body of second briefing')).toBeVisible()
    expect(reader.querySelector('script')).toBeNull()
    expect(storedState().emails.first.seen).toBe(true)
    expect(storedState().emails.second.seen).toBe(true)
    expect(storedState().emails.third.seen).toBe(false)

    await user.click(within(reader).getByRole('button', { name: 'Back to mail' }))
    expect(screen.queryByRole('region', { name: 'Read Together' })).not.toBeInTheDocument()
  })
})



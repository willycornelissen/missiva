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
})


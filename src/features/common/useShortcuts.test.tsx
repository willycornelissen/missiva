import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mailbox, message, renderMailbox } from '../../test/mailbox'

describe('mail keyboard shortcuts', () => {
  it('moves with j/k, clamps at boundaries and triages the selected rows with r/e', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([
      message('older'), message('newer', { receivedAt: '2026-10-11T09:00:00.000Z' }),
    ]))
    await user.keyboard('j')
    expect(screen.getByRole('article', { name: 'Subject newer' })).toHaveAttribute('data-selected', 'true')
    await user.keyboard('j')
    expect(screen.getByRole('article', { name: 'Subject older' })).toHaveAttribute('data-selected', 'true')
    await user.keyboard('j')
    expect(screen.getByRole('article', { name: 'Subject older' })).toHaveAttribute('data-selected', 'true')
    await user.keyboard('k')
    expect(screen.getByRole('article', { name: 'Subject newer' })).toHaveAttribute('data-selected', 'true')
    await user.keyboard('r')
    expect(screen.getByRole('link', { name: 'Reply Later, 1 email' })).toBeVisible()
    expect(app.storedState().emails.newer.pile).toBe('replyLater')
    await user.keyboard('je')
    expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toBeVisible()
    expect(app.storedState().emails.older.pile).toBe('setAside')
    expect(screen.getByRole('heading', { name: "You're all caught up" })).toBeVisible()
  })

  it('uses the opened email as the shortcut target and returns to the list', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([message('read')]))
    await user.click(screen.getByRole('button', { name: 'Open Subject read' }))
    await user.keyboard('e')
    expect(screen.queryByTestId('email-body')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set Aside, 1 email' })).toBeVisible()
    expect(app.storedState().emails.read).toEqual(message('read', { seen: true, pile: 'setAside' }))
  })

  it('selects and screens senders with y/n, retaining exact routing and decisions', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([
      message('personal', { senderId: 'noah', box: 'screener', originBox: 'screener' }),
      message('newsletter', { senderId: 'club', box: 'screener', originBox: 'screener', receivedAt: '2026-10-11T09:00:00.000Z' }),
    ]), '/screener')
    await user.keyboard('jy')
    expect(screen.getByRole('link', { name: 'The Feed 1' })).toBeVisible()
    expect(app.storedState().senders.club.decision).toBe('approved')
    expect(app.storedState().emails.newsletter.box).toBe('feed')
    await user.keyboard('jn')
    expect(screen.getByRole('heading', { name: "You're in good company" })).toBeVisible()
    expect(app.storedState().senders.noah.decision).toBe('rejected')
    expect(app.storedState().emails.personal.box).toBe('screenedOut')
    expect(screen.getByRole('link', { name: 'The Imbox 0' })).toBeVisible()
  })

  it.each(['/feed', '/reply-later', '/set-aside'])('supports selection and pile moves on %s', async (route) => {
    const user = userEvent.setup()
    const email = route === '/feed'
      ? message('target', { senderId: 'studio', box: 'feed', originBox: 'feed' })
      : message('target', { pile: route === '/reply-later' ? 'replyLater' : 'setAside' })
    const app = renderMailbox(mailbox([email]), route)
    await user.keyboard(route === '/set-aside' ? 'jr' : 'je')
    expect(app.storedState().emails.target.pile).toBe(route === '/set-aside' ? 'replyLater' : 'setAside')
    expect(within(screen.getByRole('main')).queryByRole('article')).not.toBeInTheDocument()
  })

  it('does not steal input, textarea, select, nested contenteditable, or modified/composing keys', () => {
    const state = mailbox([message('safe')])
    const app = renderMailbox(state)
    render(<><input aria-label="Input" /><textarea aria-label="Textarea" /><select aria-label="Select"><option>Choice</option></select>
      <div contentEditable suppressContentEditableWarning aria-label="Editable"><span>Editable child</span></div></>)
    for (const target of [screen.getByLabelText('Input'), screen.getByLabelText('Textarea'), screen.getByLabelText('Select'), screen.getByText('Editable child')]) {
      for (const key of ['j', 'k', 'e', 'r', 'y', 'n']) fireEvent.keyDown(target, { key })
    }
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }]) {
      fireEvent.keyDown(document, { key: 'j', ...modifiers })
      fireEvent.keyDown(document, { key: 'e', ...modifiers })
    }
    expect(app.storedState()).toEqual(state)
    expect(screen.getByRole('article', { name: 'Subject safe' })).toHaveAttribute('data-selected', 'false')
    expect(screen.getByRole('link', { name: 'Set Aside, 0 emails' })).toBeVisible()
  })

  it('ignores keys on empty views and makes the shortcut guide accessible', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox())
    await user.keyboard('jker yn')
    expect(app.storedState()).toEqual(mailbox())
    await user.click(screen.getByText('Keyboard shortcuts'))
    expect(screen.getByText('Next / previous message')).toBeVisible()
    expect(screen.getByText('Approve / reject sender')).toBeVisible()
  })

  it('moves a focused reply aside without skipping the next or leaving empty Focus active', async () => {
    const user = userEvent.setup()
    const app = renderMailbox(mailbox([
      message('old', { pile: 'replyLater' }),
      message('new', { pile: 'replyLater', receivedAt: '2026-10-11T09:00:00.000Z' }),
    ]), '/reply-later')
    await user.click(screen.getByRole('button', { name: 'Focus & Reply' }))
    await user.keyboard('e')
    expect(screen.getByTestId('email-body')).toHaveTextContent('Message old')
    await user.keyboard('e')
    expect(screen.getByRole('heading', { name: 'Nothing waiting on you' })).toBeVisible()
    expect(app.storedState().focusReply).toEqual({ active: false, cursor: 0 })
    expect(screen.getByRole('link', { name: 'Set Aside, 2 emails' })).toBeVisible()
  })
})

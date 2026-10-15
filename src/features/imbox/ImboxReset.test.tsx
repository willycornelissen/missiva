import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { buildSeedState } from '../../data/seed'
import { renderMailbox } from '../../test/mailbox'

it('removes a newly approved reader when reset returns its sender to Screener', async () => {
  const user = userEvent.setup()
  const seed = buildSeedState()
  const app = renderMailbox(seed, '/screener')
  await user.click(screen.getByRole('button', { name: 'Yes, let them in: Noah de Vries' }))
  await user.click(screen.getByRole('link', { name: /The Imbox \d+/ }))
  await user.click(screen.getByRole('button', { name: 'Open Community garden introduction' }))
  expect(screen.getByRole('region', { name: 'Reading Community garden introduction' })).toBeVisible()
  expect(app.storedState().senders.noah.decision).toBe('approved')

  await user.click(screen.getByRole('button', { name: 'Reset sample mailbox' }))
  expect(app.storedState()).toEqual(seed)
  expect(app.storedState().senders.noah.decision).toBe('pending')
  expect(app.storedState().emails['mail-04'].box).toBe('screener')
  expect(screen.queryByRole('region', { name: 'Reading Community garden introduction' })).not.toBeInTheDocument()
  expect(screen.queryByTestId('email-body')).not.toBeInTheDocument()
  expect(screen.queryByRole('article', { name: 'Community garden introduction' })).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'New for you' })).toBeVisible()

  await user.click(screen.getByRole('link', { name: /The Screener \d+/ }))
  const noah = screen.getByRole('article', { name: 'Noah de Vries' })
  expect(noah).toBeVisible()
  expect(within(noah).getByRole('button', { name: 'Yes, let them in: Noah de Vries' })).toBeVisible()
})

import { expect, test } from '@playwright/test'

/**
 * Ticket-Nachrichtenansicht: Positionierung, Scrollverhalten, Layout-Stabilität.
 *
 * Da kein authentifiziertes Backend verfügbar ist, testen wir die Komponenten
 * über gemockte API-Antworten, die direkt in die Seite injiziert werden.
 */

// Hilfsdaten: simulierte Ticket-Detail-Antwort
const MOCK_USER_ID = '111111111111111111'
const MOCK_ADMIN_ID = '789555434201677824'

function mockTicketDetail(messageCount = 5) {
  const messages = []
  for (let i = 1; i <= messageCount; i++) {
    messages.push({
      id: i,
      author_id: i % 2 === 1 ? MOCK_USER_ID : MOCK_ADMIN_ID,
      author_name: i % 2 === 1 ? 'TestUser' : 'AdminUser',
      is_admin: i % 2 === 0,
      message: `Nachricht ${i} – ${'Lorem ipsum dolor sit amet. '.repeat(3)}`,
      created_at: new Date(Date.now() - (messageCount - i) * 60000).toISOString(),
    })
  }
  return {
    id: 1,
    ticket_number: 'T-0001',
    user_id: MOCK_USER_ID,
    user_name: 'TestUser',
    subject: 'Test-Ticket',
    category: 'Allgemeine Frage',
    status: 'open',
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages,
  }
}

function mockUserSession(userId: string, isAdmin: boolean) {
  return {
    user: {
      id: userId,
      username: isAdmin ? 'admin' : 'testuser',
      display_name: isAdmin ? 'AdminUser' : 'TestUser',
      avatar_url: '',
    },
  }
}

// Intercept-Helfer: API-Routen mocken
async function setupMockRoutes(
  page: import('@playwright/test').Page,
  userId: string,
  isAdmin: boolean,
  messageCount = 5,
) {
  const ticket = mockTicketDetail(messageCount)

  // Auth-Session
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUserSession(userId, isAdmin)),
    }),
  )

  // Ticket-Liste (User)
  await page.route('**/api/support/tickets?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          user_id: ticket.user_id,
          user_name: ticket.user_name,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        },
      ]),
    }),
  )

  // Ticket-Liste (ohne Query-Params)
  await page.route('**/api/support/tickets', (route) => {
    if (route.request().url().includes('/admin/')) return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          user_id: ticket.user_id,
          user_name: ticket.user_name,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        },
      ]),
    })
  })

  // Ticket-Detail
  await page.route('**/api/support/tickets/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ticket),
    }),
  )

  // Admin-Routen
  await page.route('**/api/support/admin/counters', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: 1, open: 1, in_progress: 0, resolved: 0, closed: 0 }),
    }),
  )

  await page.route('**/api/support/admin/tickets?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          user_id: ticket.user_id,
          user_name: ticket.user_name,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
        },
      ]),
    }),
  )

  await page.route('**/api/support/admin/tickets/1', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ticket),
    }),
  )

  await page.route('**/api/support/admin/tickets/1/user-info', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: MOCK_USER_ID,
        username: 'testuser',
        display_name: 'TestUser',
        avatar_url: null,
        total_tickets: 1,
        open_tickets: 1,
        resolved_tickets: 0,
        closed_tickets: 0,
        last_support_activity: new Date().toISOString(),
      }),
    }),
  )

  await page.route('**/api/support/admin/tickets/1/user-history', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  )

  return ticket
}

const viewports = [
  { name: 'desktop', width: 1536, height: 864 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

// ─── Benutzeransicht ───

test.describe('Benutzer-Ticketansicht – Nachrichtenpositionierung', () => {
  test('Eigene Nachrichten rechts, Support-Nachrichten links', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupMockRoutes(page, MOCK_USER_ID, false)
    await page.goto('/support', { waitUntil: 'networkidle' })

    // Ticket in der Liste anklicken
    await page.getByText('Test-Ticket').first().click()
    await page.waitForTimeout(500)

    // Nachrichten-Bubbles prüfen
    const bubbles = page.locator('.flex.justify-start, .flex.justify-end')
    const count = await bubbles.count()
    expect(count).toBeGreaterThanOrEqual(5)

    // Nachricht 1 (User) → rechts (justify-end)
    const firstBubble = bubbles.first()
    await expect(firstBubble).toHaveClass(/justify-end/)

    // Nachricht 2 (Admin/Support) → links (justify-start)
    const secondBubble = bubbles.nth(1)
    await expect(secondBubble).toHaveClass(/justify-start/)
  })
})

// ─── Adminansicht ───

test.describe('Admin-Ticketansicht – Nachrichtenpositionierung', () => {
  test('Eigene Admin-Nachrichten rechts, Benutzer-Nachrichten links', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await setupMockRoutes(page, MOCK_ADMIN_ID, true)
    await page.goto('/dashboard/tickets', { waitUntil: 'networkidle' })

    // Ticket in der Liste anklicken
    await page.getByText('Test-Ticket').first().click()
    await page.waitForTimeout(500)

    const bubbles = page.locator('.flex.justify-start, .flex.justify-end')
    const count = await bubbles.count()
    expect(count).toBeGreaterThanOrEqual(5)

    // Nachricht 1 (User) → links (justify-start) in Admin-Sicht
    const firstBubble = bubbles.first()
    await expect(firstBubble).toHaveClass(/justify-start/)

    // Nachricht 2 (Admin) → rechts (justify-end) in Admin-Sicht
    const secondBubble = bubbles.nth(1)
    await expect(secondBubble).toHaveClass(/justify-end/)
  })
})

// ─── Layout-Stabilität ───

test.describe('Ticket-Detail Layout-Stabilität', () => {
  test('Bei vielen Nachrichten wächst die Seite nicht unbegrenzt', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupMockRoutes(page, MOCK_USER_ID, false, 50)
    await page.goto('/support', { waitUntil: 'networkidle' })

    await page.getByText('Test-Ticket').first().click()
    await page.waitForTimeout(500)

    // Seitenhöhe darf nicht wesentlich über Viewport hinausgehen
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight)
    // Toleranz: max 20% über Viewport
    expect(bodyHeight).toBeLessThanOrEqual(864 * 1.2)
  })

  test('Scrollbar ist unsichtbar, Scrollen funktioniert', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupMockRoutes(page, MOCK_USER_ID, false, 30)
    await page.goto('/support', { waitUntil: 'networkidle' })

    await page.getByText('Test-Ticket').first().click()
    await page.waitForTimeout(500)

    // Prüfe, dass scrollbar-hide Klasse vorhanden ist
    const messageContainer = page.locator('.scrollbar-hide')
    await expect(messageContainer.first()).toBeVisible()

    // Prüfe, dass der Container scrollbar ist (scrollHeight > clientHeight)
    const isScrollable = await messageContainer.first().evaluate((el) => el.scrollHeight > el.clientHeight)
    expect(isScrollable).toBe(true)
  })

  for (const vp of viewports) {
    test(`Layout stabil auf ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await setupMockRoutes(page, MOCK_USER_ID, false, 20)
      await page.goto('/support', { waitUntil: 'networkidle' })

      await page.getByText('Test-Ticket').first().click()
      await page.waitForTimeout(500)

      // Keine horizontale Scrollbar
      const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(hasHScroll).toBe(false)

      await page.screenshot({
        path: `tests/visual/screenshots/ticket-detail-${vp.name}.png`,
        fullPage: false,
        animations: 'disabled',
      })
    })
  }
})

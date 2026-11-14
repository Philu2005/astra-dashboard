import { expect, test } from '@playwright/test'

/**
 * Ticketerstellung: Zeichenzähler, Tastatursteuerung, Validierung.
 *
 * Gemockte API-Routen, da kein authentifiziertes Backend verfügbar ist.
 */

const MOCK_USER_ID = '111111111111111111'
const SUBJECT_MAX = 200
const DESCRIPTION_MAX = 8000

async function setupAuthRoutes(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: MOCK_USER_ID,
          username: 'testuser',
          display_name: 'TestUser',
          avatar_url: '',
        },
      }),
    }),
  )

  await page.route('**/api/support/tickets?*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/api/support/tickets', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          ticket_number: 'T-0099',
          user_id: MOCK_USER_ID,
          user_name: 'TestUser',
          subject: 'Test-Betreff',
          category: 'Allgemeine Frage',
          status: 'open',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [
            {
              id: 1,
              author_id: MOCK_USER_ID,
              author_name: 'TestUser',
              is_admin: false,
              message: 'Beschreibung des Tickets',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.route('**/api/support/tickets/99', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        ticket_number: 'T-0099',
        user_id: MOCK_USER_ID,
        user_name: 'TestUser',
        subject: 'Test-Betreff',
        category: 'Allgemeine Frage',
        status: 'open',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      }),
    }),
  )
}

test.describe('Ticketerstellung – Zeichenzähler', () => {
  test('Betreff-Zeichenzähler aktualisiert sich live', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const subjectInput = page.locator('input[placeholder="Kurze Zusammenfassung"]')
    await expect(subjectInput).toBeVisible()

    // Anfangszustand: volle Zeichen verbleibend
    const counter = page.locator('text=/ 200 Zeichen verbleibend').first()
    await expect(counter).toContainText(`${SUBJECT_MAX} / ${SUBJECT_MAX} Zeichen verbleibend`)

    // Eingabe und Prüfung
    await subjectInput.fill('Hallo Welt')
    await expect(counter).toContainText(`${SUBJECT_MAX - 10} / ${SUBJECT_MAX} Zeichen verbleibend`)
  })

  test('Beschreibung-Zeichenzähler aktualisiert sich live', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')
    await expect(descInput).toBeVisible()

    const counter = page.locator('text=/ 8000 Zeichen verbleibend').first()
    await expect(counter).toContainText(`${DESCRIPTION_MAX} / ${DESCRIPTION_MAX} Zeichen verbleibend`)

    await descInput.fill('Test-Beschreibung hier')
    const remaining = DESCRIPTION_MAX - 'Test-Beschreibung hier'.length
    await expect(counter).toContainText(`${remaining} / ${DESCRIPTION_MAX} Zeichen verbleibend`)
  })

  test('Zeichenlimits werden eingehalten (maxLength)', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const subjectInput = page.locator('input[placeholder="Kurze Zusammenfassung"]')
    // maxLength-Attribut vorhanden
    await expect(subjectInput).toHaveAttribute('maxlength', String(SUBJECT_MAX))

    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')
    await expect(descInput).toHaveAttribute('maxlength', String(DESCRIPTION_MAX))
  })
})

test.describe('Ticketerstellung – Tastatursteuerung (Desktop)', () => {
  test('Enter sendet das Ticket (bei gültiger Eingabe)', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const subjectInput = page.locator('input[placeholder="Kurze Zusammenfassung"]')
    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')

    await subjectInput.fill('Test-Betreff für Enter')
    await descInput.fill('Dies ist eine ausreichend lange Beschreibung für den Test.')

    // Enter im Beschreibungsfeld → Submit
    let postCalled = false
    await page.route('**/api/support/tickets', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            ticket_number: 'T-0099',
            user_id: MOCK_USER_ID,
            user_name: 'TestUser',
            subject: 'Test-Betreff für Enter',
            category: 'Allgemeine Frage',
            status: 'open',
            priority: 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
          }),
        })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    await descInput.press('Enter')
    await page.waitForTimeout(500)
    expect(postCalled).toBe(true)
  })

  test('Shift+Enter erzeugt einen Zeilenumbruch', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')
    await descInput.fill('Zeile 1')
    await descInput.press('Shift+Enter')
    await descInput.type('Zeile 2')

    const value = await descInput.inputValue()
    expect(value).toContain('\n')
    expect(value).toContain('Zeile 1')
    expect(value).toContain('Zeile 2')
  })
})

test.describe('Ticketerstellung – Mobile', () => {
  test('Enter erzeugt Zeilenumbruch auf Mobilgeräten', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    })
    const page = await context.newPage()
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')
    await descInput.fill('Mobile Zeile 1')

    // Auf Mobilgeräten soll Enter keinen Submit auslösen
    let postCalled = false
    await page.route('**/api/support/tickets', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    await descInput.press('Enter')
    await page.waitForTimeout(300)
    expect(postCalled).toBe(false)

    await context.close()
  })

  test('Mobile Ticketabsendung funktioniert über den Button', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    const subjectInput = page.locator('input[placeholder="Kurze Zusammenfassung"]')
    const descInput = page.locator('textarea[placeholder*="Was ist passiert"]')

    await subjectInput.fill('Mobile Test-Ticket')
    await descInput.fill('Dies ist eine mobile Testbeschreibung für den Button.')

    let postCalled = false
    await page.route('**/api/support/tickets', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            ticket_number: 'T-0099',
            user_id: MOCK_USER_ID,
            user_name: 'TestUser',
            subject: 'Mobile Test-Ticket',
            category: 'Allgemeine Frage',
            status: 'open',
            priority: 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [],
          }),
        })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    await page.getByRole('button', { name: 'Ticket erstellen' }).click()
    await page.waitForTimeout(500)
    expect(postCalled).toBe(true)

    await context.close()
  })
})

test.describe('Ticketerstellung – Validierung', () => {
  test('Ungültige Eingaben werden korrekt behandelt', async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 })
    await setupAuthRoutes(page)
    await page.goto('/support', { waitUntil: 'networkidle' })

    // Leeres Formular absenden
    await page.getByRole('button', { name: 'Ticket erstellen' }).click()
    await expect(page.locator('text=Bitte einen Betreff')).toBeVisible()

    // Nur Betreff (zu kurz)
    const subjectInput = page.locator('input[placeholder="Kurze Zusammenfassung"]')
    await subjectInput.fill('Hi')
    await page.getByRole('button', { name: 'Ticket erstellen' }).click()
    await expect(page.locator('text=Bitte einen Betreff')).toBeVisible()

    // Betreff OK, Beschreibung zu kurz
    await subjectInput.fill('Gültiger Betreff hier')
    await page.getByRole('button', { name: 'Ticket erstellen' }).click()
    await expect(page.locator('text=Bitte eine Beschreibung')).toBeVisible()
  })
})

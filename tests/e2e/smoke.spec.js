import { expect, test } from '@playwright/test'

test('app shell loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

test('clean public store route resolves', async ({ page }) => {
  await page.goto('/loja/clinica-vida-plena-p1')
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveURL(/\/loja\/clinica-vida-plena-p1/)
})

test('clean public booking route resolves', async ({ page }) => {
  await page.goto('/agendar/clinica-vida-plena-p1')
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveURL(/\/agendar\/clinica-vida-plena-p1/)
})

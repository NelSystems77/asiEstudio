import { expect, test, type Page } from '@playwright/test';

async function completeQuiz(page: Page) {
  await page.getByRole('button', { name: 'Comenzar diagnóstico' }).click();
  const radio = page.getByRole('radio').first();
  const skip = page.getByRole('button', { name: 'Omitir este reto' });
  const done = page.getByText('Tu arquetipo de aprendizaje');
  // Cada paso muestra una pregunta o un mini-reto; se avanza hasta ver los resultados.
  for (let i = 0; i < 25 && !(await done.isVisible()); i++) {
    await radio.or(skip).or(done).first().waitFor();
    if (await done.isVisible()) break;
    if (await skip.isVisible()) await skip.click();
    else {
      await radio.click();
      await page.waitForTimeout(350); // la app avanza 220 ms después de responder
    }
  }
}

test('diagnóstico completo, plan con progreso persistente y historial', async ({ page }) => {
  await page.goto('./');
  await completeQuiz(page);
  await expect(page.getByText('Tu arquetipo de aprendizaje')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Arquitecto Visual');

  await page.getByRole('tab', { name: 'Plan a la medida' }).click();
  const first = page.getByRole('checkbox').first();
  await first.check();
  await expect(page.getByText(/1\/\d+ bloques/)).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'Plan a la medida' }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();

  await page.getByRole('button', { name: 'Historial' }).click();
  await expect(page.getByText('Arquitecto Visual')).toBeVisible();
});

test('funciona sin conexión tras la primera visita', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // el SW ya controla la página
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Descubre cómo estudias mejor' })).toBeVisible();
});

test('rechaza fecha pasada en el formulario', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Fecha del examen').fill('2020-01-01');
  await expect(page.getByText('La fecha ya pasó')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Comenzar diagnóstico' })).toBeDisabled();
});

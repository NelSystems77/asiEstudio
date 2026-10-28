import { defineConfig, devices } from '@playwright/test';

// Se prueba con el mismo base path que usa GitHub Pages para detectar rutas rotas.
const BASE = '/asiEstudio/';
export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:4173${BASE}`, ...devices['Pixel 7'] },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    env: { BASE_PATH: BASE },
    url: `http://localhost:4173${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

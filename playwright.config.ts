import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de interfaz (piloto). Levantan solas el backend (base descartable con datos de demo)
 * y el frontend. Requisitos: Docker con el contenedor de PostgreSQL arriba (docker compose up -d
 * en SistemaTicket-BE) y JDK 21.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-AR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'bash e2e/start-backend.sh',
      url: 'http://localhost:8080/actuator/health',
      // Sin reutilizar: si el puerto 8080 está ocupado falla, para no correr contra la base de desarrollo.
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});

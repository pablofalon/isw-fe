import { expect, type Browser, type Page } from '@playwright/test';

/** Cuentas del perfil "demo" del backend. */
export const CUENTAS = {
  usuario: { login: 'juan.perez', password: 'usuario123' },
  operador: { login: 'operador1', password: 'operador123' },
  admin: { login: 'admin', password: 'admin123' },
} as const;

export type Cuenta = (typeof CUENTAS)[keyof typeof CUENTAS];

/** Inicia sesión por la pantalla de login y espera salir de ella. */
export async function iniciarSesion(page: Page, cuenta: Cuenta) {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill(cuenta.login);
  await page.getByLabel('Contraseña').fill(cuenta.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Abre una sesión aislada (contexto propio) ya autenticada. Cada actor tiene la suya. */
export async function sesionDe(browser: Browser, cuenta: Cuenta): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await iniciarSesion(page, cuenta);
  return page;
}

export function numeroTicket(id: number): string {
  return `TK-${String(id).padStart(6, '0')}`;
}

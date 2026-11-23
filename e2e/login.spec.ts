import { expect, test } from '@playwright/test';
import { CUENTAS, iniciarSesion } from './helpers';

/** CU23 - Iniciar sesión. */
test('CU23 FA1: credenciales incorrectas muestran un error y no ingresan', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario o correo electrónico').fill('juan.perez');
  await page.getByLabel('Contraseña').fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Usuario o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('CU23: cada perfil ve solo las secciones de su rol', async ({ page }) => {
  await iniciarSesion(page, CUENTAS.usuario);
  await expect(page.getByRole('link', { name: 'Parámetros' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login/);

  await iniciarSesion(page, CUENTAS.admin);
  await expect(page.getByRole('link', { name: 'Parámetros' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
});

test('sesión expirada: redirige al login y, al ingresar de nuevo, vuelve a la pantalla de origen', async ({ page }) => {
  await iniciarSesion(page, CUENTAS.admin);

  // El servidor rechaza el token (sesión expirada o invalidada).
  await page.route('**/api/parametros', (ruta) =>
    ruta.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Sesión inválida o expirada' }) }),
  );
  await page.goto('/parametros');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Tu sesión expiró')).toBeVisible();

  await page.unroute('**/api/parametros');
  await page.getByLabel('Usuario o correo electrónico').fill(CUENTAS.admin.login);
  await page.getByLabel('Contraseña').fill(CUENTAS.admin.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/parametros$/);
});

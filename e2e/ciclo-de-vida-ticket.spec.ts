import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { CUENTAS, numeroTicket, sesionDe } from './helpers';

/**
 * Piloto: recorrido completo de un ticket, de su registro a la validación del usuario.
 * CU01, CU02, CU04, CU05, CU06, CU13, CU08, CU15, CU07/CU09, CU17, CU18, CU16 y CU12.
 * Tres actores con sesiones separadas: usuario final, operador y (al final) el mismo usuario.
 */
test.describe.configure({ mode: 'serial' });

const TITULO = `No puedo ingresar al sistema ${Date.now()}`;
let idTicket = 0;

async function estadoDelTicket(page: Page) {
  return page.locator('.ticket-detalle-header .estado-badge');
}

test('ciclo de vida completo de un ticket', async ({ browser }) => {
  const usuario = await sesionDe(browser, CUENTAS.usuario);
  const operador = await sesionDe(browser, CUENTAS.operador);

  await test.step('CU01 + CU02: el usuario registra un ticket con un adjunto', async () => {
    await usuario.goto('/tickets/nuevo');
    await usuario.getByLabel('Título del reclamo *').fill(TITULO);
    await usuario.getByLabel('Categoría *').selectOption({ label: 'Problemas de acceso' });
    await usuario.getByLabel('Prioridad sugerida').selectOption({ label: 'ALTA' });
    await usuario.getByLabel('Descripción detallada *').fill('Al loguearme aparece un error y no puedo continuar.');
    await usuario.locator('#adjuntos').setInputFiles(fileURLToPath(new URL('./fixtures/captura.pdf', import.meta.url)));
    await expect(usuario.getByText('captura.pdf')).toBeVisible();
    await usuario.getByRole('button', { name: /enviar|registrar/i }).click();

    await expect(usuario.getByRole('heading', { name: /registrado correctamente/i })).toBeVisible();
    await expect(usuario.getByText('Estado: NUEVO')).toBeVisible();
    const numero = await usuario.locator('.nuevo-ticket-confirmacion-numero').innerText();
    idTicket = Number(numero.replace('TK-', ''));
    expect(idTicket).toBeGreaterThan(0);
  });

  await test.step('CU04 + CU05 + CU06: el operador clasifica, prioriza y valida', async () => {
    await operador.goto(`/tickets/${idTicket}`);
    const panel = operador.locator('.panel-operador', { hasText: 'Clasificación y priorización' });
    await panel.locator('select').first().selectOption({ label: 'Problemas de acceso' });
    await panel.getByRole('button', { name: 'Guardar categoría' }).click();
    await panel.locator('select').nth(1).selectOption({ label: 'ALTA' });
    await panel.getByRole('button', { name: 'Guardar prioridad' }).click();
    await expect(operador.getByText('Prioridad: ALTA')).toBeVisible();

    await operador.getByRole('button', { name: 'Validar ticket' }).click();
    await expect(await estadoDelTicket(operador)).toHaveText('Validado');
  });

  await test.step('CU13: el operador asigna el ticket al operador del área', async () => {
    const panel = operador.locator('.panel-operador', { hasText: 'Asignar operador' });
    await panel.locator('select').selectOption({ label: 'Operador Soporte 1 — soporte técnico' });
    await panel.getByRole('button', { name: 'Asignar ticket' }).click();
    await expect(await estadoDelTicket(operador)).toHaveText('En análisis');
    await expect(operador.getByText('Operador: Operador Soporte 1')).toBeVisible();
  });

  await test.step('CU08: el operador registra una acción', async () => {
    await operador.getByLabel('Acción realizada *').fill('Reinicié el servicio de autenticación.');
    await operador.getByRole('button', { name: 'Registrar acción' }).click();
    await expect(operador.getByLabel('Acción realizada *')).toHaveValue('');
  });

  await test.step('CU15: usuario y operador intercambian comentarios', async () => {
    await usuario.goto(`/tickets/${idTicket}`);
    await usuario.getByPlaceholder('Escribí una consulta, aclaración o novedad').fill('¿Hay novedades?');
    await usuario.getByRole('button', { name: 'Agregar comentario' }).click();
    await expect(usuario.getByText('¿Hay novedades?')).toBeVisible();

    await operador.reload();
    await expect(operador.getByText('¿Hay novedades?')).toBeVisible();
    await operador.getByPlaceholder('Escribí una consulta, aclaración o novedad').fill('Estamos revisándolo.');
    await operador.getByRole('button', { name: 'Agregar comentario' }).click();
    await expect(operador.getByText('Estamos revisándolo.')).toBeVisible();
  });

  await test.step('CU07 + CU09: el operador resuelve el ticket', async () => {
    await operador.locator('#cu07-texto').fill('Se restableció el servicio de autenticación.');
    await operador.getByRole('button', { name: 'Marcar como resuelto' }).click();
    await expect(await estadoDelTicket(operador)).toHaveText('Resuelto');
  });

  await test.step('CU17: el operador cierra el ticket', async () => {
    await operador.locator('#cu07-texto').fill('Reinicio del servicio y cambio de clave.');
    await operador.getByRole('button', { name: 'Cerrar ticket' }).click();
    await expect(await estadoDelTicket(operador)).toHaveText('Cerrado');
  });

  await test.step('CU16: el usuario recibió notificaciones del ticket', async () => {
    await usuario.goto('/notificaciones');
    await expect(usuario.getByText(numeroTicket(idTicket)).first()).toBeVisible();
  });

  await test.step('CU18: el usuario confirma la resolución', async () => {
    await usuario.goto(`/tickets/${idTicket}`);
    await expect(usuario.getByText('¿La solución brindada resolvió su problema?')).toBeVisible();
    // Paso 5 de CU18: el sistema pide confirmar la acción.
    usuario.once('dialog', (dialogo) => dialogo.accept());
    await usuario.getByRole('button', { name: /Confirmar resolución/ }).click();
    await expect(usuario.getByText('Ya confirmaste esta resolución')).toBeVisible();
  });

  await test.step('CU12: el historial muestra todo el recorrido', async () => {
    await operador.goto(`/tickets/${idTicket}/historial`);
    const linea = operador.locator('.historial-timeline');
    for (const estado of ['Nuevo', 'Validado', 'En análisis', 'Resuelto', 'Cerrado']) {
      await expect(linea.getByText(estado, { exact: true }).first()).toBeVisible();
    }
  });
});

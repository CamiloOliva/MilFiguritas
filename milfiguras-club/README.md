# Milfiguras BGA · Club de Sorpresas

Aplicación con reservas personalizadas, seguimiento de pedidos, fidelización y administración. Los datos se guardan en SQLite; no dependen del almacenamiento del navegador.

## Publicar desde GitHub

El código está preparado para el repositorio [CamiloOliva/MilFiguritas](https://github.com/CamiloOliva/MilFiguritas). Incluye Docker, configuración de Render y pruebas de GitHub Actions. Consulta [la guía de despliegue](docs/DESPLIEGUE.md) para obtener una URL pública con la API y la base de datos funcionando.

[Preparar despliegue en Render](https://render.com/deploy?repo=https://github.com/CamiloOliva/MilFiguritas) · Requiere revisar y aprobar un servicio de pago con disco persistente.

## Ejecutar

Requiere Node.js 24. Desde esta carpeta:

```sh
node server.mjs
```

Abre `http://127.0.0.1:3000`. El servidor local escucha únicamente en el equipo donde se ejecuta. No requiere instalar dependencias para funcionar.

## Acceso

Los clientes crean su cuenta con correo, contraseña y consentimiento. El registro público siempre crea un cliente explorador. El perfil embajador se obtiene después de tres compras verificadas.

La administración utiliza el mismo formulario de inicio de sesión, con una cuenta autorizada. No existen botones de acceso directo ni contraseñas administrativas en los archivos públicos.

En desarrollo local, en la primera ejecución o al detectar la antigua contraseña administrativa de demostración, el servidor genera una clave aleatoria y guarda el acceso inicial en **`data/ACCESO-ADMIN.txt`**. La actualización invalida las sesiones del administrador afectado y hace un respaldo previo en `data/before-security-upgrade.sqlite`.

El archivo es privado del equipo y no se sirve por HTTP. Una vez dentro, usa **Perfil → Cambiar contraseña** para establecer tu clave. El cambio exige la contraseña actual y cierra las otras sesiones. Diez intentos fallidos bloquean el correo durante 15 minutos.

En producción se crea una cuenta administrativa con `ADMIN_EMAIL` y `ADMIN_PASSWORD`, definidos de forma privada en el alojamiento. No se crean cuentas de demostración ni se escribe un archivo de contraseña. Los datos de desarrollo no se suben al servidor.

Los perfiles históricos de cliente de demostración locales se conservan para no perder los registros previos. Sus datos no cuentan para el piloto real. La cuenta administrativa conserva sus datos de perfil al actualizar su seguridad.

## Recorrido de un pedido

1. El cliente elige un detalle, destinatario, ocasión, fecha, color y mensaje. Añade su celular y selecciona domicilio con dirección o recogida.
2. El servidor exige al menos 48 horas de anticipación y hasta 90 días. Guarda una solicitud pendiente con referencia y puntos ofrecidos. Un reintento de la misma solicitud no genera otro pedido.
3. Aparece un resumen con el botón **Abrir pedido en WhatsApp** hacia **+57 304 481 7781**. El mensaje incluye referencia, cliente, contacto, producto, ocasión, destinatario, fecha y hora de Colombia, color, entrega y nota de la tarjeta.
4. El cliente revisa el mensaje y pulsa **Enviar** en WhatsApp. La aplicación no envía mensajes automáticamente ni afirma que se hayan recibido. También se puede copiar el resumen y volver a abrirlo desde Mis reservas.
5. Milfiguras coordina disponibilidad, precio y entrega. Desde Operación, el administrador confirma o cancela la solicitud. Confirmar acredita los puntos ofrecidos una sola vez; cancelar no acredita puntos. La decisión queda en el registro de auditoría.

No se procesan pagos. La confirmación de una reserva no equivale a una compra pagada. Los códigos de compra se emiten después de verificar una venta real.

Los estados se consultan al navegar, al volver a la pestaña y cada 30 segundos mientras la aplicación esté visible y no haya un diálogo abierto.

## Verificación

Instala las dependencias de desarrollo y ejecuta:

```sh
pnpm install --frozen-lockfile
pnpm test
```

También puedes usar `npm test` si las dependencias ya están instaladas. Las dependencias de desarrollo se usan para las pruebas de la interfaz con DOM simulado; el servidor no las necesita.

La suite establece un mínimo del 60% de cobertura en la lógica de gamificación. En la verificación del 16 de noviembre de 2026 pasaron **50 pruebas**, con **100% de líneas, ramas y funciones de `src/rules.mjs`**. Esa cifra se refiere exclusivamente al módulo de reglas, no a toda la aplicación.

Consulta [el recorrido de pruebas manuales](docs/PRUEBAS-FUNCIONALES.md) para comprobar la experiencia en un navegador y la recepción real de un pedido por WhatsApp.

## Datos y mantenimiento

- `data/milfiguras.sqlite`: datos persistentes. Conserva respaldos y no publiques la carpeta `data`.
- `data/ACCESO-ADMIN.txt`: acceso administrativo inicial, que deja de ser válido si cambias la contraseña.
- `src/app.mjs`: API y autorización de las operaciones.
- `src/rules.mjs`: puntos, niveles, canjes, reservas e indicadores.
- `src/profile.mjs`: perfil y validación de fotografías.
- `public/`: interfaz de clientes y administración.
- `tests/`: pruebas de reglas, API, seguridad, perfil y flujos de interfaz.

El CSV del piloto utiliza seudónimos y excluye nombres, correos, teléfonos, direcciones, mensajes de tarjetas y fotografías. La vista de seguimiento del piloto excluye siempre las cuentas de demostración, incluso si se incluyen sus datos en los otros indicadores para comprobar la aplicación.

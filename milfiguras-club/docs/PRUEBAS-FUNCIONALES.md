# Milfiguras BGA · Validación funcional

Fecha de verificación automatizada: 16 de noviembre de 2026.

## Resultado automatizado

50 pruebas aprobadas, incluidas 5 comprobaciones de despliegue, persistencia y configuración. Cobertura del módulo `src/rules.mjs`: 100% de líneas, funciones y ramas. La suite incluye pruebas de la API con sesiones y permisos, y pruebas de interacción con un DOM simulado. No equivale a una revisión visual en dispositivos reales ni a la recepción de mensajes en WhatsApp.

Se comprobaron además, mediante HTTP contra el servidor local y lectura de SQLite: rechazo de la antigua contraseña administrativa, acceso con la nueva credencial privada, cookie HttpOnly, persistencia de una actualización del perfil, invalidación al cerrar sesión y bloqueo de acceso web a credenciales, base de datos, respaldo y código del servidor.

## Casos para ejecutar con personas

Utiliza datos de prueba y dos sesiones de navegador independientes, una de cliente y otra de administración. Crear clientes desde el registro permite probar los datos reales; los perfiles marcados como demostración no cuentan en el piloto. Registra los resultados observados, el navegador y la fecha; no marques un caso como aprobado antes de ejecutarlo.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| MAN-01 | Abrir la página sin sesión e intentar acceder a administración. | Se requiere correo y contraseña. No hay accesos con un clic. |
| MAN-02 | Ingresar con la clave privada inicial de administración y cambiarla desde el perfil. | La clave anterior deja de servir. Otras sesiones de esa cuenta se cierran. La sesión que hizo el cambio sigue activa. |
| MAN-03 | Registrar un cliente y abrir Arma tu sorpresa. | Se muestra el catálogo. El cliente no tiene opciones administrativas. |
| MAN-04 | Crear una reserva con menos de 48 horas, celular incorrecto o domicilio sin dirección. | Se muestra un error; no se guarda un pedido ni se dan puntos. |
| MAN-05 | Crear una reserva válida a domicilio. | Se guarda una solicitud pendiente con referencia, contacto, dirección y resumen. No se dan puntos todavía. |
| MAN-06 | Elegir recogida en una nueva solicitud. | La dirección deja de ser obligatoria. El resumen indica recogida coordinada. |
| MAN-07 | Abrir el botón de WhatsApp del pedido. | Se abre el chat de +57 3044817781 con un mensaje completo. El cliente revisa y pulsa Enviar. Comprobar la recepción con el encargado, sin asumir que abrir el enlace equivale a enviar. |
| MAN-08 | Como administrador, abrir Operación y confirmar la solicitud. | El diálogo se cierra; aparece confirmación; la tabla cambia a Confirmada y los puntos se acreditan una vez. Repetir la decisión no suma puntos. |
| MAN-09 | Cancelar otra solicitud pendiente. | Cambia a Cancelada y no acredita puntos. No se ofrece reenviar una solicitud cancelada como pedido activo. |
| MAN-10 | Como cliente, volver a la pestaña o entrar en Mis reservas y Mi progreso. | Se muestran el estado y los puntos actualizados. La actualización automática funciona al estar visible, sin interrumpir un diálogo abierto. |
| MAN-11 | Editar una recompensa y un reto desde administración. | El formulario guarda los cambios, muestra respuesta y actualiza la vista. Una reserva previa conserva los puntos ofrecidos originalmente. |
| MAN-12 | Pausar el reto de reservas y crear una solicitud. | Se permite solicitar el pedido, ofreciendo cero puntos mientras el reto esté pausado. Se puede confirmar normalmente. |
| MAN-13 | Enviar una foto autorizada, pausar su reto y revisar la foto pendiente. | El administrador puede aprobar o rechazar. Aprobar acredita los puntos ofrecidos al enviarla, una sola vez. |
| MAN-14 | Emitir un código para una compra real y registrarlo en la cuenta titular. | El código suma los puntos correspondientes una sola vez. Otro cliente no puede usarlo. |
| MAN-15 | Canjear una recompensa y validar el cupón con administración. | Baja el saldo disponible y el stock; el XP acumulado se conserva. El cupón solo puede validarse una vez, antes de vencer. |
| MAN-16 | Cambiar nombre, correo, foto y apariencia desde el perfil. | Los datos y la foto persisten al volver a iniciar sesión. El modo claro u oscuro se recuerda en ese navegador. |
| MAN-17 | Consultar los indicadores con y sin demostraciones y exportar el CSV. | Los indicadores identifican su alcance. El seguimiento del piloto y el CSV excluyen siempre demos. El CSV no contiene información de contacto ni detalles privados del pedido. |
| MAN-18 | Cerrar sesión y recargar. | Se vuelve al acceso; las operaciones protegidas no están disponibles. |

## Registro de incidencias

Por cada incidencia, anota: identificador, caso, pasos exactos, resultado esperado, resultado observado, perfil, navegador y dispositivo, fecha, severidad y evidencia autorizada. No incluyas contraseñas en capturas ni informes.

La recepción real por WhatsApp, la revisión visual y el uso con clientes deben registrarse después de ejecutarse. No se han simulado reuniones, consentimientos, participantes ni resultados del piloto.

## Cambios que corrigen los problemas reportados

- La detección del formulario utiliza el atributo `id` en lugar de la propiedad que pueden ocultar controles con el mismo nombre. Las pruebas cubren confirmación, error administrativo y edición de recompensas y retos.
- Los errores permanecen visibles y los botones se habilitan para reintentar. Una confirmación exitosa actualiza la tabla y el saldo.
- Se añadieron referencias de pedido, celular, modalidad de entrega, dirección y resumen para WhatsApp.
- Se eliminaron los accesos directos y las credenciales administrativas del código público. Se reemplaza la antigua clave compartida y se revocan sus sesiones.
- Se añadió cambio de contraseña con comprobación de la actual y revocación de otras sesiones.
- Los reintentos con el mismo identificador de solicitud reutilizan la reserva existente.
- Se puede reservar aunque el reto esté pausado. Las reservas y fotografías pendientes conservan los puntos ofrecidos.
- El indicador del piloto siempre excluye demostraciones y la gráfica utiliza la misma ventana de días de Colombia que los indicadores.

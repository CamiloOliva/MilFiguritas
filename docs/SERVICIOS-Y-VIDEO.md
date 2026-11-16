# Servicios y presentación de Milfiguras BGA

El catálogo se consulta sin iniciar sesión. Para guardar pedidos se requiere una cuenta de cliente; la administradora consulta y gestiona su composición completa.

| Desayuno | Platos | Acompañamiento | Bebida | Precio fijo (COP) |
|---|---|---|---|---|
| Grande | Sándwich + panqueques con huevo | Frutas + dulce | Una a elección | $150.000 |
| Mediano | Sándwich + panqueques con huevo | Frutas o dulce | Una a elección | $100.000 |
| Pequeño | Sándwich o panqueques con huevo | Frutas o dulce | Una a elección | $80.000 |

Sándwich: pan, jamón, queso, pollo desmechado, lechuga, tomate y salsas. Dulces: arequipe, gomitas u otro especificado por el cliente. Bebidas: gaseosa, cerveza o crema de whisky. Las opciones con alcohol requieren confirmación de mayoría de edad; la empresa coordina disponibilidad y entrega.

Todos permiten solicitar una presentación, regalo o decoración. Los eventos incluyen temática, lugar, fecha, colores y número opcional de asistentes. El precio de regalos y eventos varía según lo solicitado y se acuerda por WhatsApp. La cobertura y el montaje se coordinan con la empresa; no hay cobro automático. Las reglas se validan en el servidor y el resumen de WhatsApp incorpora las opciones guardadas. Los pedidos anteriores siguen siendo legibles.

## Video

El original de 45 segundos permanece intacto fuera del repositorio. La presentación pública conserva su duración, proporción y pista de audio. Se publica en H.264/AAC a 1280 × 720, con inicio rápido, de aproximadamente 2,7 MB. La vista previa separada usa los primeros 14 segundos, sin audio, y pesa aproximadamente 0,4 MB. El manifiesto registra hashes y procedencia.

La vista previa se activa al entrar en pantalla, sin sonido. Respeta la preferencia de movimiento reducido y ahorro de datos cuando el navegador las expone. Se puede pausar. El reproductor completo se abre por acción del usuario e incluye controles nativos y capítulos. El servidor admite solicitudes parciales para avanzar sin descargar todo el archivo. El texto del catálogo complementa el video; sus indicadores se identifican como ilustrativos.

Para regenerar una versión futura: `python scripts/prepare-media.py --source "ruta al original" --ffmpeg "ruta al ejecutable"`. El script se niega a sobrescribir exportaciones existentes; actualiza los nombres versionados y referencias al publicar un nuevo video.

## Prueba funcional

Comprueba grande, mediano y pequeño; cambia tamaño en el formulario; elige frutas/dulce y dulce personalizado; revisa las bebidas; crea un evento; revisa resumen y WhatsApp; confirma el pedido desde administración. Verifica también el video, capítulos, cierre, móvil y modo oscuro. Las pruebas automatizadas cubren las restricciones del servidor, formularios, preservación del pedido y solicitudes parciales del video.

Los precios de desayunos se calculan en el servidor a partir del tamaño y se guardan en el pedido. Se ignora cualquier precio enviado por el cliente. Los pedidos anteriores sin precio guardado se identifican para confirmación por WhatsApp, sin asignarles retroactivamente una tarifa.

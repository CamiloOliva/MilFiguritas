# Despliegue de Milfiguras BGA

## Repositorio y aplicación publicada

El repositorio de destino es [CamiloOliva/MilFiguritas](https://github.com/CamiloOliva/MilFiguritas). Subir el código no crea por sí solo una URL con la aplicación funcionando.

Esta aplicación ejecuta una API Node.js y guarda información en SQLite. [GitHub Pages sirve sitios estáticos](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), por lo que se necesita un servicio que ejecute el servidor y conserve el directorio de datos.

El proyecto incluye dos alternativas: un Blueprint de Render y una imagen Docker. Ambas sirven la interfaz y la API desde el mismo dominio.

## Render gratis para pruebas breves

[Desplegar gratis en Render](https://render.com/deploy?repo=https://github.com/CamiloOliva/MilFiguritas)

El enlace prepara el despliegue desde el repositorio. Permite revisar el servicio antes de crearlo. [Funcionamiento del botón de Render](https://render.com/docs/deploy-to-render).

1. Conecta tu cuenta de Render con el repositorio de GitHub.
2. Crea un Blueprint desde el repositorio. La configuración utiliza Node.js 24.22.1 y una instancia **Free**, sin disco de pago.
3. Introduce `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el panel privado de Render. La contraseña inicial debe tener de 12 a 120 caracteres, mayúsculas, minúsculas y números. No la escribas en GitHub.
4. Comprueba que el servicio indique **Free** y crea el despliegue. No añadas discos ni elijas planes de pago para estas pruebas.
5. Render proporcionará una URL HTTPS. La aplicación utiliza `RENDER_EXTERNAL_URL` para configurar el origen y las cookies seguras. Si añades un dominio propio, establece `PUBLIC_ORIGIN` con ese dominio, por ejemplo `https://club.tu-dominio.com`, sin rutas.
6. Abre la URL y entra con las credenciales que definiste. La instalación de producción comienza con la cuenta administrativa y sin clientes de demostración. Cambia la contraseña desde el perfil si utilizaste una inicial temporal.
7. Crea una cuenta de cliente desde otro navegador y comprueba reservas, confirmación, puntos y WhatsApp. Render mostrará una URL HTTPS que podrás compartir para las pruebas.

**Los datos son temporales.** Render Free puede suspender el servicio tras 15 minutos sin actividad y su sistema de archivos es efímero. Las cuentas, fotografías y pedidos de prueba pueden perderse al suspender, reiniciar o volver a desplegar. La siguiente visita también puede tardar mientras despierta el servidor. Usa esta opción para pruebas funcionales breves, no para recopilar un piloto de varios días que deba conservar información. [Límites oficiales de Render Free](https://render.com/docs/free).

Las siguientes publicaciones desde GitHub se configuran para desplegar cuando pasen las comprobaciones de CI. El flujo comprueba reglas, API, interfaz, configuración y arranque en Docker. Consulta la [referencia de Blueprints](https://render.com/docs/blueprint-spec) para ajustar el plan o desactivar los despliegues automáticos.

La contraseña de entorno inicializa cada instalación nueva. En el plan gratuito, si se pierde el almacenamiento temporal, se vuelve a crear la cuenta administrativa con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Las credenciales del equipo local no se transfieren al alojamiento. Para conservar datos entre reinicios, usa Docker con un volumen persistente u otro alojamiento con almacenamiento duradero.

## Docker

1. Copia `.env.example` a `.env` y configura tu correo, una contraseña privada y `PUBLIC_ORIGIN`. El archivo `.env` está excluido de Git.
2. Para probar en tu equipo con Compose usa `PUBLIC_ORIGIN=http://localhost:3000`. La conexión HTTP sin TLS se permite en producción solo para direcciones de loopback de pruebas.
3. Ejecuta:

```sh
docker compose up --build -d
```

4. Abre `http://localhost:3000`. El volumen `milfiguras-data` conserva SQLite en `/app/data`.

Para exponerlo a Internet, coloca un proxy con HTTPS delante del contenedor y establece `PUBLIC_ORIGIN` con la URL pública HTTPS. El proceso escucha en `0.0.0.0` dentro del contenedor. La aplicación rechaza solicitudes de otro origen y marca las cookies como Secure cuando su origen configurado es HTTPS.

La imagen ejecuta el servidor como el usuario `node`. Con volúmenes administrados por Compose se conserva la propiedad del directorio de datos inicial. Para un directorio enlazado desde el host, configura permisos de escritura para ese usuario antes de iniciar.

La imagen no instala dependencias de desarrollo y solo copia `server.mjs`, `package.json`, `src` y `public`. No copia datos, fotografías privadas, archivos de acceso, claves ni configuración de Sites.

## Variables

| Variable | Uso |
| --- | --- |
| `NODE_ENV` | `production` en alojamiento; activa validación del origen y credenciales iniciales. |
| `HOST` | `0.0.0.0` en alojamiento; por defecto se limita a `127.0.0.1` en desarrollo. |
| `PORT` | Puerto que entrega el alojamiento. Por defecto, 3000. |
| `DATA_DIR` | Directorio donde se guarda SQLite. Debe estar en un disco o volumen persistente. |
| `PUBLIC_ORIGIN` | URL de origen pública HTTPS, sin rutas, usuario ni contraseña. Tiene prioridad sobre la detección de Render. |
| `RENDER_EXTERNAL_URL` | Valor proporcionado por Render que se utiliza si no defines `PUBLIC_ORIGIN`. |
| `ADMIN_EMAIL` | Correo de la cuenta administrativa al crear la base de datos. |
| `ADMIN_PASSWORD` | Contraseña privada para inicializar la administración. No se publica ni aparece en registros. |
| `INCLUDE_DEMO_DATA` | Permite excluir las demostraciones en desarrollo con `false`. En producción no se crean demos. |

## Operación

- `/healthz` comprueba que el servidor responda y pueda consultar SQLite.
- Utiliza una sola instancia de servidor con este almacenamiento. La aplicación serializa las escrituras dentro de ese proceso.
- Conserva respaldos consistentes de SQLite antes de cambios importantes. No publiques la base de datos ni sus respaldos en GitHub.
- Un despliegue nuevo tiene sus propias cuentas y pedidos. Los datos y la contraseña del equipo de desarrollo no se transfieren al alojamiento.
- Para recuperar el acceso, utiliza procedimientos privados en el servidor. No modifiques el código para publicar una contraseña de emergencia.

## Comprobaciones antes de subir

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run verify:release
```

El verificador utiliza una lista de archivos autorizados, rechaza rutas privadas y comprueba que el código no incluya la contraseña administrativa local. La publicación excluye `data/`, `.env`, `.openai/`, `node_modules/`, artefactos temporales y archivos SQLite.

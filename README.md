# OblivionUI

**OblivionUI** es la plataforma visual para que personas sin perfil técnico creen proyectos
describiéndolos con palabras de negocio. `PagObli` es el nombre del repositorio y el prefijo
de las variables de entorno; la interfaz se llama OblivionUI. El objetivo y el alcance están en [NOTAS.md](NOTAS.md).

Proyecto abierto bajo licencia [MIT](LICENSE). Requiere Node.js 22 o superior
para desarrollo local; la imagen Docker usa Node.js 24.

```bash
npm install
npm run dev        # frontend en http://localhost:5173
npm test           # pruebas unitarias
npm run typecheck
npm run build
PAGOBLI_ACCESS_KEY=una-clave-larga npm start  # API y frontend en http://localhost:8080
```

Para desarrollo, ejecuta `npm start` y `npm run dev` en dos terminales. Vite envía
las peticiones `/api` al backend del puerto 8080.

## Docker

```bash
cp .env.example .env
# Edita PAGOBLI_ACCESS_KEY con una clave propia y larga.
docker compose up --build -d
```

La interfaz queda en `http://localhost:8080` y el contenedor expone
`GET /health` para comprobar su estado. El Dockerfile ejecuta la comprobación de
tipos, las pruebas unitarias y la compilación antes de crear la imagen final.
La imagen final sirve el frontend y la API de conexión con OpenCode mediante un
proceso sin privilegios. Para detenerla: `docker compose down`.

## Conectar OpenCode

1. Ten una instancia de OpenCode accesible desde **el contenedor de PagObli**.
   La API HTTP documentada se inicia con `opencode serve --hostname 0.0.0.0 --port 4096`.
   Si OpenCode está en el host, prueba `http://host.docker.internal:4096` en la
   pantalla de Configuración. `localhost` dentro del contenedor se refiere a
   PagObli, no al host.
2. En Configuración, introduce la dirección, la clave `PAGOBLI_ACCESS_KEY` y,
   si protegiste OpenCode con autenticación básica, su usuario y contraseña.
   La contraseña de OpenCode se guarda solo en memoria del backend durante la
   sesión; no se escribe en `localStorage` ni en un archivo.
3. Crea un proyecto. PagObli crea una sesión de OpenCode en el directorio de
   trabajo de la instancia. En las opciones avanzadas puedes elegir otro
   directorio **ya existente**; PagObli comprueba que OpenCode realmente cree
   la sesión allí antes de enviar instrucciones.
4. Escribe cambios en el espacio de trabajo. Los mensajes se envían a OpenCode
   y se muestra su respuesta en lenguaje natural. Si tu aplicación ya se está
   ejecutando, agrega su URL para mostrarla como vista previa.

Mientras OpenCode trabaja, PagObli consulta las preguntas y solicitudes de permiso
de esa sesión. Muestra las opciones al usuario; los permisos se pueden conceder
una vez o rechazar. En Historial se pueden consultar las solicitudes reales y
pedir a OpenCode que recupere el estado anterior a una de ellas.

### Contexto dentro de cada contenedor

En proyectos reales, la pestaña **Contexto** consulta únicamente `PROJECT.md`, `NOTAS.md`,
`AGENTS.md` y `.pagobli/context.json` mediante la API de la instancia conectada. La interfaz
solo muestra la ficha segura definida en el JSON y confirma qué documentos encontró; no envía el
contenido de las reglas ni las notas al navegador. Al iniciar un proyecto, OpenCode recibe la
indicación de revisar esos archivos antes de trabajar. Consulta el formato y el aislamiento
recomendado en [docs/CONTEXTO_PROYECTO.md](docs/CONTEXTO_PROYECTO.md).

### Opcional: crear proyectos desde una base Laravel

Configura en `.env` las rutas `PAGOBLI_TEMPLATE_HOST_DIR` (una base Laravel ya
existente) y `PAGOBLI_WORKSPACE_HOST_DIR` (carpeta donde se copiarán los proyectos).
La carpeta de proyectos debe ser escribible por el usuario del contenedor. Luego:

```bash
docker compose -f compose.yaml -f compose.provision.yaml up --build -d
```

OpenCode también debe ver **el mismo volumen de proyectos**. Móntalo en OpenCode
en `/workspaces` o configura `PAGOBLI_OPENCODE_WORKSPACE_ROOT` con la ruta bajo
la cual lo ve OpenCode. PagObli copia la plantilla a una carpeta nueva, evita
copiar `.env`, `vendor`, `node_modules` y `.git`, y comprueba por la API que
OpenCode lee los mismos archivos antes de enviarle el proyecto. Si la
comprobación falla, elimina la copia recién creada. Esta opción prepara archivos
y sesión; todavía no levanta automáticamente un contenedor Laravel ni asigna
una URL de vista previa.

Esta conexión usa la API HTTP de OpenCode descrita en
[su documentación](https://dev.opencode.ai/docs/server/). Es una base para
instalaciones individuales. Aún faltan aprovisionamiento automático de
contenedores Laravel, permisos por usuario, streaming de avances y persistencia
compartida de proyectos. Si una versión de OpenCode no expone preguntas o
permisos por su API, PagObli lo señala y esa decisión debe resolverse en
OpenCode.

La clave de instalación protege las operaciones del backend; usa HTTPS si
accedes a PagObli u OpenCode desde otra máquina.

Los metadatos y conversaciones de PagObli todavía se guardan en el `localStorage`
de cada navegador. Las sesiones y el código reales los conserva la instancia de
OpenCode en su entorno. Al reiniciar PagObli hay que volver a conectar OpenCode;
no se guardan credenciales. Una instalación para varios usuarios necesitará
cuentas y una base de datos.

## Qué incluye hoy (primer alcance)

- Lista de proyectos con folio, estado y último movimiento.
- Pantalla inicial con ejemplos editables para comenzar un proyecto.
- Alta en dos pasos: la idea, y un bloque de responsables (solicita / autoriza / datos).
- Espacio de trabajo: conversación y vista previa, con paneles ajustables en escritorio y opción
  para ampliar el resultado a pantalla completa.
- Estados de la demostración diferenciados de los proyectos reales; una vista ilustrativa nunca
  se presenta como aplicación verificada.
- Historial de versiones: recuperar una versión crea una nueva entrada, conservando las anteriores.
- Conexión real con una instancia propia de OpenCode mediante el backend.
- Preguntas y permisos pendientes de OpenCode en el espacio de trabajo.
- Historial de solicitudes reales con recuperación mediante OpenCode.
- Ficha de contexto para proyectos reales, obtenida del contenedor con una lista cerrada de archivos.
- Copia opcional de una plantilla Laravel en un volumen compartido.
- **Modo demostración** siempre visible en esta etapa: la vista previa la genera
  `src/demo.js`, no la IA. Cuando una petición no se entiende, se anota tal cual en lugar
  de fingir que se construyó. La idea inicial orienta la vista ilustrativa.

Los proyectos de demostración siguen separados de los proyectos conectados a OpenCode.

## Qué falta (etapas posteriores de NOTAS.md)

Aprovisionamiento automático de contenedores Laravel, usuarios y permisos,
edición visual sobre la vista previa, publicación y persistencia compartida.

## Diseño

Interfaz construida con **Tailwind CSS v4 + shadcn/ui (Radix) + motion**, con identidad
morada propia de OblivionUI en OKLch y tema claro/oscuro que sigue al sistema operativo
(con interruptor que recuerda la elección). Las tipografías Geist y Geist Mono se sirven
auto-hospedadas: nada se pide a una CDN externa.

Colores con significado, no decorativos:

| Tono | Significado |
| --- | --- |
| Violeta (marca) | Acción principal, selección, foco y proyecto real |
| Rosa apagado | Demostración: no se ejecuta código real |
| Ámbar | Retenido: OpenCode espera una autorización o una respuesta |
| Verde | Verificado y listo para revisar |

Los componentes de `src/components/ui/` vienen de shadcn/ui y se pueden actualizar con
`npx shadcn@latest add <componente>`. El sistema completo —paleta OKLch, tipografía, forma, espacio, movimiento y componentes—
está documentado en [`DESIGN.md`](DESIGN.md). La verdad de producto está en
[`PRODUCT.md`](PRODUCT.md) y la estrategia de esta interfaz en
`.impeccable/surfaces/src-app-tsx.md`.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `src/App.tsx` | Rutas (hash), lista de proyectos, alta, configuración |
| `src/Workspace.tsx` | Conversación, vista previa, historial |
| `src/index.css` | Tokens de color OKLch, tema claro/oscuro y resplandor de marca |
| `src/components/marca.tsx`, `src/components/tema.tsx` | Logotipo, estados e interruptor de tema |
| `src/components/ui/` | Componentes shadcn/ui (Radix) |
| `src/store.ts` | Estado y persistencia en `localStorage` |
| `src/demo.js` | Motor de demostración: interpreta peticiones y dibuja la vista previa |
| `src/demo.test.mjs` | `node --test`, cubre el motor |
| `src/store.test.mjs` | Pruebas de historial y migración de ajustes |
| `Dockerfile`, `compose.yaml` | Construcción y ejecución en contenedor |
| `server.mjs` | Backend de conexión, archivos estáticos y endpoint de salud |
| `opencode.mjs`, `opencode.test.mjs` | Adaptador HTTP de OpenCode y pruebas unitarias |
| `provision.mjs`, `compose.provision.yaml` | Copia opcional de plantillas en un volumen compartido |

# Instalación y operación

Esta guía es para quien administra OblivionUI, OpenCode, las plantillas Laravel y Docker.

## 1. Preparar la instalación

Copia `.env.example` a `.env` y define valores propios:

```dotenv
PAGOBLI_ACCESS_KEY=clave-larga-y-unica
PAGOBLI_ADMIN_EMAIL=admin@empresa.mx
PAGOBLI_ADMIN_PASSWORD=contraseña-de-al-menos-12-caracteres
PAGOBLI_ADMIN_NAME=Administración
```

`PAGOBLI_ADMIN_*` crea la primera cuenta solo si todavía no existen cuentas. Cambiar esas
variables después no cambia la contraseña ya creada. El archivo de identidad se guarda en el
volumen Docker `pagobli-data`; respáldalo como parte de la configuración de la instalación.

Inicia el servicio:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f pagobli
```

La salud básica está disponible en `GET /health`. Publica OblivionUI detrás de HTTPS cuando se
acceda desde otra máquina. No expongas OpenCode directamente a usuarios finales.

## 2. Cuentas, roles y espacios

Cualquier persona puede crear un espacio propio. La persona propietaria de un espacio puede añadir integrantes en
**Configuración**. Al añadir a alguien se define una contraseña inicial de al menos 12 caracteres;
compártela por un canal seguro.

| Rol | Puede hacer |
| --- | --- |
| Propietario | Añadir integrantes a su espacio y configurar la conexión. |
| Administrador | Configurar la conexión y trabajar en los proyectos de su espacio. |
| Integrante | Trabajar en los proyectos de su espacio. |

La conexión temporal de OpenCode se asocia a la cuenta y al espacio activos. Al cambiar de espacio
la conexión anterior deja de estar disponible. Por ahora las fichas y conversaciones de proyectos
no se comparten entre navegadores: se guardan en el navegador de quien las creó.

## 3. Conectar OpenCode

Inicia la API de OpenCode en una dirección a la que **el contenedor de OblivionUI** pueda llegar:

```bash
opencode serve --hostname 0.0.0.0 --port 4096
```

En Docker, si OpenCode corre en el host, usa `http://host.docker.internal:4096`; `localhost`
dentro del contenedor se refiere a OblivionUI. En **Configuración**, introduce la URL, la clave
`PAGOBLI_ACCESS_KEY` y, si aplica, las credenciales HTTP de OpenCode. Estas últimas permanecen
solo en la memoria del backend mientras dura la sesión.

Antes de habilitar usuarios, comprueba desde el contenedor que la URL responde. Si cada usuario
tiene un contenedor OpenCode, conecta la instancia que corresponda a su espacio. Así OpenCode solo
ve la carpeta de trabajo que debe administrar.

## 4. Crear desde una plantilla Laravel

Para preparar una copia aislada de una base Laravel, configura las rutas del host:

```dotenv
PAGOBLI_TEMPLATE_HOST_DIR=/srv/plantillas/laravel-base
PAGOBLI_WORKSPACE_HOST_DIR=/srv/proyectos
PAGOBLI_OPENCODE_WORKSPACE_ROOT=/workspaces
```

Inicia con el archivo adicional:

```bash
docker compose -f compose.yaml -f compose.provision.yaml up --build -d
```

Monta el mismo directorio de proyectos en OpenCode bajo `PAGOBLI_OPENCODE_WORKSPACE_ROOT`.
OblivionUI copia la plantilla, omite secretos y dependencias, y comprueba que OpenCode vea la
misma carpeta antes de crear una sesión. Consulta el [contexto seguro](CONTEXTO_PROYECTO.md).

## 5. Levantar previews por proyecto

Para que la aplicación de cada proyecto se inicie automáticamente, sigue la guía de
[ejecución con Docker Compose](EJECUCION_DE_PROYECTOS.md). Requiere un socket Docker controlado,
health checks en la plantilla y una URL de preview única por proyecto. Prueba primero con una
plantilla desechable en una red de pruebas.

## Respaldo y actualización

Respalda el volumen `pagobli-data` antes de actualizar. No borres ese volumen si quieres conservar
cuentas y espacios. Para actualizar el servicio:

```bash
git pull
docker compose up --build -d
docker compose ps
```

Ejecuta las pruebas antes de publicar cambios de código:

```bash
npm test
npm run typecheck
npm run build
```

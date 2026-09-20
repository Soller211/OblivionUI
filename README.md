# OblivionUI

OblivionUI es una interfaz para que personas de negocio creen y revisen proyectos sin usar la
interfaz técnica de OpenCode. La instalación vive en la infraestructura de cada organización:
OpenCode, el modelo local, los proyectos Laravel y sus contenedores no salen de su servidor.

`PagObli` es el nombre histórico del repositorio y el prefijo de las variables de entorno.

## Empieza aquí

| Si eres… | Lee… |
| --- | --- |
| Persona de proyectos o dirección | [Guía de uso](docs/GUIA_DE_USO.md) |
| Administrador de la instalación | [Instalación y operación](docs/INSTALACION_Y_OPERACION.md) |
| Persona que mantiene o integra el código | [Arquitectura e integración](docs/ARQUITECTURA.md) |
| Persona que resuelve una incidencia | [Problemas comunes](docs/PROBLEMAS_COMUNES.md) |

Documentación específica:

- [Contexto seguro de cada proyecto](docs/CONTEXTO_PROYECTO.md)
- [Ejecución de previews con Docker Compose](docs/EJECUCION_DE_PROYECTOS.md)
- [Objetivo y alcance del producto](NOTAS.md)
- [Decisiones de interfaz](DESIGN.md)

## Instalación rápida con Docker

```bash
cp .env.example .env
# Edita PAGOBLI_ACCESS_KEY y PAGOBLI_ADMIN_*.
docker compose up --build -d
```

Abre `http://localhost:8080` e inicia sesión con la cuenta administradora definida en `.env`.
La guía de operación explica cómo conectar OpenCode, preparar una plantilla Laravel y habilitar
previews por proyecto.

## Desarrollo local

Requiere Node.js 22 o superior; la imagen Docker usa Node.js 24.

```bash
npm install
npm run dev        # frontend en http://localhost:5173
PAGOBLI_ACCESS_KEY=una-clave-larga npm start  # API en http://localhost:8080
npm test
npm run typecheck
npm run build
```

En desarrollo, Vite reenvía `/api` al backend del puerto 8080. Para activar cuentas locales,
define también `PAGOBLI_ADMIN_EMAIL` y `PAGOBLI_ADMIN_PASSWORD` antes de iniciar el backend.

## Estado actual

- Cuentas, roles y espacios de trabajo.
- Proyectos de demostración y proyectos reales conectados a OpenCode.
- Creación opcional desde una plantilla Laravel y runtime Docker Compose por proyecto.
- Contexto seguro desde archivos del proyecto, preguntas, permisos e historial de OpenCode.

Las fichas, conversación y versiones del proyecto se guardan por ahora en el navegador de cada
persona, separados por cuenta y espacio. La cuenta, los espacios y los roles se conservan en el
volumen Docker. La persistencia compartida de proyectos es el siguiente bloque de producto.

Proyecto abierto bajo licencia [MIT](LICENSE).

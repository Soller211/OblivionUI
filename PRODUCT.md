# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Directivos y personal de proyectos de la empresa que instala PagObli. No programan y no
quieren aprender a programar. Su trabajo real es de negocio: describen un proceso que hoy
resuelven con hojas de cálculo, correos o papel, y necesitan que exista como aplicación.
Entran al sistema desde la laptop de trabajo, en jornada laboral, normalmente entre otras
tareas y con poca paciencia para detalle técnico.

Audiencia secundaria confirmada: el administrador técnico de la instalación, que conecta
OpenCode, define plantillas y directorios, y resuelve problemas de infraestructura. Es la
única persona a la que le corresponde ver vocabulario técnico.

## Product Purpose

Permitir que una persona sin perfil técnico obtenga una aplicación real describiendo lo que
necesita en lenguaje de negocio, sin abrir nunca la interfaz técnica de OpenCode. Éxito es
que un directivo cree un proyecto, pida un cambio, lo vea funcionando y recupere una versión
anterior sin pedir ayuda a nadie de sistemas.

## Positioning

PagObli no es un chat de IA ni un IDE: es la capa de experiencia sobre una instancia propia
de OpenCode que ya corre en el servidor de la empresa, con un modelo local. A diferencia de
herramientas en la nube, el código, los datos y el modelo no salen de la organización, y a
diferencia de OpenCode directo, traduce cada decisión técnica (permisos, preguntas, errores,
reversiones) a una decisión de negocio que el usuario puede tomar con lo que ya sabe.

## Operating Context

- Herramienta interna: una instalación por empresa, en su propio servidor, tras su red.
- Uso principal en laptop/escritorio (1280–1920px). Móvil no es escenario de trabajo real.
- Idioma único: español (es-MX). Fechas y formatos locales.
- El trabajo es asíncrono y lento: OpenCode puede tardar minutos en responder una petición,
  y mientras tanto puede pedir permisos o hacer preguntas que bloquean el avance.
- Existe una base/plantilla Laravel y contenedores donde viven los proyectos generados.
- Dos ámbitos de configuración: usuario final (su proyecto) y administrador (conexión,
  plantillas, directorios, credenciales).

## Capabilities and Constraints

Capacidades actuales, todas ya implementadas y que el rediseño debe preservar:

- Listado, creación (2 pasos: idea + 3 preguntas de negocio) y borrado de proyectos.
- Dos modos por proyecto: `demo` (vista ilustrativa generada localmente, no ejecuta código
  real) y `live` (sesión real contra OpenCode). El modo debe ser siempre inequívoco.
- Espacio de trabajo: conversación, vista previa (iframe de demo o URL real del proyecto) e
  historial. En `live` el historial permite volver al estado anterior a una solicitud y
  deshacer esa recuperación. En escritorio se ajusta el ancho de los paneles y la vista previa
  puede ampliarse a pantalla completa.
- La pantalla inicial ofrece ejemplos que rellenan la idea y se pueden editar antes de crear
  el proyecto. La demostración usa su propio estado visual: «Ejemplo listo para explorar».
- Cola de pendientes: OpenCode solicita permisos (editar archivos, ejecutar comandos, salir
  del proyecto, red) y hace preguntas de opción múltiple; el usuario responde sin salir del
  espacio de trabajo. Se consulta por sondeo cada 2.5 s.
- Configuración de administrador: clave de la instalación, URL de OpenCode, usuario y
  contraseña, aprovisionamiento desde plantilla o directorio existente, desconexión.
- Con configuración opcional de runtime: al crear desde plantilla, inicia el Docker Compose del
  proyecto, espera sus health checks y asigna la URL de vista previa calculada por la instalación.
- Estados de avance en lenguaje comprensible y diferenciados por modo. La demostración solo
  indica que prepara o actualiza un ejemplo; no afirma que haya verificado código real.

Restricciones técnicas:

- Frontend React 19 + TypeScript + Vite con Tailwind CSS v4, shadcn/ui y `motion`.
  Tipografías Geist y Geist Mono auto-hospedadas: la instalación vive en red interna y no
  puede depender de una CDN externa.
- Estado en `localStorage` del navegador; el servidor Node (`server.mjs`) guarda las
  credenciales solo en memoria durante la sesión.
- Enrutado por hash, sin router.
- Sin backend multiusuario: no hay cuentas, roles ni permisos por persona todavía.

Decisiones abiertas, que no deben darse por hechas: autenticación de usuarios y roles,
publicación de proyectos terminados, edición visual sobre la vista previa, almacenamiento
persistente en servidor.

## Brand Commitments

La marca del producto es **OblivionUI**, y así aparece en toda la interfaz. `PagObli` queda
únicamente como nombre del repositorio y prefijo de las variables de entorno
(`PAGOBLI_ACCESS_KEY`), que no se renombran para no romper instalaciones existentes.

Color de marca: **morado/violeta**, decisión del cliente. El producto se construye con
Tailwind CSS v4 + shadcn/ui (primitivas Radix) + `motion`, y esa convención de componentes
es un compromiso explícito: el cliente pidió no fabricar componentes a mano. Productos de
referencia que fijan el nivel de acabado: bklit.com y tasteskill.dev.

Tema claro y oscuro reales, con interruptor; al abrir se sigue la preferencia del sistema
operativo.

Voz confirmada por el producto: honesta y sin tecnicismos. Un cambio solo se anuncia como
listo cuando se comprobó; los errores se explican con el siguiente paso claro; lo que la
plataforma no entendió se anota tal cual en lugar de fingir que se resolvió.

## Evidence on Hand

- `NOTAS.md`: objetivo, contexto y etapas acordadas con el equipo.
- `README.md`, `compose.yaml`, `Dockerfile`, `.env.example`: instalación real.
- `server.mjs`, `opencode.mjs`, `provision.mjs` con pruebas: la integración con OpenCode
  existe y funciona, no es una promesa.
- No hay clientes, testimonios, métricas de uso, capturas de proyectos generados ni logotipo.
  Nada de eso debe inventarse en la interfaz.

## Product Principles

1. **El usuario nunca ve el motor.** OpenCode, sesiones, directorios y comandos son detalle
   de administrador; el usuario ve proyectos, cambios y versiones.
2. **Honestidad antes que apariencia de progreso.** Demostración se etiqueta como
   demostración; un error se dice completo y con salida; nada se marca listo sin verificar.
3. **La espera es parte del producto.** Minutos de trabajo de la IA deben verse como avance
   comprensible, no como una pantalla congelada.
4. **Una decisión a la vez.** Permisos y preguntas se presentan como elecciones de negocio,
   en el momento en que bloquean, con consecuencia explícita.
5. **Lo destructivo se confirma.** Borrar un proyecto o revertir el trabajo pide confirmación
   y explica qué se pierde.

## Accessibility & Inclusion

Sin requisito normativo declarado por el cliente. Mínimos que el producto asume por su
audiencia: contraste AA en texto e interfaz, foco visible y navegación completa por teclado
(el flujo principal es escribir), objetivos táctiles y de puntero cómodos, estados de carga
y error anunciados a lectores de pantalla, y respeto a `prefers-reduced-motion`.

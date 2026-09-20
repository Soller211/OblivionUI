---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/Workspace.tsx","src/PendingDock.tsx","src/index.css","src/components/marca.tsx"]
---

# Surface brief — OblivionUI (aplicación completa)

Scope: toda la aplicación web (lista de proyectos, alta de proyecto, espacio de trabajo,
configuración). Visitor mode: **Operate**.

Audiencia: directivos y personal de proyectos sin perfil técnico, en laptop, en jornada
laboral. Tarea: crear un proyecto, pedir cambios, autorizar lo que OpenCode necesita,
revisar la vista previa y recuperar versiones. Restricciones: React 19 + TypeScript + Vite,
Tailwind v4 + shadcn/ui + motion, sin CDN externa (red interna), español es-MX, sin
multiusuario todavía.

Momento memorable: el cambio de estado del trabajo —los puntos que laten junto al estado
mientras OpenCode construye— y la bandeja ámbar que retiene el trabajo hasta que la persona
autoriza.

Decisiones abiertas: autenticación y roles, publicación de proyectos, edición visual sobre
la vista previa.

## Direction contract

THESIS: OblivionUI es el producto de categoría ejecutado a nivel de producto comercial: el
usuario pide en lenguaje de negocio y la plataforma responde con estado visible, vista previa
y versiones recuperables. El usuario tomó explícitamente la salida de convención de la mesa
de decisión —descartó el mundo «Acuse de Recibo» por parecerle simple— y fijó dos productos
como nivel de acabado: bklit.com y tasteskill.dev. Lo que se rechaza no es la convención sino
su versión floja: componentes desalineados, estados a medias y animación decorativa.

OWN-WORLD: identidad OblivionUI en violeta sobre tokens OKLch, con tema claro y oscuro reales
(`--primary` oklch(0.52 0.23 296) en claro, oklch(0.66 0.2 297) en oscuro) y un único
resplandor radial de marca fijo detrás del contenido. Componentes shadcn/ui sobre Radix, radio
0.625rem, bordes de 1px, sombras mínimas; Geist para interfaz y Geist Mono tabular para
folios, horas y rutas. Cuatro tonos semánticos que nunca decoran: violeta = marca, acción
principal, selección, foco y proyecto real; rosa apagado = demostración sin código real;
ámbar = retenido esperando autorización; verde = verificado y listo para revisar. Animación
con motion, 220 ms y curva (0.22, 1, 0.36, 1): entrada de ruta, filas escalonadas, subrayado
de navegación compartido y los puntos del estado de trabajo; nada más se mueve.

STORY: la persona entiende de un vistazo qué proyectos tiene, cuáles son reales y cuáles
demostración; cree que el sistema no avanza a sus espaldas porque el estado se ve cambiar y
todo cambio queda como versión recuperable; y actúa creando un proyecto o resolviendo lo que
está retenido esperando su autorización.

FIRST VIEWPORT (lista de proyectos, 1440×900): barra superior translúcida de 56px con el
logotipo OblivionUI, navegación, selector de tema, y debajo la franja de estado de la
instalación en su tono. Luego el encabezado de página —«Tus proyectos» en 30px, subtítulo, y
«Nuevo proyecto» en violeta a la derecha— y una tarjeta con la tabla de ancho fijo: FOLIO ·
PROYECTO · ESTADO · ÚLTIMO MOVIMIENTO · acciones, folios y fechas en mono tabular, estado
como insignia con icono, filas que entran escalonadas. Bajo 640px la tabla se sustituye por
una tarjeta por proyecto, nunca por una tabla recortada. Pie con marca, estado de conexión y
dónde viven los datos.

FORM: salida de convención (canon) tomada por el usuario tras ver la mesa de decisión del
sorteo 8768ec8f; el nivel de acabado lo fijan los dos productos que nombró. La dirección
anterior, «Acuse de Recibo», queda retirada y sustituida, no mezclada.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
the verdict, DESIGN.md, and every shipping raster carrying its provenance.

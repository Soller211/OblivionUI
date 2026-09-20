---
name: OblivionUI
description: Consola interna en violeta OKLch donde el estado del trabajo siempre está a la vista.
colors:
  primary: "oklch(0.52 0.23 296)"
  primary-dark: "oklch(0.66 0.2 297)"
  primary-foreground: "oklch(0.99 0.01 300)"
  background: "oklch(0.99 0.004 300)"
  background-dark: "oklch(0.155 0.018 292)"
  foreground: "oklch(0.19 0.02 295)"
  card: "oklch(1 0 0)"
  muted: "oklch(0.965 0.008 300)"
  muted-foreground: "oklch(0.51 0.03 295)"
  accent: "oklch(0.95 0.025 300)"
  border: "oklch(0.92 0.012 300)"
  demo: "oklch(0.49 0.11 345)"
  demo-bg: "oklch(0.975 0.012 345)"
  hold: "oklch(0.52 0.12 75)"
  hold-bg: "oklch(0.96 0.05 85)"
  ok: "oklch(0.5 0.12 160)"
  ok-bg: "oklch(0.955 0.035 160)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tabular-nums"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  4xl: "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "oklch(0.52 0.23 296 / 80%)"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.lg}"
    height: "36px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "4px 12px"
    height: "40px"
    typography: "{typography.body}"
  estado-real:
    backgroundColor: "oklch(0.52 0.23 296 / 10%)"
    textColor: "{colors.primary}"
    rounded: "{rounded.4xl}"
    padding: "2px 8px"
    height: "20px"
    typography: "{typography.label}"
  estado-demo:
    backgroundColor: "{colors.demo-bg}"
    textColor: "{colors.demo}"
    rounded: "{rounded.4xl}"
    padding: "2px 8px"
    height: "20px"
  estado-hold:
    backgroundColor: "{colors.hold-bg}"
    textColor: "{colors.hold}"
    rounded: "{rounded.4xl}"
    padding: "2px 8px"
    height: "20px"
  estado-ok:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok}"
    rounded: "{rounded.4xl}"
    padding: "2px 8px"
    height: "20px"
  franja-instalacion:
    backgroundColor: "{colors.demo-bg}"
    textColor: "{colors.demo}"
    padding: "10px 24px"
    typography: "{typography.body}"
---

# Design System: OblivionUI

## Overview

**Creative North Star: "El expediente vivo"**

OblivionUI es una consola interna que se comporta como un expediente en marcha: cada proyecto
tiene folio (`EXP-0001`), estado visible, movimientos fechados y versiones recuperables. El
mundo es de convención bien ejecutada —superficies claras, un solo acento violeta, tipografía
Geist, retícula estricta— y toda su expresividad se concentra en un punto: decirle a la persona,
sin lenguaje técnico, en qué estado está el trabajo y si el sistema está esperando algo de ella.

La densidad es de herramienta de trabajo, no de página de marketing: botones de 36px y campos de 40px,
tarjetas con relleno de 16px, texto de cuerpo en 14px y cifras en mono tabular. La única luz del
mundo es un resplandor radial violeta fijo detrás del contenido (una sola fuente, arriba al
centro), que existe para que el violeta de marca se sienta presente sin repetirlo por toda la
pantalla. Claro y oscuro son dos mundos reales, no una inversión: el oscuro sube la luminosidad
del acento (de 0.52 a 0.66) y adelgaza los bordes a transparencias.

Lo que se rechaza explícitamente es la convención floja: componentes desalineados, estados a
medias y animación decorativa. Los componentes vienen de shadcn/ui sobre Radix y se componen,
no se reestilizan; el color semántico hace el trabajo de comunicación que en otros productos
hace el adorno.

**Key Characteristics:**
- Cuatro tonos semánticos que nunca decoran: violeta, rosa, ámbar y verde significan una cosa cada uno.
- Superficies planas con anillo de 1px; profundidad por capas tonales, no por sombras.
- Un solo resplandor de marca, fijo detrás de todo el contenido.
- Geist para interfaz, Geist Mono tabular para folios, horas y rutas; ambas autoalojadas.
- Una sola duración (0.22s) y una sola curva para todo lo que se mueve.
- Español es-MX en toda la interfaz; la marca visible es OblivionUI.

## Colors

Paleta de un solo acento violeta sobre neutros con la misma familia de matiz (h≈292–300), más
tres tonos semánticos que solo aparecen cuando significan algo.

### Primary
- **Violeta OblivionUI** (`oklch(0.52 0.23 296)` en claro, `oklch(0.66 0.2 297)` en oscuro): marca,
  acción principal, selección de texto, cursor de escritura, anillo de foco, barra de progreso,
  subrayado de navegación activa, pulgar del scrollbar y la insignia de «Proyecto real». Es el
  único color que puede aparecer en un fondo sólido (botón principal, burbuja del usuario).

### Secondary
- **Rosa demostración** (`--demo`): marca todo lo que es ilustrativo y no ejecuta código real:
  franja de instalación en modo demostración, insignia «Demostración», cinta sobre la vista previa.
- **Ámbar retenido** (`--hold`): el trabajo está detenido esperando a una persona. Solo lo usa la
  bandeja de pendientes de OpenCode (permisos y preguntas), su insignia «Retenido» y la franja de
  instancia no disponible.
- **Verde verificado** (`--ok`): trabajo terminado y comprobable: «Conectado», «Listo para revisar»,
  «Vigente».

### Neutral
- **Lienzo violeta pálido** (`--background`): fondo de la aplicación; en oscuro, casi negro azulado.
- **Superficie de tarjeta** (`--card`): blanco puro en claro, un escalón por encima del fondo en oscuro.
- **Tinta** (`--foreground`) y **tinta apagada** (`--muted-foreground`): texto principal y secundario,
  metadatos, folios y horas.
- **Malla** (`--border` / `--input`): separadores, bordes de 1px y contornos de campo; en oscuro es
  una transparencia clara (12%/16%), nunca un gris sólido.
- **Rojo destructivo** (`--destructive`): solo errores y la acción de eliminar; no es un quinto tono
  semántico del flujo de trabajo.

### Named Rules
**La regla de los cuatro significados.** Violeta = real, rosa = demostración, ámbar = retenido,
verde = verificado. Un tono no se usa nunca porque quede bien: si un elemento no está diciendo una
de esas cuatro cosas, es neutro.

**La regla de una sola luz.** Hay exactamente un resplandor en el producto: el radial violeta fijo
detrás del contenido (`background-attachment: fixed`, 34% en claro, 26% en oscuro). Ninguna otra
superficie tiene gradiente de color; los únicos gradientes adicionales son las máscaras de
desvanecido hacia el borde inferior de las listas con scroll.

**La regla del tono sobre fondo.** Cada tono semántico viaja en pareja: texto en el tono, fondo en
su `-bg` y borde en el tono al 25–35% de opacidad. Nunca texto de tono sobre fondo neutro suelto.

## Typography

**Display / Body Font:** Geist Variable (ui-sans-serif, system-ui, sans-serif)
**Mono Font:** Geist Mono Variable (ui-monospace, monospace)

**Character:** Geist es neutra, de caja alta generosa y sin gestos; aquí lleva `cv11` y `ss01`
activadas, lo que endereza la «l» y la «a» y hace legible el texto denso de la consola. Toda la
personalidad tipográfica está en el contraste entre la sans de interfaz y la mono tabular que
lleva folios, horas y rutas: lo que es dato se ve como dato.

### Hierarchy
- **Display** (600, 24px → 30px ≥640px, `tracking-tight`): título de página («Tus proyectos»,
  «Configuración»). Uno por vista.
- **Headline** (600, 20px): título de tarjeta en los pasos de alta.
- **Title** (600, 16px / 14px en cabeceras de panel): títulos de tarjeta de configuración, nombre
  del proyecto en el espacio de trabajo, encabezado de una tarjeta de autorización.
- **Body** (400, 14px): texto de conversación, descripciones, celdas de tabla. Los párrafos largos
  van con `text-pretty` y ancho máximo de ~24rem cuando están centrados.
- **Label** (500, 12px): etiquetas de campo, pies de ayuda, pie de página, insignias de estado.
- **Mono** (400, 10–12px, `tabular-nums`): folios `EXP-0000`, claves de versión `EXP-0001-03`,
  horas, fechas, URL del servidor, directorios y comandos.

### Named Rules
**La regla del dato tabular.** Todo número que se compare en vertical —folio, hora, fecha, clave de
versión, conteo de versiones— va en Geist Mono con `font-variant-numeric: tabular-nums` (clase
`.tabular`). Los números dentro de una frase no.

**La regla de la caja baja.** Los títulos y etiquetas van en caja normal en español. La única
excepción del build es el contador de pasos («PASO 1 DE 2», 12px, `tracking-wide`), que es un
indicador de progreso acompañado de su barra, no un rótulo decorativo.

## Layout

Columna única centrada, con tres anchos de contenedor según la tarea: registro de proyectos
`max-w-6xl` (72rem), formularios de alta y configuración `max-w-2xl` (42rem), y espacio de trabajo
`max-w-[1600px]` a pantalla completa. El relleno lateral es 16px y sube a 24px desde 640px; el
vertical es 32px y sube a 40px.

La aplicación ocupa exactamente el alto de la ventana (`h-dvh`) y se divide en tres bandas fijas:
barra superior de 56px translúcida con desenfoque (`bg-background/80`, `backdrop-blur-md`, pegada
arriba), franja de estado de la instalación (solo cuando aporta información), y el área principal
que hace scroll. El pie aparece únicamente fuera del espacio de trabajo.

El ritmo de espaciado es de 4px: 4, 8, 12, 16, 24, 40. Las separaciones internas de tarjeta son de
16px (12px en cabeceras densas), los grupos de campo van a 8px y los bloques de formulario a 20px.

**Puntos de quiebre.** 640px (`sm`): la tabla de proyectos se sustituye por una tarjeta por
proyecto —nunca por una tabla recortada—, aparecen las frases de apoyo ocultas en móvil y el
logotipo recupera su palabra. 1024px (`lg`): el espacio de trabajo pasa de una columna apilada a
dos paneles con un separador ajustable: la conversación empieza al 34% (mínimo 320px) y puede
ocupar entre el 25% y el 55%; el resto se reserva a vista previa e historial. La vista previa
también puede ampliarse a pantalla completa. En móvil los paneles se apilan y el área principal
permite desplazarse entre ellos.
1280px (`max-lg:hidden`): la columna «Último movimiento» de la tabla solo existe a partir de ahí.

## Elevation & Depth

El sistema es plano. La profundidad se consigue por capas tonales y hairlines, no por sombras: las
tarjetas se separan del fondo con un anillo de 1px (`ring-1 ring-foreground/10`) y un fondo más
claro que el lienzo; las cabeceras y pies de panel se hunden con `bg-muted/40`; la barra superior
se separa por translucidez y desenfoque, no por sombra. La única capa real es el diálogo modal de
Radix, con su velo oscuro.

### Shadow Vocabulary
- **Sombra de tarjeta retenida** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.05)`, `shadow-xs`): única
  sombra del producto, sobre las tarjetas de autorización dentro de la bandeja ámbar, para que
  floten un milímetro por encima de su bandeja. No se usa en ninguna otra superficie.

### Named Rules
**La regla del hairline.** Toda separación es un borde de 1px en `--border`. Si dos superficies
necesitan distinguirse, se cambia el tono del fondo antes que añadir sombra.

**La regla del desvanecido.** Las listas con scroll (conversación, bandeja de pendientes) terminan
en una máscara de 20–24px hacia transparente del color de su propio contenedor, para que el corte
no parezca el final del contenido.

## Shapes

Radio base 10px (`--radius: 0.625rem`) con una escala derivada por multiplicación: 6, 8, 10, 14, 18,
22 y 26px. Los controles (botón, campo, opción seleccionable) van a 10px; las tarjetas y paneles a
14px; las burbujas de conversación a 14px con la esquina del lado del hablante recortada a 6px, que
es el único gesto de forma del producto. Las insignias de estado usan el radio de 26px sobre 20px de
alto, es decir, píldora.

Los bordes son siempre de 1px. La variante punteada (`border-dashed`) marca la burbuja de
apertura del expediente. Los iconos son SVG de
Lucide a 12, 14 o 16px, alineados al texto; el logotipo es un cuadrado de 28px con radio 8px, un
degradado violeta y un anillo interrumpido en blanco —la «O» que se está construyendo.

## Components

Los componentes son shadcn/ui sobre Radix, instalados con `npx shadcn@latest add <nombre>`.
El proyecto compone y aplica color semántico; ajusta el tamaño base de botones y campos para
mejorar la lectura sin cambiar sus patrones de interacción.

### Buttons
- **Shape:** esquinas suaves (10px), alto 36px por defecto y en `size="sm"`, cuadrado de 36px
  en `size="icon"`.
- **Primary:** violeta sólido con texto casi blanco, relleno horizontal de 10px y separación de 6px
  entre icono y texto. Es la única acción violeta de cada vista.
- **Hover / Focus:** el fondo baja al 80% de opacidad; el foco visible dibuja borde en `--ring` más
  un anillo de 3px al 50%; al pulsar, el botón se desplaza 1px hacia abajo.
- **Outline:** fondo de superficie con borde de malla, para acciones secundarias («Atrás»,
  «Recuperar», «No autorizar»).
- **Ghost:** sin fondo y con texto apagado, para navegación, acciones de fila y el selector de tema;
  el icono de eliminar pasa a rojo destructivo solo al hover.

### Insignia de estado (Estado)
- **Style:** píldora de 20px de alto, 12px, peso 500, con icono de 12px opcional; borde del tono al
  35%, fondo `-bg` del tono y texto en el tono.
- **Tonos:** `real` (violeta sobre violeta al 10%), `demo` (rosa), `hold` (ámbar), `ok` (verde) y
  `neutro` (malla sobre `--muted`). El estado de un trabajo en curso se mapea por nombre, no se elige
  a mano.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** `--card`; las cabeceras y pies internos bajan a `bg-muted/40`.
- **Shadow Strategy:** ninguna; anillo de 1px al 10% de la tinta (ver Elevation & Depth).
- **Border:** hairline interno de 1px entre cabecera, cuerpo y pie.
- **Internal Padding:** 16px (12px en barras de cabecera y en la bandeja de pendientes).

### Inputs / Fields
- **Style:** fondo transparente, borde de 1px en `--input`, radio 10px, alto 40px; el área de texto
  crece de 80px a 160px y no se redimensiona a mano.
- **Focus:** el borde toma `--ring` y aparece un anillo de 3px al 50%; el cursor es violeta.
- **Error:** el mensaje va en rojo destructivo a 12px bajo el campo, con `role="alert"`.
- **Opción seleccionable:** las etiquetas con casilla o radio dentro son cajas de 12px de relleno con
  borde de 1px; al elegirlas el borde pasa a violeta al 50% y el fondo a violeta al 5%.

### Navigation
- Enlaces en botón fantasma pequeño; el inactivo va en tinta apagada y el activo en tinta plena con
  una barra violeta de 2px pegada al borde inferior de la barra, compartida entre pestañas mediante
  `layoutId` para que se deslice de una a otra. En móvil el logotipo se reduce a la marca y el
  botón «Nuevo proyecto» a su icono.

### Franja de instalación
Banda de ancho completo bajo la barra superior, 14px, con icono de 16px, borde inferior del tono al
25% y fondo `-bg` al 60%. Existe en tres tonos y solo en tres: verde (OpenCode conectado), ámbar
(la instancia no responde) y rosa (modo demostración). Entra animando su altura desde cero.

### Bandeja de pendientes (PendingDock)
La capa retenida: se ancla al pie del panel de conversación, ocupa como máximo 56vh, va sobre
`--hold-bg` al 40% con borde superior ámbar, y dentro lleva tarjetas de superficie con borde ámbar
al 30%. Encabeza con la insignia «Retenido» y la cuenta de pendientes, y es la única región del
producto con `aria-live="polite"`. Mientras existe, el trabajo está detenido: nada más en pantalla
debe sugerir avance.

### Estado de trabajo (los puntos)
Junto a la insignia del estado actual laten tres puntos de 6px en violeta al 60%, con opacidad
0.25 → 1 → 0.25, ciclo de 1.1s y desfase de 0.18s entre ellos. Es la única animación en bucle del
producto y solo aparece mientras hay trabajo en curso.

### Motion
- **Duración y curva únicas:** 0.22s con `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Dónde se usa:** entrada de ruta (opacidad + 8px), filas y versiones escalonadas (6px, retardo de
  0.04s por fila con tope en 0.2s), subrayado compartido de navegación, barra de progreso del alta y
  apertura de las franjas por altura.
- **Gobierno:** todo pasa por `MotionConfig reducedMotion="user"`; quien pide menos movimiento en su
  sistema operativo no recibe ninguno.

## Do's and Don'ts

### Do:
- **Do** traer componentes nuevos con `npx shadcn@latest add <nombre>` y componerlos; el color
  semántico se aplica por clase encima, no reescribiendo el componente.
- **Do** usar cada tono por su significado: violeta real, rosa demostración, ámbar retenido, verde
  verificado; y siempre en pareja tono + `-bg` + borde al 25–35%.
- **Do** escribir folios, horas, fechas, rutas y comandos en Geist Mono con `.tabular`.
- **Do** mover las cosas con 0.22s y `cubic-bezier(0.22, 1, 0.36, 1)`, y nada más.
- **Do** sustituir la tabla por una tarjeta por proyecto bajo 640px.
- **Do** separar superficies con un hairline de 1px o un escalón tonal (`bg-muted/40`).
- **Do** mantener los textos en español es-MX y la marca visible como OblivionUI.

### Don't:
- **Don't** añadir sombras para dar profundidad; la única sombra del sistema es la `shadow-xs` de las
  tarjetas de autorización.
- **Don't** introducir un segundo resplandor, degradado de color o fondo decorativo: hay una sola luz.
- **Don't** usar violeta, rosa, ámbar o verde como adorno, ni inventar un quinto tono semántico.
- **Don't** animar nada con otra duración o curva, ni añadir animaciones en bucle además de los puntos
  del estado de trabajo.
- **Don't** depender de recursos externos (CDN de fuentes o iconos): la instalación corre en red
  cerrada y Geist y Geist Mono se sirven desde el propio paquete.
- **Don't** mostrar vocabulario técnico de OpenCode fuera de las zonas de administrador; el resto de
  la interfaz habla en lenguaje de negocio.
- **Don't** recortar la tabla ni ocultar el estado de un proyecto para ganar espacio.

# Guía de uso

Esta guía está escrita para quienes crean o revisan proyectos. No necesitas conocer OpenCode,
Docker, Laravel ni el modelo de IA.

## Antes de empezar

Una persona administradora debe darte una cuenta. Entra a la dirección de OblivionUI, escribe tu
correo y la contraseña inicial. Si perteneces a más de un espacio, elige el que aparece arriba a
la derecha. Cada espacio representa un equipo, área u organización y mantiene separados sus
proyectos y conexión de trabajo.

## Crear un proyecto

1. Abre **Proyectos** y elige **Nuevo proyecto**. También puedes tomar uno de los ejemplos.
2. Pon un nombre claro y describe el proceso como se lo explicarías a un compañero. Por ejemplo:
   “Las áreas solicitan presupuestos, Finanzas los revisa y Dirección autoriza los mayores a
   cierto monto”.
3. Responde quién solicita, quién autoriza y qué datos se capturan.
4. Elige **Crear proyecto**.

Si no hay una conexión configurada, el proyecto se abre como **Demostración**. Sirve para definir
tu idea y recorrer la interfaz; no crea archivos ni una aplicación real. Cuando la barra diga
**OpenCode conectado**, el administrador puede elegir crear un proyecto real desde la plantilla
preparada para su equipo.

## Trabajar dentro de un proyecto

La pantalla del proyecto tiene tres partes: la conversación, la vista previa y el historial.
Describe un cambio con el resultado que buscas, por ejemplo “agrega una fecha límite y no permitas
aprobar solicitudes vencidas”. No hace falta indicar archivos, comandos o tecnologías.

En un proyecto real, la plataforma muestra las respuestas de OpenCode en lenguaje directo. Puede
tardar algunos minutos. Si necesita una decisión, aparece una tarjeta:

- **Pregunta:** responde la decisión de negocio requerida y continúa.
- **Permiso:** lee qué acción quiere hacer. Autoriza una vez solo si corresponde al cambio que
  pediste; puedes rechazarlo.

La vista previa es el lugar para revisar lo que se construyó. Que se vea una pantalla no equivale
a que el proyecto esté publicado ni validado para producción: revisa el flujo con las personas que
lo usarán.

## Recuperar un cambio

Abre **Historial** dentro del proyecto y selecciona la solicitud a recuperar. OblivionUI pide a
OpenCode volver al estado anterior a esa solicitud. La recuperación queda como un cambio nuevo,
así que el historial anterior se conserva. Revisa de nuevo la vista previa antes de continuar.

## Diferencia entre demostración y proyecto real

| Estado | Qué significa |
| --- | --- |
| Demostración | La vista es ilustrativa y solo vive en este navegador. |
| Proyecto real | Existe una sesión de OpenCode y los cambios se envían al servidor configurado. |
| Vista previa | Dirección donde se ejecuta el proyecto real. Puede requerir acceso a la red interna. |

## Cuidar la información

No escribas contraseñas, tokens, datos personales reales ni secretos en la conversación. Usa
nombres o datos de prueba mientras el proyecto está en construcción. Si necesitas acceso a otro
espacio o no puedes abrir un proyecto, contacta a la persona administradora.

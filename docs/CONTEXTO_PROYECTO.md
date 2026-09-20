# Contexto de un proyecto

Cada contenedor de OpenCode puede mantener el contexto junto a su código. OblivionUI solo
consulta estos cuatro archivos en el directorio del proyecto:

| Archivo | Uso |
| --- | --- |
| `AGENTS.md` | Reglas técnicas que OpenCode debe respetar. OblivionUI confirma que existe, pero no muestra su contenido. |
| `NOTAS.md` | Decisiones y notas del equipo. OblivionUI confirma que existe, pero no muestra su contenido. |
| `PROJECT.md` | Resumen legible del proyecto para el equipo. |
| `.pagobli/context.json` | Datos estructurados y seguros para presentar una ficha en OblivionUI. |

Al crear la primera sesión real, OblivionUI pide a OpenCode que revise estos archivos antes de
trabajar. Los mensajes posteriores siguen en el mismo directorio y respetan las reglas que
OpenCode ya cargó.

## Archivo de configuración

Crea `.pagobli/context.json` con solo datos que sea seguro mostrar en la interfaz. Los campos
admitidos son:

```json
{
  "name": "Aprobación de presupuestos",
  "description": "Las áreas solicitan presupuestos y las personas responsables los revisan.",
  "template": "Laravel base",
  "status": "En revisión",
  "previewUrl": "https://presupuestos.interno",
  "features": {
    "preview": true,
    "history": true,
    "visualEditing": false
  }
}
```

No guardes claves, contraseñas, tokens, comandos ni rutas del servidor en ese archivo.
OblivionUI descarta cualquier campo que no pertenezca a esta lista antes de enviarlo al
navegador.

Cuando PagObli crea un proyecto desde una plantilla y ese archivo no existe, genera una versión
inicial con el nombre del proyecto y las capacidades desactivadas. Si la plantilla ya incluye
`.pagobli/context.json`, PagObli lo conserva.

## Aislamiento por contenedor

Un contenedor de OpenCode debe exponer únicamente su propia carpeta de trabajo. Conecta cada
instalación de OblivionUI a la URL del OpenCode correspondiente al usuario o al equipo. Así, la
API de archivos solo puede ver el directorio que ya ve esa instancia de OpenCode.

# Problemas comunes

## No aparece la pantalla de acceso

Las cuentas solo se activan si se definieron `PAGOBLI_ADMIN_EMAIL` y
`PAGOBLI_ADMIN_PASSWORD` antes del primer arranque. Comprueba las variables dentro del contenedor
y reinicia el servicio. Si el volumen ya tiene cuentas, usa la cuenta existente: las variables no
la reemplazan.

## No puedo iniciar sesión

Confirma correo y contraseña. La cuenta inicial vive en el volumen `pagobli-data`. No elimines el
volumen para “reiniciar” una instalación que ya se esté usando: perderías las cuentas. Si no existe
otro propietario, respalda el volumen y aplica un procedimiento de recuperación controlado.

## OpenCode no conecta

1. Revisa que `PAGOBLI_ACCESS_KEY` esté definida en el contenedor y sea la misma que escribes.
2. Comprueba la URL desde el contenedor, no solo desde tu laptop.
3. Si OpenCode corre en el host, usa `host.docker.internal`, no `localhost`.
4. Revisa `docker compose logs -f pagobli` y los logs de OpenCode.
5. Confirma usuario y contraseña si OpenCode tiene autenticación básica.

## Cambié de espacio y ya no aparece la conexión

Es esperado. Las conexiones OpenCode se aíslan por cuenta y espacio. Conecta la instancia adecuada
desde **Configuración** dentro del espacio nuevo.

## El proyecto real no muestra preview

Una sesión de OpenCode y una URL de preview son cosas distintas. Revisa que el proyecto esté
corriendo, que la URL sea accesible desde el navegador del usuario y que el proxy o DNS interno
resuelva su subdominio. Si usas arranque automático, verifica los health checks y la guía de
[ejecución](EJECUCION_DE_PROYECTOS.md).

## Falló la creación desde plantilla

Comprueba que la plantilla exista, que el directorio de proyectos sea escribible y que OpenCode
vea el mismo volumen bajo la ruta configurada. OblivionUI cancela la copia si no puede comprobar
ese aislamiento. Revisa las rutas `PAGOBLI_TEMPLATE_HOST_DIR`, `PAGOBLI_WORKSPACE_HOST_DIR` y
`PAGOBLI_OPENCODE_WORKSPACE_ROOT`.

## Un proyecto no aparece en otra computadora

Actualmente las fichas, mensajes y versiones se guardan en el navegador que las creó. Las cuentas
y espacios sí están en el servidor. La persistencia compartida de proyectos todavía no está
implementada.

## Quiero ver más detalle técnico

Los detalles útiles para administración están en los logs del contenedor. No pegues tokens,
contraseñas ni contenido de `AGENTS.md` en tickets o chats. Para entender qué contexto llega a la
interfaz, consulta [Contexto del proyecto](CONTEXTO_PROYECTO.md).

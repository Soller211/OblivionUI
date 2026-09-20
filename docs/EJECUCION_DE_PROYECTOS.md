# Ejecución automática de proyectos

OblivionUI puede iniciar la aplicación de cada proyecto recién creado con Docker Compose. Esta
función está apagada hasta que la instalación la habilita explícitamente.

## Requisitos de la plantilla

La plantilla Laravel debe incluir el archivo Compose definido por
`PAGOBLI_PROJECT_COMPOSE_FILE` (por defecto `compose.yaml`). Sus servicios deben tener
`healthcheck`: OblivionUI ejecuta `docker compose up --detach --wait` y solo anuncia la vista
previa cuando Docker informa que los servicios están listos.

Cada inicio recibe un nombre único derivado de la carpeta del proyecto. Las aplicaciones no
comparten contenedores, redes ni nombres de Compose entre sí. Para publicar cada preview, usa
un proxy interno con una regla que conozca ese nombre, por ejemplo:

No uses `container_name` fijo en la plantilla: Docker Compose ya asigna nombres únicos con el
nombre de proyecto que recibe de OblivionUI. El proxy debe poder enrutar cada subdominio al
servicio web correspondiente.

```text
https://{project}.apps.interna
```

`{project}` se sustituye por el identificador único de la carpeta creada, como
`aprobacion-de-presupuestos-a1b2c3d4`.

## Habilitarlo en la instalación

1. Configura la plantilla y el volumen compartido como se indica en el README.
2. Obtén el identificador numérico del grupo del socket Docker en el host:

   ```bash
   stat -c '%g' /var/run/docker.sock
   ```

3. En `.env`, define una URL que incluya literalmente `{project}` y el grupo obtenido:

   ```dotenv
   PAGOBLI_PROJECT_COMPOSE_FILE=compose.yaml
   PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE=https://{project}.apps.interna
   PAGOBLI_PROJECT_RUNTIME_TIMEOUT=120
   PAGOBLI_DOCKER_GID=999
   ```

4. Inicia PagObli con los tres archivos Compose:

   ```bash
   docker compose -f compose.yaml -f compose.provision.yaml -f compose.runtime.yaml up --build -d
   ```

El contenedor usa Docker solamente para el archivo Compose dentro del proyecto recién creado:
no acepta comandos Docker desde el navegador. Si el inicio o el health check falla, PagObli
detiene los servicios que alcanzó a crear y elimina la copia recién provisionada.

## Resultado

Al crear desde plantilla, PagObli copia la base, genera o conserva `.pagobli/context.json`,
arranca el Compose, espera la salud de los servicios, guarda la URL en el proyecto y después crea
la sesión de OpenCode. La aplicación queda disponible en la vista previa sin que la persona tenga
que pegar una dirección.

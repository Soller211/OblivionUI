# Notas del proyecto

## Objetivo

Crear una plataforma visual para que personas sin experiencia en programación puedan crear proyectos completos mediante instrucciones en lenguaje natural. La experiencia debe ser sencilla para directivos y personal de proyectos: describir lo que necesitan, responder preguntas de negocio, ver el resultado, pedir cambios y administrar sus proyectos sin tener que usar la interfaz técnica de OpenCode.

La plataforma usará OpenCode como motor de trabajo y podrá conectarse a un modelo local servido con vLLM. La conexión se configurará después de instalar la plataforma; no debe depender de la configuración particular del servidor actual.

## Contexto que platicamos

- Hoy el equipo abre la interfaz normal de OpenCode por un puerto. OpenCode y la IA local ya funcionan en un servidor potente.
- En el trabajo existe una base para proyectos Laravel y contenedores donde viven los proyectos. Actualmente se espera que la IA haga prácticamente todo dentro de ellos.
- El problema principal es la experiencia de uso: OpenCode explica decisiones y problemas técnicos que los usuarios no entienden. Se intentó modificar su interfaz, pero inyectar JavaScript resultó complicado.
- Los usuarios finales son directivos y personas de proyectos, no programadores.
- Se busca una experiencia amplia, similar en intención a Lovable, sin necesidad de copiarlo exactamente: creación, conversación, vista previa, edición visual, configuración e historial.
- No hace falta conocer ahora el comando exacto con que se ejecuta OpenCode. Primero se puede diseñar y construir la plataforma; más adelante cada instalación podrá conectar su servidor.

## Experiencia deseada

1. Una persona crea un proyecto y describe su idea con palabras de negocio.
2. La plataforma hace preguntas comprensibles para precisar procesos, usuarios, datos y aprobaciones.
3. La IA construye la aplicación sobre una base o plantilla configurada.
4. La persona ve avances claros y prueba el proyecto en una vista previa.
5. Puede pedir cambios por chat y, más adelante, seleccionar elementos de la vista previa para modificar textos, imágenes, colores o comportamiento.
6. Puede consultar el historial, recuperar una versión anterior, compartir el resultado y publicarlo cuando esté listo.

Ejemplo: «Necesito un sistema para aprobar presupuestos». La plataforma pregunta quién solicita, quién aprueba y qué datos se capturan; después muestra una primera versión funcional para revisarla.

## Enfoque propuesto

Construir una aplicación web propia que controle las pantallas y el flujo de usuario. Su backend se comunicaría con OpenCode mediante una capa de integración, y OpenCode trabajaría sobre el entorno del proyecto y el modelo configurado. Así, la experiencia de usuario no depende de alterar la interfaz existente de OpenCode.

La aplicación debe distinguir entre información para el usuario y detalles técnicos. Los avances se mostrarían como estados comprensibles, por ejemplo «Preparando», «Aplicando cambios», «Verificando» y «Listo para revisar». Las preguntas técnicas se convertirían en decisiones de negocio cuando sea posible. Los errores deben explicarse con honestidad y con un siguiente paso claro. Un cambio solo debe marcarse como listo tras comprobarlo.

La configuración se divide en dos ámbitos:

- **Usuarios finales:** proyecto, contenido, apariencia, pantallas y reglas de negocio.
- **Administradores:** conexión a OpenCode, plantillas o bases Laravel, herramientas permitidas, reglas de trabajo, verificación, acceso y publicación.

## Primer alcance acordado

La primera versión propuesta incluye:

- Inicio y listado de proyectos.
- Creación de un proyecto.
- Espacio de trabajo con conversación y vista previa.
- Historial básico del proyecto.
- Pantalla de configuración para conectar OpenCode después.
- Modo de demostración claramente identificado, para recorrer la experiencia sin afirmar que la IA ya está construyendo aplicaciones reales.

El recorrido que debería validarse primero, una vez conectada la ejecución real, es: crear proyecto desde una base, pedir una funcionalidad, verla funcionando, pedir un cambio y recuperar la versión anterior.

## Etapas posteriores propuestas

1. Verificar la API y las capacidades de la versión de OpenCode que use cada instalación; conectar sesiones, mensajes, eventos y preguntas.
2. Automatizar creación y aislamiento de proyectos y sus contenedores, usando la base Laravel existente u otras plantillas configurables.
3. Añadir preguntas guiadas, estados claros, comprobaciones y recuperación ante fallos.
4. Implementar edición visual sobre componentes que permitan relacionar elementos de la vista previa con el código correspondiente.
5. Incorporar usuarios y permisos, trabajo concurrente, versiones, revisión y publicación.

El aislamiento de proyectos y los permisos deben considerarse desde el diseño inicial, aunque sus funciones completas lleguen después.

## Puntos pendientes de definir

- Cómo se proporcionarán las plantillas Laravel y cómo se crearán los contenedores en cada instalación.
- Cómo se autenticarán los usuarios y qué permisos tendrá cada rol.
- Qué operaciones concretas permitirá la conexión a OpenCode según su versión.
- Cómo se servirán las vistas previas y cómo se publicarán los proyectos.
- Qué componentes o convenciones de las plantillas permitirán edición visual directa.
- Cómo se almacenarán proyectos, conversaciones, versiones y configuraciones en una instalación real.

## Estado actual del repositorio

Implementado el primer alcance como aplicación web React, TypeScript y Vite con un backend Node
pequeño. Hay listado y alta de proyectos, conversación, vista previa e historial para el modo
demostración. La vista ilustrativa usa la idea inicial para elegir un contexto básico y recuperar
una versión genera una entrada nueva en el historial.

El backend puede conectar una instancia propia de OpenCode mediante su API HTTP, crear una
sesión en un directorio existente y enviarle instrucciones reales. También puede copiar una
plantilla Laravel a un volumen compartido y verificar que OpenCode lea los mismos archivos.
La interfaz muestra preguntas y permisos pendientes y permite consultar solicitudes reales
y pedir a OpenCode una recuperación. La contraseña de OpenCode se mantiene solo en memoria
durante la sesión. Los metadatos y conversaciones de PagObli todavía se guardan en
`localStorage`; no hay cuentas ni base de datos compartida. Para los proyectos reales, la
vista previa requiere la URL de una aplicación que ya esté ejecutándose.

Hay pruebas unitarias y configuración Docker Compose. El contenedor de PagObli sirve la interfaz
y la API de conexión; puede copiar la base de un proyecto, pero todavía no crea ni coordina
su contenedor Laravel.
Ver `README.md` para uso y límites.

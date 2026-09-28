# Moodle Forum Toolkit

**Moodle Forum Toolkit** es un userscript para Tampermonkey orientado a docentes y tutores que necesitan consolidar, revisar y responder foros Moodle desde una interfaz unificada.

Autor: **Juan Pablo Moreno Ortiz**  
Licencia: **MIT**  
Donaciones voluntarias: **Llave @moreno3666**

> Proyecto independiente y no oficial. No está afiliado ni respaldado por Moodle Pty Ltd ni por una institución educativa específica.

## Funciones principales

- Configuración de uno o varios foros desde las páginas de curso o foro de una misma instalación Moodle.
- Detección automática de aulas con grupos separados o con grupo único.
- Consolidación multi-aula.
- Panel plegado por defecto; se despliega solo cuando el tutor pulsa **Mostrar** y recuerda su estado.
- Llave de donaciones voluntarias visible en el panel principal y en el pie de la Vista Conversaciones.
- Vista lista y vista de conversaciones reconstruidas por relación padre-respuesta.
- Detección de respuesta directa del tutor.
- Priorización de mensajes pendientes por antigüedad.
- Indicadores de atención para un plazo de 48 horas.
- Respuesta directa desde la herramienta.
- Inserción y carga de imágenes en respuestas directas y mensajes masivos mediante el editor nativo de Moodle cuando está disponible.
- Acceso a archivos adjuntos de los estudiantes.
- Envío masivo con modos de seguridad configurables y prevención de duplicados.
- Monitoreo y envío opcional mediante el correo interno de Moodle.
- Asistente de calificación para tareas con rúbrica o campo de nota directa, con preparación de 0 y retroalimentación institucional.
- Panel central de calificaciones con filtros y calificador nativo de Moodle embebido en la misma vista.
- Accesos rápidos configurables a actividades de calificación por curso.
- Documentos adjuntos en mensajes masivos de foro y correo interno, utilizando el gestor de archivos de Moodle.
- Exportación CSV.


## Novedades de la v1.15.0 (versión de prueba)

- Botón **📝 Calificaciones** disponible desde las páginas principales del curso, foros y páginas normales de tareas.
- Registro independiente de actividades de calificación. Desde la página principal del curso, el Toolkit detecta las tareas visibles y permite añadir las que se quieran conservar como accesos rápidos.
- Cada actividad configurada se abre directamente en su vista `action=grading`; no es necesario memorizar ni volver a buscar la URL.
- El panel central de calificaciones de la v1.14.0 se mantiene: filtros por entrega/estado y calificador nativo de Moodle embebido.
- **Mensaje masivo con documentos adjuntos**: además de imágenes, el editor permite seleccionar archivos mediante **📎 Adjuntar archivo**.
- Los documentos seleccionados se cargan mediante el gestor de archivos nativo de Moodle y se adjuntan a cada publicación del foro.
- Si también se selecciona **correo interno (CCO)**, los mismos documentos se adjuntan al correo interno.
- La identidad de la campaña y la verificación del foro incluyen los nombres/firmas de los adjuntos, para reducir duplicados y evitar considerar completa una publicación que omitió sus archivos.
- Los archivos siguen sujetos a los límites de tamaño, cantidad y tipos permitidos por la instalación Moodle.

## Novedades de la v1.14.0 (versión de prueba)

- **Panel central de calificaciones** para las páginas de calificación de tareas Moodle.
- Filtros por **Todos**, **No entregados**, **Entregados**, **Pendientes de calificar** y **Calificados**, utilizando los mismos estados del módulo `assign`.
- Lista de estudiantes a la izquierda y el **calificador nativo de Moodle** a la derecha, de modo que la rúbrica se puede completar sin abandonar el panel.
- Los estudiantes sin entrega muestran la acción **Calificar / aplicar 0**, manteniendo disponible el asistente de 0 puntos y observaciones.
- El asistente de calificación permite guardar al estudiante actual o guardar y avanzar al siguiente.
- El nombre del tutor se toma inicialmente del perfil Moodle cuando está disponible, pero se puede editar y conservar en el navegador mediante **Usar perfil**.
- La firma de la retroalimentación muestra el nombre seleccionado y debajo la función **Tutor**.
- Se mantiene la confirmación explícita por estudiante antes de guardar una calificación de 0.

## Novedades de la v1.13.0 (versión de prueba)

- **Asistente de calificación en tareas Moodle**: aparece en `mod/assign/view.php?action=grader`.
- Detecta rúbricas con campos `advancedgrading-criteria-...-score` y también intenta reconocer campos de calificación directa.
- Puede preparar **0 puntos** en los criterios, escribir la observación institucional y cargar una retroalimentación HTML.
- La fecha de oportunidad de recuperación es editable y se recuerda en el navegador; también puede desactivarse ese bloque.
- Incluye un botón de preparación sin guardar y otro de **Confirmar 0 y guardar / siguiente**.
- El panel comienza plegado por defecto y conserva la línea de donaciones voluntarias.
- No se incorporó el ciclo automático sin supervisión: cada estudiante requiere confirmación explícita antes de guardar la calificación.

## Novedades de la v1.12.1 (versión de prueba)

- **Correos** aparece como una tercera pestaña dentro de la misma ventana de resultados, junto a **Vista lista** y **Conversaciones**.
- El correo interno ya **no se consulta periódicamente**. La revisión se ejecuta solamente al entrar en **Correos** y pulsar **Actualizar**.
- La vista de Correos agrupa la información por aula y muestra los mensajes recibidos como **Pendiente** o **Contestado**, además de leído/no leído y acceso directo al mensaje.
- El estado Contestado se determina comparando los mensajes recibidos con las referencias de las respuestas enviadas por el tutor en el correo interno.
- Las imágenes insertadas en el editor del mensaje masivo ahora se cargan también **dentro del correo interno**, utilizando el editor nativo de Moodle, conservando su posición en el mensaje.
- Continúa el envío privado mediante CCO y el registro independiente para reducir duplicados.

## Novedades de la v1.12.0 (versión de prueba)

- Consulta manual del correo interno de Moodle desde la pestaña **Correos**.
- Indicador de mensajes no leídos visible incluso con el panel plegado.
- Acceso rápido a los asuntos no leídos más recientes.
- Opción para reutilizar el mismo mensaje en el correo interno del curso, con asunto independiente.
- Los destinatarios se toman de los grupos seleccionados y se mantienen ocultos entre sí mediante el mecanismo de destinatarios privados del propio complemento de correo.
- Registro local para evitar repeticiones cuando un envío ya fue confirmado o quedó pendiente de revisión.
- Los enlaces y las imágenes del editor se insertan también en el cuerpo del correo interno cuando TinyMCE permite la carga.
- No se integra Gmail en esta etapa.

## Novedades de la v1.11.5 (versión de prueba)

- La herramienta aparece **solo al entrar en una página principal de curso o en un foro Moodle**, sin mostrar el panel en `/campus/miscursos.php` ni en `/my/`.
- El panel comienza **plegado por defecto** en una barra pequeña. Pulse **Mostrar** para abrirlo y **Ocultar** para volver a plegarlo; el estado elegido se conserva.
- Las donaciones voluntarias se presentan debajo de los botones principales, en una sola línea: **Donaciones voluntarias · Llave @moreno3666**. El pie de Conversaciones conserva ese mensaje compacto.
- El análisis es manual: únicamente empieza cuando el tutor pulsa **Consolidar foros activos**.
- Las respuestas directas verificadas se incorporan sin rehacer la conversación ni perder la posición de revisión.

Consulte [CHANGELOG.md](CHANGELOG.md) para ver el historial de cambios de las versiones anteriores.

## Instalación directa

Con Tampermonkey instalado, abra el archivo `Moodle-Forum-Toolkit.user.js` desde el repositorio o use la versión RAW para instalarlo/actualizarlo:

**Versión de prueba 1.11.5:** https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/refs/heads/feature/portal-dashboard-v1.11.0/Moodle-Forum-Toolkit.user.js

La rama `main` mantiene la versión pública anterior hasta que finalicen las pruebas.

Repositorio: https://github.com/JuanBiomedico/Moodle-Forum-Toolkit

## Acceso desde cursos y foros

Acceda al campus mediante su procedimiento habitual y **entre primero en una de sus aulas**. El panel aparecerá plegado en las páginas `.../course/view.php?id=...` y `.../mod/forum/view.php?id=...`; no se muestra en la pantalla de selección de cursos. Pulse **Mostrar** para acceder a su configuración o iniciar, mediante el botón correspondiente, el análisis de los foros activos de esa misma instalación.

## Instalación rápida

1. Instale la extensión **Tampermonkey** en el navegador. Y en Gestionar extensión habilite la opción "permitir secuencias de comandos del usuario"
2. Abra la versión RAW de `Moodle-Forum-Toolkit.user.js`.
3. Tampermonkey debería mostrar automáticamente la pantalla de instalación.
4. Pulse **Instalar**.
5. Entre en cualquier curso Moodle (`course/view.php?id=...`) o foro (`mod/forum/view.php?id=...`).
6. Compruebe que aparece la barra compacta y pulse **Mostrar** para utilizar el gestor.
7. Use **⚙ Configurar foros** para registrar los foros que desea administrar.

Si la instalación directa no se abre automáticamente, consulte el manual para instalar el script copiando y pegando el código completo en Tampermonkey.

## Imágenes

La versión 1.10.0 permite seleccionar PNG, JPG/JPEG, GIF y WebP. Cuando se publica una respuesta con imágenes, la herramienta intenta utilizar el mecanismo de carga de imágenes del editor TinyMCE de la instalación Moodle. Si la instalación no expone un cargador compatible, la herramienta detiene la publicación automática y recomienda completar la respuesta desde el editor nativo de Moodle.

Las imágenes seleccionadas se mantienen en memoria durante la sesión del editor. Los borradores de texto se conservan en `localStorage`, pero los archivos de imagen deben volver a seleccionarse si se cierra y reabre el editor.

## Seguridad

- La herramienta solo permite configurar foros del mismo origen Moodle que la página actual.
- No almacena contraseñas, cookies ni `sesskey` de Moodle.
- Las acciones de publicación requieren confirmación explícita.
- Si una publicación puede haberse procesado pero no puede verificarse, la herramienta evita reintentar automáticamente para reducir el riesgo de duplicados.

## Documentación

Consulte [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md) para la guía completa de instalación, configuración y uso.

## Licencia

MIT. Consulte `LICENSE`.

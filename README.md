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


## Novedades de la v1.16.5 (versión de prueba)

- Los canales de campaña quedan separados: **Enviar a foros** y **Enviar por correo interno (CCO)** pueden activarse de manera independiente.
- Es posible realizar una campaña **solo por correo interno**, sin publicar nuevamente en los foros.
- Nuevo botón **Revisar destinatarios** antes del envío. El Toolkit crea un borrador temporal por aula, consulta los grupos seleccionados y muestra los nombres de los usuarios Moodle que serían incluidos en CCO.
- El correo interno no requiere escribir direcciones de correo manualmente: utiliza los participantes matriculados del curso.
- La selección de destinatarios se limita al rol **Estudiante**. Si el Toolkit no logra identificar con seguridad ese rol en la instalación Moodle, bloquea el envío y muestra los roles disponibles.
- El resumen de campaña diferencia ahora claramente los destinos pendientes de Foros y de Correo interno.
- Se mantienen las imágenes embebidas y los documentos adjuntos también en el correo interno.

## Novedades de la v1.16.4 (versión de prueba)

- Corrección para aulas con **Grupo único**: antes podían quedar fuera del barrido cuando la fuente principal de grupos provenía de los foros.
- Antes de recorrer grupos, cada actividad resuelve nuevamente su **ID de curso real** desde la propia página de calificaciones; esto evita asociar accidentalmente una tarea a los grupos de otra aula.
- Si el aula correspondiente no tiene selector de grupos, se crea explícitamente una unidad **Grupo único (group=0)** y se consulta toda la actividad.
- El resumen distingue ahora cuántos grupos provienen de Foros y cuántas unidades corresponden a **grupo único**.
- Se corrigió la detección **Calificado / No calificado** cuando Moodle muestra una nota numérica como `0,00 / máximo` aunque el estado real siga siendo **Sin calificar**.
- Nuevo bloque **Plantilla resumida de criterios** dentro del calificador: permite ingresar **nota y observación por criterio** y aplicar esos valores a la guía/rúbrica nativa de Moodle sin guardar automáticamente.
- La plantilla reconoce el esquema de **guía de evaluación** utilizado por Moodle (nota numérica + observación por criterio) y también admite rúbricas por niveles cuando se detectan.
- El flujo especial **No entrega: 0 + retroalimentación** queda separado del flujo normal de evaluación por criterios.

## Novedades de la v1.16.3 (versión de prueba)

- El barrido completo de calificaciones se realiza únicamente al pulsar **Actualizar**.
- Una vez cargados los estudiantes de las aulas, actividades y grupos, los filtros trabajan sobre los datos ya obtenidos en memoria y **no vuelven a consultar los 32 grupos**.
- Se separan dos filtros independientes:
  - **Estado de entrega:** todas, no entregados, entregados.
  - **Estado de calificación:** todas, no calificados, calificados.
- **No calificados** incluye también estudiantes sin entrega que todavía no han sido revisados/calificados; permite combinar, por ejemplo, **No entregados + No calificados**.
- El resumen muestra ahora el total de **no calificados** y **calificados**.
- El nombre del aula se toma prioritariamente de la configuración de Foros que ya identifica correctamente las aulas, evitando rótulos erróneos como **English (en)**.
- Pulsar **Actualizar** sigue haciendo un barrido completo y fresco de Moodle; cerrar y volver a abrir el panel también inicia una nueva consulta para evitar trabajar con información obsoleta.

## Novedades de la v1.16.2 (versión de prueba)

- Corrección del barrido de grupos para instalaciones Moodle donde la página de calificaciones ya no expone un `<select>` tradicional de grupos.
- El panel usa ahora como fuente principal los **grupos ya detectados en los foros configurados de cada aula**, que en este flujo son la referencia más fiable para recorrer todos los grupos del curso.
- Los grupos se asocian a la actividad de calificación por **ID de curso/aula** y luego se consulta la tarea grupo por grupo.
- Si no hay grupos disponibles desde Foros, se conserva como alternativa la detección desde la propia página de calificaciones.
- Corrección del filtro **Todos los estados**: ahora envía `status=` para limpiar la preferencia anterior de Moodle. Antes se utilizaba `status=none`, que Moodle podía ignorar y conservar un filtro previo como Entregados o No entregados.
- El resumen muestra **estudiantes únicos**, registros, aulas, actividades y grupos, e indica cuántos grupos fueron obtenidos desde Foros.
- Para el caso actual, con dos aulas y 32 grupos en total, la vista debe aproximarse a esos 32 grupos cuando todas las aulas/actividades estén configuradas y activas.

## Novedades de la v1.16.1 (versión de prueba)

- Corrección importante del barrido de grupos en Calificaciones: al consultar “todos” se fuerza ahora explícitamente `group=0` para evitar que Moodle reutilice en sesión el último grupo activo.
- Detección de grupos reforzada con el selector nativo `.groupselector select` / `#selectgroup`.
- La configuración de Calificaciones muestra cuántas aulas tienen actividades activas y cuántas aulas/foros están configuradas, para detectar rápidamente si falta registrar una segunda aula.
- Nuevo botón **Buscar tareas en aulas configuradas**: recorre las aulas ya registradas para Foros, localiza sus páginas de curso y muestra las tareas encontradas para añadirlas sin abrir cada aula manualmente.
- Corrección de identificación del nombre del aula: prioriza el breadcrumb/coursehome y evita confundir enlaces de idioma como **English (en)** con el nombre del curso.
- Se mantiene el barrido central por todas las actividades activas y todos los grupos de cada actividad.

## Novedades de la v1.16.0 (versión de prueba)

- El panel de **Calificaciones** ya no se limita a la actividad o grupo desde el que se abrió.
- Recorre **todas las actividades de calificación activas configuradas** en la instalación Moodle.
- Para cada actividad detecta el selector de grupos de Moodle y consulta **todos los grupos disponibles**, página por página.
- Los resultados se centralizan con contexto de **Aula · Actividad · Grupo · Estudiante**.
- Nuevos filtros independientes por **aula**, **actividad**, **grupo** y **estado de entrega/calificación**.
- El resumen indica cuántas aulas, actividades, grupos y registros se están mostrando.
- Las actividades de cada aula conservan ahora también el nombre del curso para distinguir con claridad las dos aulas.
- La calificación individual continúa abriéndose en el calificador nativo de Moodle, preservando la rúbrica y el grupo correspondiente.
- Para centralizar dos aulas es necesario tener activadas las actividades que se desean revisar en cada una. Si las aulas están en la misma instalación/origen Moodle, se consultan desde una sola vista.

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

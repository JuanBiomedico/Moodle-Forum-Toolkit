# Changelog

## 1.13.0 - Asistente de calificación en tareas

- Activación en páginas `/mod/assign/view.php?action=grader`.
- Panel plegado por defecto para preparar 0 puntos y retroalimentación institucional.
- Compatibilidad con campos de rúbrica `advancedgrading-criteria-...-score` y detección alternativa de calificación directa.
- Observación configurable en criterios y bloque opcional de oportunidad de recuperación con fecha editable.
- Botón para preparar sin guardar y botón separado para confirmar y guardar/mostrar siguiente.
- Confirmación explícita obligatoria para cada estudiante.
- No se integra el ciclo automático sin supervisión incluido en el script original.


## 1.12.1 - Pestaña Correos y figuras en correo interno

- Nueva pestaña **Correos** dentro de la ventana de resultados, junto a Vista lista y Conversaciones.
- La revisión del correo deja de ser periódica; solo se ejecuta cuando el tutor pulsa **Actualizar** desde la vista de Correos o utiliza la actualización manual del panel.
- Resumen por aula de mensajes recibidos pendientes y contestados, con estado leído/no leído y acceso al mensaje.
- La detección de respuesta utiliza las referencias que el complemento `local_mail` conserva en los mensajes enviados.
- Las imágenes del editor de mensajes masivos se insertan también dentro del correo interno mediante TinyMCE y el área de borradores de Moodle.
- El registro anti-duplicados del correo incluye ahora la firma de las imágenes.


## 1.12.0 - Correo interno de Moodle

- Monitor periódico de la bandeja de entrada mientras se trabaja en páginas de curso o foro.
- Indicador de no leídos en el panel desplegado y en la barra compacta.
- Acceso rápido a los asuntos no leídos más recientes.
- Opción para reutilizar el mensaje del editor en el correo interno del curso con asunto independiente.
- Agrupación de destinatarios por curso a partir de los grupos seleccionados y uso de destinatarios privados.
- Registro local para evitar repeticiones y bloquear reintentos cuando el resultado no puede verificarse.
- Los hipervínculos se conservan; las imágenes del editor todavía no se adjuntan al correo interno.
- Sin integración Gmail en esta versión.


## 1.11.5 - Activación dentro del curso y panel oculto por defecto

- Se elimina la activación del userscript en `/campus/miscursos.php` y en `/my/`; el gestor solo aparece en páginas principales de cursos y foros Moodle.
- El panel comienza plegado de forma predeterminada, incluso para quienes utilizaron la versión de prueba anterior. Después recuerda la preferencia del tutor.
- Donaciones voluntarias en una única línea, inmediatamente debajo de los botones del panel desplegado; el mismo texto breve aparece en el pie de Conversaciones.
- Se retiran los componentes de la interfaz del portal que ya no se utilizan.
- Se mantienen la consolidación exclusivamente manual y la actualización localizada de las respuestas directas.


## 1.11.4 - Panel desplegable y apoyo voluntario visible

- El panel flotante en Moodle y «Mis cursos» se puede plegar a una barra compacta y volver a desplegar con un botón accesible.
- Se conserva la preferencia de panel plegado o desplegado en Tampermonkey, de forma independiente para ambos puntos de entrada.
- Los paneles expandidos usan altura máxima y desplazamiento interno para no obstaculizar el contenido de la página.
- La Llave de donaciones voluntarias aparece en el panel principal sin abrir «Acerca de», también desde «Mis cursos».
- La Vista Conversaciones incorpora un pie compacto visible con el mensaje de apoyo voluntario y la Llave.
- El análisis de foros continúa siendo exclusivamente manual.


## 1.11.3 - Respuesta directa sin perder el contexto de revisión

- Se elimina la reconstrucción completa de las vistas después de publicar una respuesta directa verificada.
- En Conversaciones, se actualiza únicamente la tarjeta del estudiante y se inserta la nueva respuesta en su rama.
- Se conservan la posición de desplazamiento, los filtros y el estado abierto de aulas, grupos y discusiones.
- Se actualizan de forma localizada los contadores de pendientes por grupo y aula.
- En Vista lista, se actualiza la fila atendida y se muestra la respuesta del tutor justo debajo sin rehacer la tabla.
- El botón Actualizar sigue permitiendo una nueva consolidación completa cuando el usuario la solicita.


## 1.11.2 - Análisis manual y control explícito

- No se inicia el análisis al entrar a un foro o curso; solo comienza al pulsar **Consolidar foros activos**.
- Desde «Mis cursos», el botón **Abrir Moodle sin analizar** abre el primer foro activo de la instalación correspondiente sin iniciar la consolidación.
- Se eliminaron los mecanismos de autoejecución y las solicitudes de análisis pendientes creadas desde el portal.
- Actualización del README y manual para explicar el flujo de inspección previa.


## 1.11.1 - Panel desde páginas de curso

- Activación del panel en las URLs generales de Moodle `/course/view.php*`, incluidas instalaciones alojadas bajo subdirectorios.
- Permite iniciar la consolidación de todos los foros activos de la instalación directamente desde cualquier curso con sesión autenticada, sin entrar en cada foro.
- Aclara que el acceso desde el curso no sustituye el inicio de sesión institucional ni permite consultar automáticamente foros de otro dominio.
- URLs de actualización de la versión de prueba vinculadas a la rama correspondiente, para evitar que Tampermonkey reciba inadvertidamente una versión anterior de `main`.


## 1.11.0 - Panel de acceso desde «Mis cursos»

- Muestra Moodle Forum Toolkit en páginas institucionales `/campus/miscursos.php` y paneles Moodle `/my/`.
- Catálogo compartido de foros por dominio mediante almacenamiento del userscript (Tampermonkey) dentro del mismo navegador.
- Migración de listas de foros anteriormente guardadas en el almacenamiento local de Moodle.
- Selección, edición y eliminación de foros desde el portal sin entrar manualmente en cada aula.
- Una acción para abrir el dominio Moodle de destino y consolidar automáticamente los foros activos; no se publica contenido de manera automática.
- Importación y exportación JSON de catálogos con varios dominios Moodle.
- Documentación sobre el alcance de las sesiones autenticadas y el aislamiento entre dominios.


## 1.10.1 - Correcciones y portabilidad

- Conversión de hipervínculos del portapapeles enriquecido a Markdown al pegar en los editores.
- Análisis de coincidencias del mensaje publicado más tolerante con cambios de formato efectuados por Moodle.
- Verificación de publicaciones nuevas por ID de mensaje y comparación con los mensajes anteriores al envío.
- Escaneo de publicaciones previas sin publicar y registro de destinos ya atendidos.
- Bloqueo de reintentos automáticos cuando el estado del envío es incierto, con resolución manual posterior.
- Importación y exportación JSON de la configuración de foros para respaldarla en Drive y utilizarla en otro equipo.
- Conservación de las opciones de activar, desactivar, renombrar y eliminar foros.
- Corrección del cálculo del plazo de 48 horas cuando Moodle no proporciona una fecha válida.

## 1.10.0 - 2026-09-18

### Cambios principales

- Cambio de nombre a **Moodle Forum Toolkit - Gestor y Consolidador de Foros**.
- Eliminación de referencias institucionales explícitas del nombre y de la lógica principal.
- Metadatos de autoría: Juan Pablo Moreno Ortiz.
- Licencia MIT y nota de donaciones voluntarias a la Llave `@moreno3666`.
- Activación genérica en rutas estándar de foros Moodle.
- Configuración multi-aula por instalación Moodle.
- Respuesta directa disponible tanto en Vista lista como en Conversaciones.
- Soporte para insertar imágenes PNG, JPG/JPEG, GIF y WebP.
- Carga de imágenes mediante el editor TinyMCE y el repositorio de borradores de Moodle cuando la instalación lo permite.
- Imágenes disponibles también en mensajes masivos.
- Conservación de adjuntos, control de 48 horas, ordenamiento por antigüedad y exportación CSV.
- Se mantiene la detección de duplicados y los tres niveles de seguridad del envío masivo.

## 1.9.1

- Fecha legible y cálculo de antigüedad.
- Indicadores de menos de 24 h, 24-48 h y más de 48 h.
- Ordenamiento de pendientes por antigüedad.

## 1.9.0

- Configuración dinámica multi-aula.
- Soporte para foros con grupos separados o grupo único.
- Modos de seguridad configurables para mensajes masivos.

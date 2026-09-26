# Moodle Forum Toolkit

**Moodle Forum Toolkit** es un userscript para Tampermonkey orientado a docentes y tutores que necesitan consolidar, revisar y responder foros Moodle desde una interfaz unificada.

Autor: **Juan Pablo Moreno Ortiz**  
Licencia: **MIT**  
Donaciones voluntarias: **Llave @moreno3666**

> Proyecto independiente y no oficial. No está afiliado ni respaldado por Moodle Pty Ltd ni por una institución educativa específica.

## Funciones principales

- Configuración de uno o varios foros de una misma instalación Moodle y acceso desde la página «Mis cursos».
- Detección automática de aulas con grupos separados o con grupo único.
- Consolidación multi-aula.
- Vista lista y vista de conversaciones reconstruidas por relación padre-respuesta.
- Detección de respuesta directa del tutor.
- Priorización de mensajes pendientes por antigüedad.
- Indicadores de atención para un plazo de 48 horas.
- Respuesta directa desde la herramienta.
- Inserción y carga de imágenes en respuestas directas y mensajes masivos mediante el editor nativo de Moodle cuando está disponible.
- Acceso a archivos adjuntos de los estudiantes.
- Envío masivo con modos de seguridad configurables y prevención de duplicados.
- Exportación CSV.


## Novedades de la v1.11.3 (versión de prueba)

- **Respuestas directas sin reconstruir la revisión:** después de publicar y verificar la respuesta, solamente se actualiza el mensaje del estudiante y se inserta la nueva respuesta debajo de ese mensaje.
- En **Conversaciones** se conserva la posición de lectura, los grupos y discusiones desplegados y los filtros seleccionados, incluso cuando el último mensaje pendiente de un grupo queda atendido.
- En **Vista lista** se actualiza únicamente la fila atendida, se muestra la intervención del tutor y se conserva el desplazamiento.
- Los contadores de pendientes se actualizan en ambas vistas. Los cambios de filtros o una actualización manual siguen siendo decisiones del usuario.

## Novedades de la v1.11.2 (versión de prueba)

- **Análisis exclusivamente bajo demanda:** abrir un foro o curso solo muestra el panel; el script no consolida datos hasta que el usuario pulsa **Consolidar foros activos**.
- Desde «Mis cursos», el botón **Abrir Moodle sin analizar** abre el primer foro activo de la instalación seleccionada para inspeccionarlo antes de analizar.
- Se eliminó el inicio automático que podía activarse al abrir un foro desde el portal, incluidas las solicitudes de inicio guardadas por versiones anteriores.

## Novedades de la v1.11.1 (versión de prueba)

- **Panel desde cualquier página de curso Moodle**, incluidas las instalaciones con rutas como `/ses112/course/view.php?id=137`. No se configura ninguna URL de curso fija.
- Desde el curso autenticado, permite consolidar los foros activos previamente registrados **del mismo dominio Moodle**, aunque estén asociados a otros cursos.
- Alternativa al acceso desde «Mis cursos» si la apertura de otra pestaña desencadena una redirección del sistema de autenticación institucional.
- La versión de prueba se instala desde [esta rama](https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/refs/heads/feature/portal-dashboard-v1.11.0/Moodle-Forum-Toolkit.user.js). La rama `main` sigue siendo la versión pública anterior hasta que concluyan las pruebas de integración.

## Novedades de la v1.11.0

- **Panel disponible en «Mis cursos»**: al acceder al portal institucional `/campus/miscursos.php`, el gestor muestra los foros registrados sin entrar manualmente en cada aula.
- El usuario selecciona qué foros desea revisar y pulsa **Abrir Moodle sin analizar**. Cuando los foros están alojados en otro dominio, el script abre una pestaña Moodle sin iniciar la consolidación. El usuario la inicia cuando pulsa **Consolidar foros activos**.
- El almacenamiento compartido del userscript permite utilizar el catálogo de foros tanto en el portal como en las páginas Moodle **del mismo navegador**.
- Migración automática de la lista guardada por versiones anteriores la primera vez que se abre uno de los foros con la versión actualizada.
- Configuración por URL y exportación/importación JSON, incluidas instalaciones Moodle de distintos dominios.
- La apertura desde Mis cursos **no envía mensajes**, y el inicio de sesión en el servidor Moodle sigue siendo obligatorio.

## Novedades de la v1.10.1

- Conserva los enlaces al pegar texto enriquecido con hipervínculos en los editores.
- Mejora la verificación posterior de los mensajes publicados, utilizando el identificador del mensaje nuevo cuando Moodle lo proporciona.
- Ofrece un escaneo de publicaciones existentes **sin enviar nuevos mensajes**.
- Bloquea automáticamente los reintentos de destinos cuyo envío no pudo verificarse y permite resolverlos después de una comprobación manual.
- Exporta/importa la lista de foros mediante JSON para trasladarla entre computadores usando, por ejemplo, una carpeta privada de Google Drive.
- Permite activar/desactivar o eliminar foros individuales de la configuración.

La sincronización del código mediante Tampermonkey/Drive no garantiza que se sincronice el almacenamiento local del navegador. Consulte el manual para trasladar los foros de forma segura.

## Instalación directa

Con Tampermonkey instalado, abra el archivo `Moodle-Forum-Toolkit.user.js` desde el repositorio o use la versión RAW para instalarlo/actualizarlo:

**Instalar / actualizar:** https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/main/Moodle-Forum-Toolkit.user.js

Repositorio: https://github.com/JuanBiomedico/Moodle-Forum-Toolkit

## Acceso desde páginas de curso o «Mis cursos»

Puede abrir el gestor directamente desde cualquier página `.../course/view.php?id=...` sin iniciar ninguna consulta de los foros. Cuando pulse **Consolidar foros activos**, revisará los foros configurados del mismo dominio Moodle sin navegar por cada aula. Esta alternativa utiliza la sesión de la pestaña Moodle actual y evita depender de la apertura automática desde otro dominio. El portal «Mis cursos» también sigue disponible como punto de entrada.

### Acceso desde «Mis cursos»

Con la v1.11.0 instalada, abra el portal institucional, por ejemplo `https://campus0c.unad.edu.co/campus/miscursos.php`. El panel permite activar o desactivar foros, importar y exportar la configuración y abrir la instalación Moodle correspondiente sin iniciar el análisis. Si estaba utilizando una versión anterior, abra un foro una vez para migrar los datos locales.

**Seguridad:** el portal no accede directamente al contenido de otro dominio Moodle; la revisión se hace dentro de una pestaña autenticada de ese dominio. Consulte el manual para conocer el procedimiento completo.

## Instalación rápida

1. Instale la extensión **Tampermonkey** en el navegador. Y en Gestionar extensión habilite la opción "permitir secuencias de comandos del usuario"
2. Abra la versión RAW de `Moodle-Forum-Toolkit.user.js`.
3. Tampermonkey debería mostrar automáticamente la pantalla de instalación.
4. Pulse **Instalar**.
5. Abra o recargue una página de foro Moodle (`mod/forum/view.php?id=...`).
6. Verifique que aparezca el panel **Moodle Forum Toolkit**.
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

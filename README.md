# Moodle Forum Toolkit

**Moodle Forum Toolkit** es un userscript para Tampermonkey orientado a docentes y tutores que necesitan consolidar, revisar y responder foros Moodle desde una interfaz unificada.

Autor: **Juan Pablo Moreno Ortiz**  
Licencia: **MIT**  
Donaciones voluntarias: **Llave @moreno3666**

> Proyecto independiente y no oficial. No está afiliado ni respaldado por Moodle Pty Ltd ni por una institución educativa específica.

## Funciones principales

- Configuración de uno o varios foros de una misma instalación Moodle.
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


## Instalación directa

Con Tampermonkey instalado, abra el archivo `Moodle-Forum-Toolkit.user.js` desde el repositorio o use la versión RAW para instalarlo/actualizarlo:

**Instalar / actualizar:** https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/main/Moodle-Forum-Toolkit.user.js

Repositorio: https://github.com/JuanBiomedico/Moodle-Forum-Toolkit

## Instalación rápida

1. Instale la extensión **Tampermonkey** en el navegador.
2. Cree un nuevo userscript.
3. Sustituya el contenido por `Moodle-Forum-Toolkit.user.js`.
4. Guarde el script.
5. Abra una página de foro Moodle (`mod/forum/view.php?id=...`).
6. Use **⚙ Configurar foros** para registrar las aulas/foros que desea administrar.

## Imágenes

La versión 1.10.0 permite seleccionar PNG, JPG/JPEG, GIF y WebP. Cuando se publica una respuesta con imágenes, la herramienta intenta utilizar el mecanismo de carga de imágenes del editor TinyMCE de la instalación Moodle. Si la instalación no expone un cargador compatible, la herramienta detiene la publicación automática y recomienda completar la respuesta desde el editor nativo de Moodle.

Las imágenes seleccionadas se mantienen en memoria durante la sesión del editor. Los borradores de texto se conservan en `localStorage`, pero los archivos de imagen deben volver a seleccionarse si se cierra y reabre el editor.

## Seguridad

- La herramienta solo permite configurar foros del mismo origen Moodle que la página actual.
- No almacena contraseñas, cookies ni `sesskey` de Moodle.
- Las acciones de publicación requieren confirmación explícita.
- Si una publicación puede haberse procesado pero no puede verificarse, la herramienta evita reintentar automáticamente para reducir el riesgo de duplicados.

## Documentación

Consulte `MANUAL_USUARIO.md`. También existe una versión Word del manual para distribución; puede añadirse al repositorio como archivo complementario.

## Licencia

MIT. Consulte `LICENSE`.

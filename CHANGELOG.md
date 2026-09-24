# Changelog

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

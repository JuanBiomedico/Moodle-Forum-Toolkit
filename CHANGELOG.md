# Changelog

## 1.17.2 - Mensajería masiva estable sin carga local de archivos

- Se retira del flujo **Redactar mensaje** la carga local de imágenes y archivos adjuntos.
- El modo redactado queda orientado a texto y enlaces.
- Se conserva **Mensaje maestro** como vía estable para replicar publicaciones con imágenes ya alojadas en Moodle.
- Los mensajes maestros con archivos adjuntos se detectan y bloquean antes de iniciar una campaña, evitando publicaciones incompletas.
- Se mantienen sin cambios la consulta de adjuntos existentes, las descargas de entregas y otras funciones no relacionadas con el editor masivo.

## 1.17.1 - Simplificación de imágenes en mensaje masivo

- Se oculta la carga local de imágenes en **Redactar mensaje**.
- Se recomienda **Mensaje maestro** para publicaciones con imágenes incrustadas.
- No se modifican las funciones de imágenes utilizadas por otros flujos.

## 1.17.0 - Separación multiusuario y SAI editable

- Configuración, borradores, preferencias e historial local de campañas separados por usuario Moodle.
- Migración conservadora de los datos locales existentes al primer usuario identificado en el navegador.
- Textos predeterminados de SAI generalizados, sin quedar ligados a un curso específico.
- Observación SAI editable antes de aplicar el prellenado.
- Ajuste de la plantilla de retroalimentación para evitar dependencias específicas de una escuela o imagen externa.
- Se mantiene la autoría del proyecto sin utilizar el nombre del autor como identidad operativa del tutor.

## 1.16.14 - Dos modos de mensaje masivo

- Separación visual mediante pestañas: **Redactar mensaje** y **Mensaje maestro**.
- Unificación de controles de prueba, alcance y campaña.
- Mensaje maestro carga una publicación existente mediante su enlace permanente y conserva su HTML e imágenes incrustadas.

## 1.16.13 - Mensaje maestro

- Lectura de una publicación de foro a partir de su enlace permanente.
- Vista previa del contenido recuperado.
- Réplica controlada en otros grupos.
- Omisión automática de la discusión de origen.
- Verificación posterior para reducir duplicados.

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

# Manual de Usuario
## Moodle Forum Toolkit - Gestor y Consolidador de Foros

**Versión:** 1.10.0  
**Autor:** Juan Pablo Moreno Ortiz  
**Licencia:** MIT  
**Donaciones voluntarias:** Llave `@moreno3666`

> Moodle Forum Toolkit es una herramienta independiente y no oficial. No está afiliada ni respaldada por Moodle Pty Ltd ni por una institución educativa específica.

---

## 1. Propósito

Moodle Forum Toolkit es un userscript para Tampermonkey diseñado para facilitar la gestión de foros Moodle cuando un docente o tutor debe revisar varias aulas, grupos o discusiones. La herramienta consolida participaciones, reconstruye conversaciones, identifica mensajes de estudiantes pendientes de respuesta directa, permite responder desde una interfaz unificada y ofrece apoyo para mensajería masiva.

Su objetivo principal es reducir el tiempo dedicado a recorrer manualmente múltiples grupos y facilitar el seguimiento de los tiempos de atención.

## 2. Requisitos

Para utilizar la herramienta se requiere:

- Un navegador compatible con Tampermonkey.
- La extensión Tampermonkey instalada y habilitada.
- Acceso autenticado a la instalación Moodle correspondiente.
- Permisos normales de usuario para leer y, cuando corresponda, responder los foros configurados.
- Para la carga automática de imágenes, una instalación Moodle cuyo editor TinyMCE exponga el mecanismo estándar de carga de imágenes.

La herramienta no sustituye los permisos de Moodle. Si el usuario no tiene autorización para publicar o acceder a un foro, el script tampoco podrá hacerlo.

## 3. Instalación

1. Instale Tampermonkey en el navegador.
2. Abra el panel de Tampermonkey y seleccione la opción para crear un nuevo userscript.
3. Elimine el contenido de ejemplo.
4. Copie el contenido completo del archivo `Moodle-Forum-Toolkit.user.js`.
5. Guarde el script.
6. Abra una página de foro Moodle cuya ruta contenga `mod/forum/view.php`.
7. En la esquina inferior derecha deberá aparecer el panel **Moodle Forum Toolkit**.

Si el panel no aparece, verifique que Tampermonkey esté habilitado y que el navegador permita la ejecución de userscripts.

## 4. Panel principal

El panel flotante muestra:

- La versión instalada.
- La cantidad de foros activos y configurados.
- El estado de la última operación.
- **Consolidar foros activos**.
- **Configurar foros**.
- **Redactar / enviar mensaje**.
- Una sección **Acerca de**, con autor, licencia y llave de donaciones voluntarias.

## 5. Configuración de foros

La herramienta permite registrar uno o varios foros de una misma instalación Moodle.

Use **⚙ Configurar foros** y agregue la URL de cada foro, por ejemplo:

`https://campus.ejemplo.edu/mod/forum/view.php?id=1234`

También puede utilizar **Agregar foro actual** cuando ya se encuentre dentro del foro deseado.

### 5.1 Restricción por origen

Por seguridad, todos los foros configurados deben pertenecer al mismo origen que la página actual. Esto significa que no se mezclan sesiones de dos dominios Moodle diferentes dentro de una misma ejecución.

Si una institución opera dos instalaciones Moodle en dominios distintos, cada instalación mantendrá su propia configuración en el navegador.

### 5.2 Foros con grupos separados

Cuando Moodle presenta un selector de grupos, Moodle Forum Toolkit identifica los grupos disponibles y crea una unidad de trabajo por cada grupo.

### 5.3 Foro con grupo único

Si no existe selector de grupos, el foro se trata automáticamente como una sola unidad denominada **Grupo único**.

## 6. Consolidación

Presione **Consolidar foros activos**.

La herramienta recorre los foros configurados, detecta grupos, discusiones y mensajes, y genera una vista consolidada.

Durante el proceso se muestra el foro y grupo que se están consultando.

La consolidación no publica contenido ni modifica Moodle.

## 7. Vista lista

La Vista lista presenta cada mensaje en una tabla con:

- Aula o foro.
- Grupo.
- Autor.
- Fecha legible.
- Antigüedad aproximada.
- Contenido.
- Estado de respuesta del tutor.
- Estado respecto del plazo de 48 horas.
- Acciones disponibles.

### 7.1 Responder directamente desde Vista lista

Los mensajes de estudiantes pendientes muestran el botón **Responder directamente**.

Al pulsarlo se abre un editor interno en el que puede:

- Redactar texto.
- Insertar imágenes.
- Revisar la vista previa.
- Confirmar la publicación.
- Abrir el editor nativo de Moodle como alternativa.

Después del envío, la herramienta vuelve a consultar la discusión y verifica que la respuesta tenga como padre el mensaje del estudiante.

## 8. Vista Conversaciones

La Vista Conversaciones reconstruye la estructura padre-hijo de las publicaciones.

La herramienta prioriza las relaciones explícitas suministradas por Moodle, especialmente el enlace **Mostrar mensaje anterior** y los parámetros de respuesta asociados al mensaje.

Los mensajes del tutor y de los estudiantes se muestran dentro de un árbol de conversación para conservar el contexto.

## 9. Estados de respuesta

Para cada mensaje de estudiante se puede mostrar uno de los siguientes estados:

- **Respondido directamente:** existe una respuesta del tutor cuyo padre es ese mensaje.
- **Tutor presente en la rama:** existe una intervención del tutor en una respuesta descendiente, pero no una respuesta directa al mensaje evaluado.
- **Sin respuesta directa:** no se detectó una respuesta directa del tutor.

El criterio de respuesta directa es más estricto que la simple posición visual del mensaje en Moodle.

## 10. Control del plazo de 48 horas

Los mensajes pendientes se clasifican de acuerdo con su antigüedad:

- **Verde:** menos de 24 horas.
- **Naranja:** entre 24 y 48 horas.
- **Rojo:** más de 48 horas.

La fecha se presenta en un formato legible y también se muestra el tiempo aproximado transcurrido.

Ejemplo:

`14 sep 2026, 13:29 · hace 1 d 11 h`

Cuando el mensaje está pendiente, se indica además el tiempo restante o si se superó el límite de 48 horas.

## 11. Ordenamiento y priorización

En Conversaciones puede ordenar los grupos según el mensaje pendiente más antiguo.

Opciones disponibles:

- Más antiguo pendiente primero.
- Más reciente pendiente primero.
- Orden original.

Para una operación orientada al cumplimiento del plazo de atención, se recomienda utilizar:

- Filtro **Grupos con pendientes**.
- Orden **Más antiguo pendiente primero**.

## 12. Filtros de antigüedad

Puede filtrar mensajes y grupos según:

- Todos.
- Más de 48 horas.
- Entre 24 y 48 horas.
- Menos de 24 horas.

Esto permite concentrarse primero en los mensajes que requieren atención inmediata.

## 13. Archivos adjuntos

Cuando una publicación contiene archivos almacenados mediante `pluginfile.php`, Moodle Forum Toolkit muestra un control **Adjuntos**.

Dependiendo del tipo de archivo, la interfaz permite abrir o descargar:

- PDF.
- Imágenes.
- Word y formatos de texto compatibles.
- Excel y CSV.
- PowerPoint.
- Archivos comprimidos.

Los archivos permanecen protegidos por la sesión y permisos de Moodle.

## 14. Inserción de imágenes en respuestas

La versión 1.10.0 incorpora el botón **Añadir imagen** en los editores de respuesta directa.

Formatos admitidos localmente:

- PNG.
- JPG/JPEG.
- GIF.
- WebP.

El límite local inicial es de 8 MB por imagen. Moodle puede aplicar un límite inferior según la configuración del curso, del servidor o del usuario.

### 14.1 Posición de la imagen

Al seleccionar una imagen, se inserta una marca en la posición actual del cursor. La vista previa muestra la imagen en esa ubicación.

Puede combinar texto e imágenes, por ejemplo:

1. Explicación inicial.
2. Imagen o captura.
3. Comentario posterior.
4. Segunda imagen.
5. Conclusión.

### 14.2 Cómo se publica la imagen

La herramienta abre de forma interna el formulario de respuesta de Moodle, utiliza el editor TinyMCE de esa instalación y solicita al propio editor que cargue la imagen al área temporal de archivos de Moodle. Después se envía el formulario correspondiente.

La imagen no depende de una URL externa ni del computador local una vez que Moodle ha procesado correctamente la publicación.

### 14.3 Compatibilidad

Si la instalación Moodle no dispone de TinyMCE compatible o no expone el cargador de imágenes esperado, la herramienta cancela la automatización y muestra un mensaje para completar la operación mediante **Abrir en Moodle**.

Esta medida evita publicar contenido con imágenes rotas.

### 14.4 Persistencia de imágenes

Los archivos seleccionados se conservan únicamente en memoria mientras el editor está abierto. Los borradores de texto pueden guardarse en el navegador, pero los archivos de imagen deben seleccionarse nuevamente después de cerrar y volver a abrir el editor.

## 15. Mensajes masivos

Use **Redactar / enviar mensaje** para crear una publicación destinada a varios grupos o aulas.

El editor permite:

- Texto con formato básico.
- Vista previa.
- Una o varias imágenes.
- Selección de alcance.
- Selección de un destino de prueba.
- Configuración de pausa entre publicaciones.
- Selección del nivel de seguridad.

## 16. Imágenes en mensajes masivos

Las imágenes se cargan de manera independiente para cada publicación de Moodle.

Por ejemplo, si un mensaje con dos imágenes se envía a 20 grupos, Moodle Forum Toolkit debe crear 20 publicaciones y cargar las dos imágenes en el área temporal correspondiente a cada una.

Por este motivo, los mensajes masivos con imágenes tardan más que los mensajes exclusivamente de texto.

## 17. Modos de seguridad del envío masivo

Existen tres modos:

### 17.1 Prueba por cada aula

Antes de procesar los destinos pendientes de un aula, se requiere una publicación de prueba verificada en esa aula.

Es el modo recomendado para las primeras campañas.

### 17.2 Una prueba para toda la campaña

Una sola publicación de prueba correctamente verificada habilita el procesamiento del resto de destinos seleccionados.

### 17.3 Sin prueba previa

Permite ejecutar la campaña sin publicación de prueba.

Incluso en este modo se conserva:

- Confirmación explícita antes de publicar.
- Registro local de destinos enviados.
- Verificación posterior.
- Prevención de reintentos automáticos cuando el estado es incierto.

## 18. Prevención de duplicados

La herramienta mantiene un registro local por campaña y destino.

Antes de publicar también intenta detectar si el mismo contenido ya existe en la discusión.

Cuando una campaña incluye imágenes, la detección considera además los nombres o atributos de las imágenes cuando estos pueden identificarse en la publicación.

Si Moodle procesa una publicación pero la herramienta no logra verificarla, el destino no se reintenta automáticamente. Se recomienda revisar Moodle manualmente antes de repetir la operación.

## 19. Exportación CSV

La información consolidada puede exportarse a CSV para análisis adicional.

El archivo contiene información como:

- Aula.
- Grupo.
- Autor.
- Fecha.
- Mensaje.
- Estado del tutor.
- Relación padre-respuesta.
- Adjuntos.
- Enlaces directos.

## 20. Privacidad y seguridad

Moodle Forum Toolkit opera en el navegador del usuario autenticado.

La herramienta:

- No solicita ni guarda la contraseña de Moodle.
- No guarda cookies de sesión.
- No almacena manualmente el `sesskey` de Moodle.
- Utiliza la sesión existente del navegador para realizar solicitudes del mismo origen.
- No envía los mensajes o archivos a un servidor externo propio.
- Guarda preferencias y registros locales mediante `localStorage` de la instalación Moodle.

No publique repositorios, capturas o registros que contengan información personal de estudiantes sin aplicar previamente los criterios institucionales de privacidad.

## 21. Consideraciones para diferentes instituciones

Aunque el script se diseñó para ser reutilizable, las instalaciones Moodle pueden variar en:

- Versión de Moodle.
- Tema visual.
- Editor habilitado.
- Políticas de archivos.
- Plugins instalados.
- Métodos de agrupamiento.
- Restricciones de seguridad.

Por ello, una función que depende de la interfaz interna de Moodle puede requerir ajustes en instalaciones con personalizaciones importantes.

## 22. Solución de problemas

### El panel no aparece

- Confirme que Tampermonkey está habilitado.
- Confirme que la URL corresponde a `mod/forum/view.php`.
- Revise si el navegador exige habilitar userscripts.

### No se detectan grupos

- Compruebe que el usuario puede ver el selector de grupos.
- Si no hay selector, la herramienta debería crear un **Grupo único**.

### La respuesta directa no se verifica

Abra el mensaje en Moodle y compruebe si la publicación quedó efectivamente creada. No repita inmediatamente el envío si existe la posibilidad de que Moodle ya lo haya procesado.

### La imagen no se carga

- Revise el formato y tamaño.
- Compruebe si el editor nativo de Moodle permite insertar imágenes.
- Si aparece un mensaje de incompatibilidad, utilice **Abrir en Moodle** y complete la respuesta manualmente.

### Una respuesta aparece al mismo nivel visual en Moodle

Cambie la visualización del foro a formato anidado. Moodle puede conservar correctamente la relación padre-respuesta aunque una vista plana muestre todos los mensajes al mismo nivel.

## 23. Actualización del script

Cuando instale una nueva versión:

1. Conserve una copia de la versión que está utilizando.
2. Sustituya el código completo en Tampermonkey.
3. Guarde.
4. Recargue Moodle.
5. Verifique el número de versión mostrado en el panel.
6. Realice una prueba controlada antes de un envío masivo.

Las preferencias guardadas en `localStorage` normalmente permanecen entre actualizaciones mientras se mantengan las mismas claves de configuración.

## 24. Publicación en GitHub

La estructura recomendada del repositorio es:

```text
moodle-forum-toolkit/
├── Moodle-Forum-Toolkit.user.js
├── README.md
├── MANUAL_USUARIO.md
├── Manual_de_Usuario_Moodle_Forum_Toolkit.docx
├── CHANGELOG.md
└── LICENSE
```

Antes de publicar capturas de pantalla se recomienda anonimizar nombres, fotografías, correos, trabajos y cualquier información identificable de estudiantes.

## 25. Licencia

Moodle Forum Toolkit se distribuye bajo licencia MIT.

La licencia permite usar, copiar, modificar, distribuir y publicar versiones derivadas, siempre que se mantenga el aviso de copyright y la licencia correspondiente.

Copyright © 2026 Juan Pablo Moreno Ortiz.

## 26. Autor y donaciones

Desarrollado por **Juan Pablo Moreno Ortiz**.

El uso de la herramienta es gratuito y abierto bajo licencia MIT. Si resulta útil y se desea apoyar voluntariamente su desarrollo y mantenimiento, se agradecen donaciones a la Llave:

**@moreno3666**

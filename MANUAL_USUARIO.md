# Manual de Usuario
## Moodle Forum Toolkit - Gestor y Consolidador de Foros

**Versión:** 1.11.0  
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

## 3. Instalación en Tampermonkey

Existen dos formas de instalar Moodle Forum Toolkit.

### 3.1 Instalación directa desde el userscript

1. Instale la extensión **Tampermonkey** en el navegador.
2. Abra la versión RAW del userscript:
   `https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/main/Moodle-Forum-Toolkit.user.js`
3. Tampermonkey debería reconocer automáticamente el archivo como userscript y mostrar la pantalla de instalación.
4. Revise el nombre y la versión del script.
5. Pulse **Instalar**.
6. Abra o recargue una página de foro Moodle cuya ruta contenga `mod/forum/view.php`.
7. En la esquina inferior derecha deberá aparecer el panel **Moodle Forum Toolkit**.

Esta es la forma recomendada porque facilita instalar y actualizar el script desde el archivo publicado.

### 3.2 Instalación manual copiando el código

Si el navegador no abre automáticamente la pantalla de instalación:

1. Instale y habilite **Tampermonkey**.
2. Abra el panel de Tampermonkey.
3. Seleccione **Crear un nuevo script** o el botón equivalente.
4. Elimine el contenido de ejemplo que aparece en el editor.
5. Abra el archivo `Moodle-Forum-Toolkit.user.js` del repositorio.
6. Copie **todo el contenido**, incluida la cabecera que comienza con `// ==UserScript==`.
7. Pegue el código completo en el editor de Tampermonkey.
8. Guarde con **Archivo → Guardar** o con `Ctrl + S`.
9. Compruebe en el panel de Tampermonkey que **Moodle Forum Toolkit** esté habilitado.
10. Abra o recargue un foro Moodle.

### 3.3 Comprobación de la instalación

Cuando la instalación es correcta:

- El script aparece habilitado en el panel de Tampermonkey.
- Al entrar a un foro Moodle aparece el panel flotante de Moodle Forum Toolkit.
- El panel muestra el número de versión instalado.

Si el panel no aparece:

- Confirme que Tampermonkey esté habilitado.
- Confirme que Moodle Forum Toolkit esté activado dentro de Tampermonkey.
- Recargue la página del foro.
- Verifique que la URL corresponda a una página de foro Moodle con `mod/forum/view.php`.
- En navegadores que lo exijan, habilite la ejecución de userscripts para Tampermonkey.

### 3.4 Iniciar desde la página «Mis cursos»

La versión 1.11.0 también muestra Moodle Forum Toolkit al acceder a la página «Mis cursos» del portal institucional, sin necesidad de entrar manualmente en cada aula. Una ubicación compatible es:

`https://campus0c.unad.edu.co/campus/miscursos.php`

En instalaciones Moodle estándar, el gestor también puede abrirse desde el panel de usuario (`/my/` o `/my/index.php`).

Para revisar los foros desde **Mis cursos**:

1. Compruebe que Moodle Forum Toolkit esté actualizado y habilitado en Tampermonkey. Es posible que el navegador solicite aprobar los nuevos permisos de almacenamiento del script.
2. Si ya tenía foros configurados en una versión anterior, entre **una sola vez** en uno de esos foros con la nueva versión instalada. El script migrará su lista previa al almacenamiento compartido del propio userscript.
3. Abra o recargue la página **Mis cursos**. Allí aparecerá el panel **Moodle Forum Toolkit** con las instalaciones Moodle y los foros que haya guardado.
4. Pulse **Administrar foros** para marcar cuáles están activos. También puede agregar URLs, renombrar, eliminar o importar un archivo JSON.
5. Pulse **Revisar foros activos** en la instalación Moodle correspondiente. Se abrirá **otra pestaña** con el gestor, que comenzará automáticamente la consolidación de todos los foros activos de esa instalación.

**Importante:** si el portal «Mis cursos» y los foros se encuentran en dominios diferentes, la consolidación se realiza en la pestaña del dominio Moodle. Esta separación respeta las restricciones de seguridad del navegador. No es necesario abrir manualmente cada aula, pero debe disponer de una sesión válida también en la instalación Moodle donde están los foros. Si se muestra una página de inicio de sesión, autentíquese y regrese al foro para continuar.

La apertura desde «Mis cursos» únicamente consulta los foros y genera el informe. **No publica mensajes automáticamente.** La publicación directa o masiva sigue requiriendo confirmación explícita.

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

La herramienta conserva los foros registrados en el almacenamiento compartido del userscript en ese navegador, incluso después de cerrar Moodle. Las configuraciones anteriores guardadas en el almacenamiento local de Moodle se migran al visitar por primera vez un foro tras la actualización. Para añadir uno, abra **⚙ Configurar foros**, pegue la URL completa del foro en Moodle y pulse **Agregar**.

Una URL válida debe corresponder a la página principal del foro, por ejemplo:

`https://campus.ejemplo.edu/mod/forum/view.php?id=1234`

No utilice la URL de una discusión individual (`discuss.php?d=...`) ni la página de respuesta (`post.php?reply=...`).

También puede utilizar **Agregar foro actual** mientras está dentro de un foro.

### 5.1 Seleccionar qué foros revisar

Cada foro configurado dispone de una casilla. **Marcada** significa que se incluirá en la consolidación y, si se selecciona su alcance, en los posibles envíos masivos. **Desmarcada** significa que permanecerá guardado, pero no se procesará hasta volver a activarlo.

Utilice **Guardar** para cambiar el nombre mostrado y **Eliminar** para quitar un foro del listado. Eliminar una entrada de la configuración no borra contenido del foro en Moodle.

### 5.2 Llevar los foros a otro computador mediante Google Drive

El registro compartido del userscript permite ver los foros desde el portal institucional y desde Moodle **dentro del mismo navegador**. La sincronización de Tampermonkey puede distribuir el código, pero **no se debe suponer que la configuración se sincronice automáticamente entre computadores**. Para ello se mantiene la exportación/importación JSON.

Para utilizar la misma lista de foros en otro computador:

1. En el computador donde ya tiene los foros configurados, abra **⚙ Configurar foros**.
2. Pulse **Exportar foros (.json)**.
3. Guarde el archivo descargado en una carpeta privada de Google Drive.
4. En el otro computador, abra Moodle e instale Moodle Forum Toolkit.
5. Descargue el archivo JSON desde su Drive.
6. Abra **⚙ Configurar foros** y seleccione **Importar foros (.json)**.
7. Elija **Combinar** para conservar los foros existentes y añadir los nuevos, o **Reemplazar toda la lista** si desea sustituirla.
8. Revise las casillas para activar solamente los foros que necesita atender en ese computador.

La exportación contiene nombres, URLs y casillas de activación; **no incluye contraseñas, cookies, claves de sesión ni información de estudiantes**. Mantenga el archivo privado, porque las URLs pueden revelar la estructura de sus cursos.

### 5.3 Restricción por instalación Moodle

Por seguridad, la lista que se consolida desde una pestaña solamente puede incluir foros del mismo origen (`https://dominio...`). Si importa un JSON con enlaces de otra instalación Moodle, esas entradas se omitirán y se informará cuántas fueron ignoradas.

Si utiliza varias instalaciones Moodle, abra cada una y exporte/importe su configuración correspondiente por separado.

### 5.4 Foros con grupos separados o grupo único

Cuando Moodle presenta un selector de grupos, la herramienta identifica los grupos disponibles. Cuando no existe el selector, trata el foro como una unidad denominada **Grupo único**.

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

## 14.5 Copiar y pegar mensajes con hipervínculos

Si copia contenido enriquecido desde ChatGPT, un documento o una página web y el portapapeles incluye los enlaces HTML, el editor de Moodle Forum Toolkit los convierte automáticamente al formato Markdown conservando sus direcciones. Compruebe que los enlaces funcionen en la **Vista previa** antes de enviarlos.

También puede pegar o escribir enlaces explícitamente:

`[Ver grabación del primer CIPAS](https://youtu.be/E4Mrvvk7NNk)`

Si la aplicación de origen solo ofrece texto plano y no incluye las direcciones de los enlaces, la herramienta no puede recuperarlas automáticamente.

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

## 17.4 Escaneo de publicaciones previas y envíos inciertos

Antes de repetir una campaña que pudo haberse publicado con una versión anterior, utilice **Escanear publicaciones existentes**. El proceso consulta los destinos seleccionados sin publicar nuevos mensajes y registra como enviados aquellos en los que encuentre una coincidencia fiable.

Si Moodle acepta un envío, pero el script no logra identificar con certeza la nueva publicación, el destino queda marcado como **revisión manual** y se bloquean sus reintentos automáticos. Seleccione ese destino y utilice **Abrir destino para revisar**.

Después de comprobarlo en Moodle, elija **Confirmar publicación existente** si el mensaje sí está publicado o **Liberar reintento** únicamente si verificó que no se publicó.

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
- Conserva una copia local de las preferencias y guarda el catálogo compartido de foros mediante el almacenamiento de Tampermonkey en ese navegador.

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

## 24. Licencia

Moodle Forum Toolkit se distribuye bajo licencia MIT.

La licencia permite usar, copiar, modificar, distribuir y publicar versiones derivadas, siempre que se mantenga el aviso de copyright y la licencia correspondiente.

Copyright © 2026 Juan Pablo Moreno Ortiz.

## 25. Autor y donaciones

Desarrollado por **Juan Pablo Moreno Ortiz**.

El uso de la herramienta es gratuito y abierto bajo licencia MIT. Si resulta útil y se desea apoyar voluntariamente su desarrollo y mantenimiento, se agradecen donaciones a la Llave:

**@moreno3666**

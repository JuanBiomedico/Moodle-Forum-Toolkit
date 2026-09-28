# Manual de Usuario
## Moodle Forum Toolkit - Gestor y Consolidador de Foros

**Versión:** 1.15.0  
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
   `https://raw.githubusercontent.com/JuanBiomedico/Moodle-Forum-Toolkit/refs/heads/feature/portal-dashboard-v1.11.0/Moodle-Forum-Toolkit.user.js`
3. Tampermonkey debería reconocer automáticamente el archivo como userscript y mostrar la pantalla de instalación.
4. Revise el nombre y la versión del script.
5. Pulse **Instalar**.
6. Entre en la página principal de un curso Moodle (`.../course/view.php?id=...`) o en uno de sus foros (`.../mod/forum/view.php?id=...`).
7. En la esquina inferior derecha aparecerá la barra compacta **Moodle Forum Toolkit**. Pulse **Mostrar** cuando necesite utilizar el gestor.

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

Cuando la instalación es correcta, el script aparece habilitado en Tampermonkey. Al entrar en la página principal de **cualquier curso Moodle** o en un foro, aparece una pequeña barra **Moodle Forum Toolkit** en la esquina inferior derecha con el botón **Mostrar**. El panel comienza **plegado por defecto**, sin consultar los foros ni iniciar análisis automáticos.

La herramienta **no aparece** en las páginas de acceso y selección de cursos como `/campus/miscursos.php` ni en el panel general `/my/`. Entre primero en una de las aulas.

Si no aparece en una página de curso o foro, compruebe que Tampermonkey esté habilitado, que el script esté activado y que la dirección corresponda a `/course/view.php` o `/mod/forum/view.php`. En navegadores que lo exijan, habilite la ejecución de userscripts.

### 3.4 Iniciar desde cualquier curso Moodle

1. Acceda al campus mediante el procedimiento habitual de autenticación institucional y abra uno de sus cursos.
2. Pulse **Mostrar** en la barra compacta de Moodle Forum Toolkit.
3. En **Configurar foros**, registre las direcciones de los foros que desea consultar; puede activar, desactivar, renombrar o eliminar cada foro sin afectar su contenido en Moodle.
4. Cuando termine de revisar el curso y desee empezar, pulse **Consolidar foros activos**. La herramienta consultará los foros activados de **esa misma instalación Moodle**, aunque correspondan a otros cursos.
5. Pulse **Ocultar** para volver a la barra compacta. Su selección se conserva al navegar y recargar el campus.

El gestor funciona en páginas de curso como `https://campus151.unad.edu.co/ses112/course/view.php?id=137`, y en otros cursos con la misma estructura; no depende del identificador de un curso concreto. Si un foro redirige a una página de autenticación institucional, inicie sesión normalmente y regrese al curso. El gestor no elude ni sustituye la autenticación de Moodle.

### 3.5 Configuración entre equipos

Los foros se recuerdan en el navegador donde se configuraron. Para trasladarlos a otro computador, utilice **Exportar foros (.json)** desde **Configurar foros**, guarde el archivo en un lugar privado como Google Drive e impórtelo desde el otro equipo.

## 3.6 Correo interno de Moodle

La versión 1.12.1 incorpora una pestaña **Correos** dentro de la misma ventana de resultados que contiene **Vista lista** y **Conversaciones**. El correo interno no se consulta en segundo plano ni a intervalos periódicos.

Desde el panel principal puede hacer una comprobación manual rápida mediante **Actualizar correo**. Para la revisión completa, abra la ventana de resultados, seleccione **Correos** y pulse **Actualizar**. La herramienta consulta entonces los cursos identificados en los foros configurados y presenta la información agrupada por aula.

La pestaña **Correos** muestra, para cada aula, cuántos mensajes recibidos están **Pendientes** y cuántos aparecen **Contestados**, además del estado leído/no leído, remitente, asunto, fecha y un acceso para abrir el mensaje. Para determinar si existe respuesta, el script compara el mensaje recibido con las referencias que Moodle conserva en los mensajes enviados. Esta clasificación debe considerarse una ayuda de seguimiento; una personalización institucional del complemento `local_mail` puede requerir ajustes.

## 3.7 Reutilizar el mensaje en el correo interno

En **Redactar / enviar mensaje** puede activar **También por correo interno (CCO)** y escribir un asunto independiente. El contenido del editor se reutiliza como cuerpo del correo.

Los destinos seleccionados se agrupan por curso. La herramienta reúne los participantes de los grupos seleccionados y utiliza el mecanismo de destinatarios privados del propio correo interno para que los destinatarios no queden expuestos entre sí.

Antes de continuar se muestra una confirmación con el alcance. El botón **Enviar prueba al foro** solo realiza una prueba en el foro y no envía un correo de prueba al grupo.

Los enlaces e hipervínculos se conservan en el cuerpo del correo. Las imágenes insertadas mediante **Añadir imagen** también se cargan dentro del correo interno utilizando el editor TinyMCE de Moodle y se mantienen en la misma posición indicada por la vista previa. Si la instalación no expone un cargador de imágenes compatible, el envío se detiene para evitar publicar un correo con figuras rotas.

Se mantiene un registro local independiente para evitar repeticiones. Si el resultado de un envío no puede verificarse con seguridad, el curso queda pendiente de revisión y se recomienda comprobar las carpetas **Enviados** y **Borradores** antes de volver a intentarlo.

En cursos sin grupos, o cuando el complemento limita la cantidad de destinatarios mostrados de una sola vez, la operación puede detenerse indicando que hay demasiados destinatarios. En ese caso utilice grupos del curso o complete el envío desde la interfaz nativa.

## 3.8 Asistente de calificación de tareas

La versión 1.13.0 añade un módulo para las páginas de calificación individual de tareas Moodle cuya dirección contiene `/mod/assign/view.php?action=grader`.

El panel aparece plegado por defecto. Al pulsar **Mostrar** ofrece dos acciones:

- **Preparar 0 + retroalimentación**: coloca 0 en los campos de puntuación detectados, escribe la observación de los criterios y carga la retroalimentación HTML, pero **no guarda**. Esto permite revisar el resultado antes de afectar la calificación.
- **Confirmar 0 y guardar / siguiente**: muestra una confirmación explícita para el estudiante actual, prepara los campos y utiliza el botón de Moodle **Guardar y mostrar siguiente** cuando está disponible.

El asistente reconoce las rúbricas cuyos controles siguen el patrón estándar `advancedgrading-criteria-...-score`. Si la tarea utiliza un campo de calificación directa, también intenta asignar 0 en ese campo. Las observaciones de rúbrica reciben por defecto el texto **No se realizó entrega válida de la actividad.**

La retroalimentación conserva el formato institucional HTML suministrado para este flujo e incluye una sección opcional de oportunidad de recuperación. La fecha puede modificarse desde el panel y se recuerda en el navegador. Por defecto se ha dejado el 4 de octubre de 2026, correspondiente al uso actual; cámbiela o desactive la sección para otras actividades.

Por seguridad, no se ejecuta un ciclo que califique automáticamente estudiantes consecutivos. Debe revisar y confirmar cada estudiante antes de guardar. Esto evita que una navegación inesperada o una entrega válida reciba 0 sin revisión docente.

Si Moodle no expone TinyMCE, el asistente intenta utilizar el campo de retroalimentación disponible. Si no puede cargar la retroalimentación, avisa antes de guardar.

## 3.9 Nombre del tutor en la retroalimentación

El asistente intenta leer automáticamente el nombre mostrado en el perfil Moodle del docente. Ese valor aparece en el campo **Nombre del tutor**.

Puede modificarlo manualmente antes de preparar la retroalimentación. El nombre se guarda localmente en el navegador para reutilizarlo en siguientes calificaciones. El botón **Usar perfil** vuelve a cargar el nombre detectado desde Moodle.

La firma generada utiliza el formato:

**Nombre del tutor**  
*Tutor*

Esto evita dejar una firma genérica cuando el perfil Moodle permite identificar al docente.

## 3.10 Panel central de calificaciones

Desde la página general de calificaciones de una tarea, `/mod/assign/view.php?action=grading`, Moodle Forum Toolkit muestra un panel plegado con **Abrir panel de calificaciones**.

El panel completo mantiene una lista de estudiantes a la izquierda y el calificador nativo de Moodle a la derecha. De esta manera puede revisar y completar la rúbrica sin abandonar la vista central.

Los filtros disponibles son:

- **Todos**.
- **No entregados**.
- **Entregados**.
- **Pendientes de calificar**.
- **Calificados**.

Estos filtros utilizan los estados estándar de la tabla de calificaciones del módulo `assign`. Cuando una actividad contiene varias páginas de estudiantes, el Toolkit recorre las páginas del filtro seleccionado y consolida la lista.

Cada estudiante muestra el estado de entrega, la nota visible y una acción de calificación. Para estudiantes sin entrega se utiliza **Calificar / aplicar 0**. Al seleccionar un estudiante, el calificador oficial de Moodle se carga en el lado derecho mediante una vista embebida de la misma instalación. La rúbrica, comentarios, archivos y validaciones continúan siendo los de Moodle, no una copia implementada por el Toolkit.

Dentro de ese calificador permanece disponible el asistente de 0 puntos. Puede:

- **Preparar 0 + retroalimentación** sin guardar.
- **Confirmar 0 y guardar**, permaneciendo en el estudiante actual.
- **Confirmar 0 y guardar / siguiente**, cuando quiera avanzar mediante la navegación propia de Moodle.
- Modificar manualmente cualquier criterio de la rúbrica antes de guardar.
- Escribir observaciones específicas en los criterios o utilizar el texto institucional automático para una no entrega.

El panel no asigna 0 de forma masiva. La lista sirve para filtrar y navegar; cualquier cambio de calificación sigue requiriendo la acción explícita del docente en el estudiante correspondiente.

## 3.11 Accesos rápidos a calificaciones

No existe una única página de calificación para todo el aula: cada tarea Moodle tiene su propia dirección `mod/assign/view.php?id=...`. Por esa razón, Moodle Forum Toolkit mantiene un registro separado de **actividades de calificación**.

Desde la página principal de un curso, pulse **📝 Calificaciones**. El gestor muestra dos bloques:

- **Actividades configuradas**: accesos guardados que puede activar, renombrar, abrir o quitar.
- **Detectadas en esta página**: tareas que Moodle Forum Toolkit encuentra en la página actual del curso y que puede añadir con un clic.

Al añadir una actividad, se guarda la dirección canónica de su vista de calificaciones (`action=grading`). La configuración queda disponible desde otras páginas compatibles de la misma instalación Moodle, por ejemplo un foro o una página normal de tarea.

Cuando se visita directamente una página de calificación o de calificación individual, el Toolkit también registra esa actividad de forma automática si aún no estaba guardada.

Esta configuración es independiente de la lista de foros. Un curso puede tener varios foros y varias tareas configuradas.

## 3.12 Documentos adjuntos en mensajes masivos

El editor de **Redactar / enviar mensaje** dispone ahora de dos controles distintos:

- **🖼 Añadir imagen**: inserta la figura dentro del cuerpo del mensaje en la posición seleccionada.
- **📎 Adjuntar archivo**: agrega uno o varios documentos como archivos adjuntos.

Los documentos seleccionados se muestran como fichas debajo del editor y pueden retirarse antes del envío.

Para los foros, Moodle Forum Toolkit abre de forma interna el formulario nativo de respuesta, utiliza su **gestor de archivos** y carga cada documento al área de adjuntos antes de publicar. La verificación posterior comprueba también que los nombres de los archivos aparezcan en la publicación.

Si la campaña incluye **correo interno (CCO)**, los mismos documentos se cargan en el área de adjuntos del correo interno. Las imágenes continúan insertándose dentro del cuerpo y los demás documentos se envían como adjuntos.

Los tipos de archivo, el tamaño máximo y la cantidad permitida dependen de Moodle y de la configuración concreta del foro o del correo. Si el gestor nativo no permite un archivo, el Toolkit detiene ese destino y muestra el error en lugar de continuar sin el adjunto.

Las pruebas previas de una campaña incluyen también sus documentos. Si cambia los adjuntos, la herramienta considera que se trata de una combinación distinta a efectos del registro anti-duplicados.

## 4. Panel principal

El panel permanece **oculto por defecto** como una barra compacta en la esquina inferior derecha. Pulse **Mostrar ▴** para desplegarlo y **Ocultar ▾** cuando quiera seguir consultando el contenido de la página. El panel desplegado tiene altura máxima y desplazamiento interno para ocupar menos espacio.

Al abrirse, muestra el número de foros activos y configurados, el estado de la operación, el estado del **correo interno** y los botones **Consolidar foros activos**, **Configurar foros** y **Redactar / enviar mensaje**. **Inmediatamente debajo de los botones** aparece, en una única línea, el texto **Donaciones voluntarias · Llave @moreno3666**. La Vista Conversaciones conserva el mismo mensaje en su pie inferior.

El navegador recuerda el estado plegado o desplegado. El análisis nunca se inicia al abrir el panel; solamente comienza cuando se pulsa **Consolidar foros activos**. Ocultar el panel durante una consolidación no cancela el trabajo en curso.

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

**El análisis nunca se inicia automáticamente** al entrar en un foro, una página de curso o «Mis cursos». Primero puede consultar el contenido de Moodle o ajustar qué foros están activos.

Cuando desee iniciar la revisión, presione **Consolidar foros activos**.

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

Después del envío, la herramienta vuelve a consultar la discusión y verifica que la respuesta tenga como padre el mensaje del estudiante. Cuando la publicación se confirma, actualiza únicamente la fila correspondiente y muestra la nueva intervención del tutor. No reconstruye toda la Vista lista ni cambia la posición de lectura.

## 8. Vista Conversaciones

La Vista Conversaciones reconstruye la estructura padre-hijo de las publicaciones.

La herramienta prioriza las relaciones explícitas suministradas por Moodle, especialmente el enlace **Mostrar mensaje anterior** y los parámetros de respuesta asociados al mensaje.

Los mensajes del tutor y de los estudiantes se muestran dentro de un árbol de conversación para conservar el contexto. **Al responder directamente desde Conversaciones**, la versión 1.11.3 actualiza el estado del estudiante e inserta la respuesta verificada en su misma rama, sin cerrar los grupos y discusiones abiertos ni cambiar los filtros o el desplazamiento. Los contadores de mensajes pendientes también se actualizan. Si desea reorganizar las conversaciones según los nuevos estados, utilice los filtros o el botón **Actualizar** de manera explícita.

En el extremo inferior de la Vista Conversaciones aparece un pie compacto con el mensaje de donaciones voluntarias y la **Llave `@moreno3666`**. El pie se mantiene visible durante el desplazamiento para poder consultarlo sin abrir otras ventanas. No aparece en Vista lista.

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

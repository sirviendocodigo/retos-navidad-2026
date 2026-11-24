# 24 Commits | Retos navideños de código

Calendario de adviento de código del 1 al 24 de diciembre, organizado por Next Digital, Lean Mind y sirviendo código;.

Cada día a las 10:00 (hora de Madrid) se abre un reto. Las personas lo resuelven con el lenguaje que quieran, pegan el resultado en la web y entran en el ranking.

## Cómo está montado

- **La web** (`index.html`) es un único archivo que se publica gratis con GitHub Pages.
- **El "excel"** es una hoja de Google Sheets. Ahí están los retos con sus soluciones y ahí se apunta cada envío: quién, qué día, qué respondió, si está bien, a qué hora y el código con el que lo resolvió.
- **El puente** entre las dos es un pequeño script de Google Apps Script (`Code.gs`) que vive dentro de la hoja. La web le manda la respuesta y él la comprueba, así que las soluciones nunca llegan a la web ni a GitHub.

## Puesta en marcha (unos 20 minutos)

### 1. Crear la hoja de cálculo

1. Con la cuenta de Google del equipo, crea una hoja nueva en Google Sheets. Ponle un nombre, por ejemplo `24 Commits 2026`.
2. Ve a **Extensiones > Apps Script**.
3. Borra lo que haya en el editor, pega todo el contenido de `Code.gs` y guarda.
4. En el desplegable de funciones de arriba elige `prepararHoja` y pulsa **Ejecutar**. La primera vez Google pedirá permisos: acéptalos (si sale "Google no ha verificado esta aplicación", entra en Configuración avanzada y continúa, porque el script es vuestro).
5. Vuelve a la hoja. Tendrás tres pestañas: `Retos` (con los 24 días ya repartidos entre las tres marcas), `Envios` y `Participantes`.

### 1 bis. Cargar los 24 retos

1. En la hoja, ve a la pestaña `Retos`.
2. **Archivo > Importar > Subir** y elige `retos-para-importar.csv`.
3. En "Ubicación de importación" elige **Reemplazar hoja actual** y en "Tipo de separador" **Coma**. Desmarca "Convertir texto en números, fechas y fórmulas".
4. Comprueba que hay 24 filas con enunciado, entrada, solución e historia. Las columnas Persona, Cargo y Foto se rellenan cuando sepáis quién hace cada papel.

### 2. Publicar el script

1. En Apps Script pulsa **Implementar > Nueva implementación**.
2. En el engranaje elige **Aplicación web**.
3. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier usuario**.
4. Pulsa **Implementar** y copia la URL que termina en `/exec`.

> Si más adelante cambiáis algo de `Code.gs`, hay que ir a **Implementar > Gestionar implementaciones**, editar la existente y elegir **Nueva versión**. Así la URL no cambia.

### 3. Conectar la web

Abre `index.html` y, al principio del bloque `<script>`, rellena:

```js
API_URL: 'https://script.google.com/macros/s/.../exec',
URL_PRIVACIDAD: 'https://enlace-a-vuestra-politica-de-privacidad',
```

Mientras `API_URL` esté vacío, la web funciona en modo demostración con tres retos de ejemplo.

Ahí mismo podéis cambiar los colores de cada marca por los de sus manuales.

### 4. Subirla a GitHub

1. Crea un repositorio público, por ejemplo `24-commits`.
2. Sube `index.html`, `Code.gs` y este `README.md`. Ninguno contiene soluciones; esas solo están en la hoja.
   **No subas nunca** `retos-para-importar.csv` ni la carpeta de herramientas de la organización: ahí están todas las soluciones y la historia completa.
3. En el repositorio ve a **Settings > Pages**, elige la rama `main` y la carpeta `/ (root)`, y guarda.
4. En un par de minutos la web estará en `https://<usuario>.github.io/24-commits/`.

## Cómo escribe cada marca sus retos

Todo se hace en la pestaña `Retos` de la hoja, sin tocar GitHub. Cada fila es un día:

| Columna | Qué poner |
|---|---|
| Día | Ya viene puesto (1 a 24) |
| Marca | Ya viene puesta, alternando Next Digital, Lean Mind y sirviendo código; |
| Título | El nombre del reto |
| Enunciado | La historia y lo que hay que calcular. Una línea en blanco separa párrafos. Se puede usar `**negrita**` y `` `código` `` |
| Entrada | Los datos que la gente tiene que procesar (números, palabras, texto...) |
| Solución | La respuesta exacta. Se compara sin distinguir mayúsculas ni espacios de más |
| Persona | Nombre de la persona sospechosa que se revela ese día al acertar |
| Cargo | Su cargo, tal cual se mostrará |
| Foto (URL) | Enlace a su foto. Lo más fácil es subir las fotos a una carpeta `fotos/` del repositorio y poner `fotos/nombre.jpg` |
| Historia que se desbloquea | El trozo del caso de ese día. Una línea en blanco separa párrafos |

Consejos para escribir retos:

- La respuesta tiene que ser **un único valor**: un número, una palabra o una frase corta.
- Que la entrada sea lo bastante larga para que no se pueda resolver a mano.
- Antes de dejarlo listo, que otra persona lo resuelva de cero y compruebe que le sale la misma solución.
- Si la fila tiene el título vacío, ese día sale como "próximamente" aunque ya haya llegado la fecha.

Compartid la hoja solo con quien escriba retos. Quien tenga acceso a la hoja puede ver todas las soluciones.

## El caso

Cada vez que alguien acierta un reto, la web le enseña la persona sospechosa de ese día (foto, nombre y cargo) y su trozo de historia, y la guarda en su expediente. Esa información solo sale de la hoja cuando el resultado es correcto: no está en la web ni en GitHub, así que no se puede leer por adelantado.

El título y la introducción del caso se cambian en `index.html`, dentro de `CONFIG.CASO`.

Sobre las fotos:

- Hace falta el **consentimiento por escrito** de cada persona para publicar su foto, nombre y cargo en una web pública, y que sepa que aparece como sospechosa en un juego.
- Mejor en formato cuadrado, unos 400 x 400 píxeles y menos de 100 KB cada una, para que la web cargue rápido.
- Si una fila no tiene foto, la web muestra las iniciales.

## El ranking

- Gana quien más retos resuelve.
- Si hay empate, gana quien menos tiempo haya tardado en total, contando desde que se abre cada reto hasta su primera respuesta correcta.
- Tras un fallo hay que esperar 60 segundos para volver a intentarlo.
- El ranking de la web se actualiza cada minuto. La pestaña `Envios` tiene el detalle completo y se puede ordenar o filtrar como cualquier hoja.

Algunos ajustes están al principio de `Code.gs` (hora de apertura, segundos de espera, número de personas en el ranking).

## El código de cada participante

Cada envío lleva el código con el que se ha resuelto el reto, pegado en la web o subido como archivo. El archivo se lee como texto en el navegador de la persona y se guarda como texto en la hoja: no se sube ningún archivo y nada se ejecuta.

Lo que corrige automáticamente es el resultado. El código sirve para revisar, y en la pestaña `Envios` tenéis tres columnas para ello:

- **Código**: el código tal cual lo ha enviado.
- **Huella**: una firma del código sin espacios ni saltos de línea. Si dos personas envían el mismo código con distinto formato, tienen la misma huella.
- **Posible copia**: se rellena sola cuando alguien envía un código idéntico al de otra persona ese mismo día, e indica de quién.

Cómo revisar sin volverse loca:

1. **No se revisa todo.** Cada día basta con filtrar `Posible copia` por las filas que no estén vacías.
2. **Al final, el top.** Antes de dar premios, alguien de Lean Mind o Next Digital lee el código de las primeras posiciones y comprueba que tiene sentido para el reto. Si hay dudas, lo ejecuta con la entrada del día y mira si da el resultado enviado.
3. **Cambios pequeños para disimular** (renombrar variables, añadir comentarios) no los detecta la huella. Para el top, la revisión a mano del paso 2 los pilla.

Y un extra para redes: filtrando por día y `Correcto = TRUE` tenéis todas las soluciones buenas para elegir la más corta, la más original o la del lenguaje más raro y compartirla.

## Limitaciones a tener en cuenta

- Todo el mundo recibe la misma entrada, así que alguien podría pasar la respuesta a otra persona. La columna `Posible copia` detecta los códigos idénticos y la revisión del top hace el resto.
- No hay contraseña: un email y un alias identifican a cada persona. Si alguien borra el navegador, vuelve a entrar con el mismo email y recupera su alias.
- Los emails se guardan en la hoja. Hace falta una política de privacidad enlazada en la web (`URL_PRIVACIDAD`) que explique para qué se usan y cuándo se borran.
- Google Apps Script aguanta sin problema cientos de participantes. Si se hiciera muy viral (miles de envíos a la vez en el mismo minuto), podría ir lento en el momento de apertura.

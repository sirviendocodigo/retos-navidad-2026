# 24 Commits | Retos navideños de código

Calendario de adviento de código del 1 al 24 de diciembre, organizado por Next Digital, Lean Mind y sirviendo código;.

Cada día a las 00:00 (hora de Madrid; las 23:00 del día anterior en Canarias) se abre un reto. Los retos de días anteriores se pueden seguir haciendo hasta el 24 de diciembre a medianoche (`FIN_CONCURSO`), pero el tiempo siempre cuenta desde que se abrió cada uno. Todo ocurre solo, según la hora; no hay que hacer nada a mano. Las personas lo resuelven con el lenguaje que quieran, pegan el resultado en la web y entran en el ranking.

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
5. En el mismo desplegable elige `probarCorreo` y pulsa **Ejecutar**. Google pedirá permiso para enviar correos en tu nombre (son los enlaces para recuperar el progreso) y te llegará un correo de prueba.
6. Vuelve a la hoja. Tendrás cuatro pestañas: `Retos` (con los 24 días ya repartidos entre las tres marcas), `Envios`, `Participantes` y `Acusaciones`.

### Probar la web con un día concreto

En `CONFIG`, `PRUEBA_DIA_DE_HOY: 21` hace que hoy sea el día 21 del concurso: el reto 21 se abre hoy a las 00:00, los anteriores aparecen como atrasados y los siguientes se abren los próximos días. Con `HORAS_HASTA_NOTAS: -24`, la revisión se ve en cuanto se escribe. Después de probar, volved a poner `PRUEBA_DIA_DE_HOY: 0` y `HORAS_HASTA_NOTAS: 24`, implementad una nueva versión y borrad las filas de prueba de Envios, Participantes y Acusaciones.

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
4. En un par de minutos la web estará en `https://sirviendocodigo.github.io/retos-navidad-2026/`.

## Cómo escribe cada marca sus retos

Todo se hace en la pestaña `Retos` de la hoja, sin tocar GitHub. Cada fila es un día:

| Columna | Qué poner |
|---|---|
| Día | Ya viene puesto (1 a 24) |
| Marca | Ya viene puesta, alternando Next Digital, Lean Mind y sirviendo código; |
| Título | El nombre del reto |
| Enunciado | La historia y lo que hay que calcular. Una línea en blanco separa párrafos. Se puede usar `**negrita**` y `` `código` `` |
| Entrada | Los datos que la gente tiene que procesar (números, palabras, texto...) |
| Solución | La respuesta exacta. Se compara sin distinguir mayúsculas, tildes ni espacios de más. Si es un número, también se acepta con puntos de miles y con coma o punto decimal (1200 = 1.200 = 1200,0; 2.5 = 2,5). Escribidla sin separador de miles para evitar dudas |
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

## Expedientes y progreso de cada persona

- Cada persona solo ve los expedientes de los retos que ha acertado. La pista sale de la hoja únicamente en el momento de acertar.
- La primera vez que alguien envía una respuesta se da de alta con alias y email, y el script le asigna una **clave personal** que se guarda en su navegador. A partir de ahí, la web la usa para identificarle: nadie puede enviar ni consultar el progreso de otra persona sabiendo solo su email.
- Al entrar, la web pide a la hoja los retos resueltos y los expedientes conseguidos con esa clave, así que el progreso está en la hoja y no depende del navegador.
- **Desde otro dispositivo** (o si se borra el navegador): botón "Recupera tu progreso", se escribe el email y llega un correo con un enlace que lleva la clave. Al abrirlo, ese dispositivo recupera todo. Como mucho se manda un correo cada 10 minutos por persona, y la web responde lo mismo exista o no el email, para no revelar quién participa.
- En `Code.gs` hay que poner en `URL_WEB` la dirección de la web en GitHub Pages, para que el enlace del correo funcione.
- Los correos salen de la cuenta de Google dueña de la hoja. Google permite unos **100 correos al día** con una cuenta de Gmail normal y unos 1.500 con Google Workspace. Para un evento así sobra, pero mejor usar una cuenta de Workspace de la empresa.
- La primera vez que se ejecute, Google pedirá permiso para enviar correos en tu nombre: hay que aceptarlo.

## La acusación final

Debajo del calendario hay una sección "¿Quién lo hizo?". Cada persona puede acusar a una de las sospechosas que ha descubierto (solo de los retos que ha acertado) y cambiar de opinión hasta el 24 de diciembre a medianoche; cuenta la última. Las acusaciones se guardan en la pestaña `Acusaciones` de la hoja, una fila por persona. La fecha límite está en `ACUSACIONES_HASTA`, en `Code.gs` y en `index.html` (tiene que ser la misma en los dos).

## Revisión diaria y puntuación

Cada envío lleva el código, el resultado y **cómo se ejecuta** (comando, versión y dependencias). En la pestaña `Envios` hay tres columnas para la revisión: dos con desplegable y una de texto libre.

| Columna | Qué poner |
| --- | --- |
| Revisión: +1 funciona (SÍ/NO) | `SÍ` si al ejecutar el código tal cual, con sus instrucciones, da el resultado. `NO` si no arranca, da otro resultado o la respuesta está escrita a mano |
| Revisión: +1 clean code (SÍ/NO) | `SÍ` si el código está limpio: se lee bien, buenos nombres, funciones pequeñas, sin duplicación, diseño que aguante un cambio. Los tests ayudan. Si no, `NO` |
| Revisión: comentario (lo ve la persona) | Una o dos frases explicando por qué tiene o no cada punto. La persona lo lee al abrir el expediente de ese día |

En `Envios` hay **una sola fila por persona y día**. Si alguien falla y lo vuelve a intentar, su fila se sobrescribe con el último intento y la columna `Intentos` suma uno. Cuando acierta, la fila se queda fija y ya no se aceptan más envíos suyos ese día. `Minutos desde la apertura` son los minutos desde las 00:00 de ese día hasta su envío. Tras un fallo hay que esperar 60 segundos (`ESPERA_FALLO_SEG`); la web bloquea el botón y enseña la cuenta atrás.

Se revisan las filas con `Correcto` en VERDADERO.

**Calendario de revisión.** El reto del día N es "el de hoy" durante todo el día N. Lo que llega ese día se revisa durante el día N+1 y la revisión se publica a las 00:00 del día N+2, junto con el reto nuevo. Hasta esa hora, nada de lo que se escriba en la revisión es visible ni cuenta en el ranking, así que se puede revisar con calma.

**Retos hechos fuera de plazo.** Cada mañana, además, filtrad `Envios` por `Último intento` del día anterior: ahí salen también los retos atrasados. Como su hora de publicación ya pasó, su revisión se ve en cuanto la escribís, así que rellenad las tres columnas juntas.

**Puntos por reto:**

| Caso | Puntos |
| --- | --- |
| Solución correcta (se suma al momento de acertar) | 1 |
| El código funciona (`SÍ` en la revisión) | +1 |
| Clean code (`SÍ` en la revisión) | +1 |

El máximo por reto es 3 y el de los 24 retos, 72. Si el código no funciona, la persona mantiene el punto de acertar y la pista.

**Bonus y ganador.** A los puntos de los retos se suma `BONUS_ACUSACION` (+1) por acertar quién fue. El máximo es 73. Gana quien más puntos tenga y, si hay empate, quien menos minutos haya tardado en total. El bonus está al principio de `Code.gs` y de `index.html` (tiene que coincidir).

**El culpable va en la hoja, no en el código.** En la pestaña `Ajustes`, en la fila "Culpable (nº de expediente)", escribid el número de expediente del culpable (en la trama actual, el 5). El script solo lo usa cuando ya se han cerrado las acusaciones, el 25 a las 00:00: a partir de ese momento el ranking suma el bonus y marca a quien acertó. Como `Code.gs` está en GitHub, nunca escribáis ahí el culpable.

Gana quien más puntos sume. Si hay empate, quien menos tiempo haya tardado en total. Los valores están al principio de `Code.gs` (`PUNTOS_ACIERTO`, `PUNTOS_FUNCIONA`, `PUNTOS_CLEAN_CODE`, `HORAS_HASTA_NOTAS`). Para las copias, la columna `Posible copia` avisa de códigos idénticos; si se confirma, se marca `NO` en las dos columnas de revisión de las dos filas, con un comentario que lo explique.

Cada persona ve su contador de puntos encima del calendario y en la barra de arriba. En cada puerta resuelta aparece "1 pt en revisión" hasta que se publica la revisión, y después "2 de 3 pts", por ejemplo. Al abrir el expediente de ese día ve el desglose (solución, funciona, clean code) y vuestro comentario.

**Columnas de apoyo.** `Código` guarda el código tal cual, `Huella` es una firma del código sin espacios ni saltos de línea, y `Posible copia` se rellena sola cuando alguien envía un código idéntico al de otra persona ese día.

**Ayuda para revisar.** En la carpeta `organizacion` está `resolver.py` con la solución de referencia de cada reto. Claude puede preparar cada mañana una propuesta de revisión (ejecutar los códigos, métricas y una propuesta de SÍ o NO para el punto de clean code) para que el equipo solo tenga que confirmarla.

## Limitaciones a tener en cuenta

- Todo el mundo recibe la misma entrada, así que alguien podría pasar la respuesta a otra persona. La columna `Posible copia` detecta los códigos idénticos y la revisión del top hace el resto.
- No hay contraseña: la clave personal guardada en el navegador hace ese papel, y se recupera por correo. Quien tenga el enlace del correo puede participar en nombre de esa persona, por eso el correo pide no compartirlo.
- Los emails se guardan en la hoja. Hace falta una política de privacidad enlazada en la web (`URL_PRIVACIDAD`) que explique para qué se usan y cuándo se borran.
- Google Apps Script aguanta sin problema cientos de participantes. Si se hiciera muy viral (miles de envíos a la vez en el mismo minuto), podría ir lento en el momento de apertura.

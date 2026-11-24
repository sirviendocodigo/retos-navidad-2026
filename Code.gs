/**
 * Retos navideños de código: backend en Google Apps Script.
 *
 * Esta hoja de cálculo es el "excel" de la competición:
 *   Retos           los 24 retos (enunciado, entrada y solución) y, por cada día, la persona sospechosa y el
 *                   trozo de historia que se desbloquea al acertar. Solo lo ve quien tenga acceso a la hoja.
 *   Envios          cada intento: fecha y hora, día, email, alias, respuesta, si es correcto, minutos tardados,
 *                   el código que ha pegado o subido, su huella y un aviso si es igual al de otra persona.
 *   Participantes   email, alias y clave personal de cada persona. Con la clave, cada persona recupera
 *                   su progreso desde cualquier dispositivo. La clave no se enseña a nadie más.
 *
 * La web (index.html en GitHub Pages) nunca recibe las soluciones: manda la respuesta aquí y este
 * script dice si está bien.
 */

const CONFIG = {
  ANIO: 2026,
  MES: 12,                 // diciembre
  HORA_APERTURA: 0,        // a qué hora (hora de Madrid) se abre cada reto: 0 = medianoche
  HORAS_ABIERTO: 24,       // cuánto tiempo está abierto: a las 24 h se cierra, justo cuando se abre el siguiente
  PISTA_PUBLICA_AL_CERRAR: false, // true = al cerrarse un reto, su pista se publica para todo el mundo
  URL_WEB: 'https://sirviendocodigo.github.io/retos-navidad-2026/', // dirección de la web, para el enlace de recuperar progreso
  REMITENTE: 'Retos de Navidad', // nombre que aparece en el correo de recuperar progreso
  ACUSACIONES_HASTA: '2026-12-25T00:00:00+01:00', // hasta cuándo se puede acusar (o cambiar la acusación)
  ESPERA_FALLO_SEG: 60,    // segundos de espera tras una respuesta incorrecta
  TOP_RANKING: 100,
  PUNTOS_ACIERTO: 10,      // puntos por cada reto acertado (se suman al momento)
  PUNTOS_CLEAN_CODE: 1,    // punto extra si el equipo marca el código como clean code
  HORAS_HASTA_NOTAS: 24,   // la revisión se publica estas horas después del cierre del reto
  MAX_CODIGO: 40000,       // caracteres máximos del código (una celda admite 50.000)
  MARCAS: ['Next Digital', 'Lean Mind', 'sirviendo código;'] // se alternan día a día
};

const HOJA_RETOS = 'Retos';
const HOJA_ENVIOS = 'Envios';
const HOJA_PART = 'Participantes';
const HOJA_ACUS = 'Acusaciones';

/* ---------- Puntos de entrada de la aplicación web ---------- */

function doGet(e) {
  const accion = (e && e.parameter && e.parameter.accion) || 'retos';
  if (accion === 'retos') return json(retosAbiertos());
  if (accion === 'ranking') return json(ranking());
  if (accion === 'progreso') return json(progreso(e.parameter.clave));
  return json({ error: 'Acción desconocida' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Petición no válida' });
  }
  if (body.accion === 'enviar') return json(enviar(body));
  if (body.accion === 'recuperar') return json(recuperar(body.email));
  if (body.accion === 'acusar') return json(acusar(body));
  return json({ ok: false, error: 'Acción desconocida' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Retos ---------- */

// En diciembre Madrid siempre está en UTC+01:00, así que el desfase es fijo.
function aperturaDia(dia) {
  const s = Utilities.formatString('%d-%02d-%02dT%02d:00:00+01:00', CONFIG.ANIO, CONFIG.MES, dia, CONFIG.HORA_APERTURA);
  return new Date(s);
}

function leerRetos() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_RETOS);
  const filas = hoja.getDataRange().getValues().slice(1);
  return filas
    .filter(f => f[0] !== '')
    .map(f => ({
      dia: Number(f[0]),
      marca: String(f[1]),
      titulo: String(f[2]).trim(),
      enunciado: String(f[3]),
      entrada: String(f[4]),
      solucion: String(f[5]),
      persona: String(f[6] || ''),
      cargo: String(f[7] || ''),
      foto: String(f[8] || ''),
      historia: String(f[9] || '')
    }));
}

function cierreDia(dia) {
  return new Date(aperturaDia(dia).getTime() + CONFIG.HORAS_ABIERTO * 3600 * 1000);
}

// El reto del día N se cierra a las 00:00 del día N+1, se revisa durante el día N+1
// y su revisión se publica a las 00:00 del día N+2, junto con el reto nuevo.
function publicacionNotas(dia) {
  return new Date(cierreDia(dia).getTime() + CONFIG.HORAS_HASTA_NOTAS * 3600 * 1000);
}

// Cada reto tiene tres estados: pendiente (aún no ha llegado su hora), abierto (sus 24 horas)
// y cerrado (ya no se puede ver ni enviar). Todo se calcula con la hora, sin hacer nada a mano.
function retosAbiertos() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('retos');
  if (enCache) return JSON.parse(enCache);

  const ahora = new Date();
  const retos = leerRetos().map(r => {
    const apertura = aperturaDia(r.dia);
    const cierre = cierreDia(r.dia);
    let estado = 'pendiente';
    if (r.titulo !== '' && ahora >= apertura) estado = ahora < cierre ? 'abierto' : 'cerrado';
    // La marca de cada reto no se publica: en la web los retos son de las tres
    const base = { dia: r.dia, apertura: apertura.toISOString(), cierre: cierre.toISOString(), estado: estado, abierto: estado === 'abierto' };
    if (estado === 'abierto') return Object.assign(base, { titulo: r.titulo, enunciado: r.enunciado, entrada: r.entrada });
    if (estado === 'cerrado') {
      base.titulo = r.titulo;
      if (CONFIG.PISTA_PUBLICA_AL_CERRAR) base.revelacion = revelacion(r);
    }
    return base;
  });
  const res = { ahora: ahora.toISOString(), retos: retos };
  cache.put('retos', JSON.stringify(res), 30);
  return res;
}

/* ---------- Envíos ---------- */

// Sin distinguir mayúsculas, tildes ni espacios de más: "Ana León" = "ana leon"
function normalizar(txt) {
  return String(txt).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function enviar(b) {
  const dia = Number(b.dia);
  const clave = String(b.clave || '').trim();
  let alias = String(b.alias || '').trim();
  let email = String(b.email || '').trim().toLowerCase();
  const respuesta = String(b.respuesta || '').trim();
  const codigo = String(b.codigo || '');
  const ejecucion = String(b.ejecucion || '').trim();

  if (!clave) {
    if (!b.consentimiento) return { ok: false, error: 'Tienes que aceptar la política de privacidad.' };
    if (alias.length < 2 || alias.length > 30) return { ok: false, error: 'El alias debe tener entre 2 y 30 caracteres.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'El email no parece válido.' };
  }
  if (!respuesta || respuesta.length > 500) return { ok: false, error: 'Escribe una respuesta.' };
  if (codigo.trim().length < 10) return { ok: false, error: 'Pega tu código o sube el archivo con tu solución.' };
  if (ejecucion.length < 3 || ejecucion.length > 300) return { ok: false, error: 'Explica cómo se ejecuta tu código (por ejemplo: python3 solucion.py entrada.txt).' };
  if (codigo.length > CONFIG.MAX_CODIGO) return { ok: false, error: 'Tu código es demasiado largo (máximo ' + CONFIG.MAX_CODIGO + ' caracteres).' };

  const reto = leerRetos().find(r => r.dia === dia);
  if (!reto || reto.titulo === '') return { ok: false, error: 'Ese reto no existe.' };
  const apertura = aperturaDia(dia);
  const ahora = new Date();
  if (ahora < apertura) return { ok: false, error: 'Este reto todavía no está abierto.' };
  if (ahora >= cierreDia(dia)) return { ok: false, error: 'Este reto ya está cerrado. Cada reto solo se puede enviar durante sus 24 horas.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();

    // Participantes: un email, un alias y una clave personal.
    // Con clave se identifica a la persona; sin clave solo se puede dar de alta un email nuevo.
    const hojaPart = ss.getSheetByName(HOJA_PART);
    const part = hojaPart.getDataRange().getValues().slice(1);
    let claveFinal = clave;
    if (clave) {
      const yo = part.find(p => String(p[3]) === clave);
      if (!yo) return { ok: false, codigo: 'clave', error: 'No encontramos tu participación. Recupera tu progreso con tu email.' };
      email = String(yo[0]).toLowerCase();
      alias = String(yo[1]);
    } else {
      if (part.some(p => String(p[0]).toLowerCase() === email)) {
        return { ok: false, codigo: 'registrado', error: 'Este email ya participa. Recupera tu progreso y te mandamos un enlace a tu correo.' };
      }
      if (part.some(p => normalizar(p[1]) === normalizar(alias))) return { ok: false, error: 'Ese alias ya lo está usando otra persona. Prueba con otro.' };
      claveFinal = Utilities.getUuid().replace(/-/g, '');
      hojaPart.appendRow([email, alias, ahora, claveFinal, '']);
    }
    const aliasFinal = alias;

    // Envíos previos de esta persona para este día
    const hojaEnv = ss.getSheetByName(HOJA_ENVIOS);
    const todosDia = hojaEnv.getDataRange().getValues().slice(1).filter(f => Number(f[1]) === dia);
    const envios = todosDia.filter(f => String(f[2]).toLowerCase() === email);

    if (envios.some(f => f[5] === true)) {
      return { ok: true, correcto: true, yaResuelto: true, alias: aliasFinal, clave: claveFinal, revelacion: revelacion(reto) };
    }
    const ultimoFallo = envios.filter(f => f[5] === false).map(f => new Date(f[0]).getTime()).sort().pop();
    if (ultimoFallo) {
      const faltan = Math.ceil((ultimoFallo + CONFIG.ESPERA_FALLO_SEG * 1000 - ahora.getTime()) / 1000);
      if (faltan > 0) return { ok: false, error: 'Espera ' + faltan + ' segundos antes de volver a intentarlo.' };
    }

    const correcto = normalizar(respuesta) === normalizar(reto.solucion);
    const minutos = Math.round((ahora.getTime() - apertura.getTime()) / 60000);
    const huella = huellaCodigo(codigo);
    const iguales = todosDia
      .filter(f => String(f[2]).toLowerCase() !== email && f[8] === huella)
      .map(f => String(f[3]));
    const aviso = iguales.length ? 'Igual que: ' + Array.from(new Set(iguales)).join(', ') : '';
    // Un apóstrofo delante evita que Sheets interprete el código como fórmula
    hojaEnv.appendRow([ahora, dia, email, aliasFinal, respuesta, correcto, minutos, "'" + codigo, huella, aviso, "'" + ejecucion, '', '']);
    if (correcto) CacheService.getScriptCache().remove('ranking');

    const res = { ok: true, correcto: correcto, alias: aliasFinal, clave: claveFinal };
    if (correcto) res.revelacion = revelacion(reto);
    return res;
  } finally {
    lock.releaseLock();
  }
}

// Lo que se desbloquea al acertar: la persona sospechosa del día y su trozo de historia.
// Nunca se envía antes de acertar.
function revelacion(reto) {
  return { dia: reto.dia, persona: reto.persona, cargo: reto.cargo, foto: reto.foto, historia: reto.historia };
}

// Huella del código: se quitan espacios, tabuladores y saltos de línea y se pasa a minúsculas.
// Dos códigos con la misma huella son el mismo código aunque cambie el formato.
function huellaCodigo(codigo) {
  const limpio = String(codigo).replace(/\s+/g, '').toLowerCase();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, limpio, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('').slice(0, 12);
}

/* ---------- Progreso de cada persona ---------- */

// Devuelve los retos que ha resuelto una persona y los expedientes que ha conseguido.
// Solo con su clave: sin ella no se puede consultar el progreso de nadie.
function progreso(clave) {
  clave = String(clave || '').trim();
  if (!clave) return { ok: false, error: 'Falta la clave.' };
  const ss = SpreadsheetApp.getActive();
  const yo = ss.getSheetByName(HOJA_PART).getDataRange().getValues().slice(1).find(p => String(p[3]) === clave);
  if (!yo) return { ok: false, codigo: 'clave', error: 'Esta clave no es válida.' };
  const email = String(yo[0]).toLowerCase();
  const dias = {};
  const notas = {};
  let puntos = 0;
  const ahora = new Date();
  ss.getSheetByName(HOJA_ENVIOS).getDataRange().getValues().slice(1)
    .filter(f => f[5] === true && String(f[2]).toLowerCase() === email)
    .forEach(f => {
      const d = Number(f[1]);
      if (dias[d]) return;
      dias[d] = true;
      const rev = revisionDe(f, d, ahora);
      puntos += puntosDe(rev);
      // La revisión solo se enseña cuando ya está publicada
      if (rev.revisado) notas[d] = { funciona: !rev.noFunciona, cleanCode: rev.cleanCode };
    });
  const retos = leerRetos();
  const revelaciones = {};
  Object.keys(dias).forEach(d => {
    const r = retos.find(x => x.dia === Number(d));
    if (r) revelaciones[d] = revelacion(r);
  });
  return { ok: true, alias: String(yo[1]), resueltos: Object.keys(dias).map(Number).sort((a, b) => a - b), revelaciones: revelaciones, notas: notas, puntos: puntos, acusacion: acusacionDe(email) };
}

// Manda al correo de la persona un enlace con su clave. La respuesta es siempre la misma,
// exista o no el email, para que nadie pueda averiguar quién participa.
function recuperar(email) {
  email = String(email || '').trim().toLowerCase();
  const generico = { ok: true, mensaje: 'Si ese email participa, te hemos enviado un enlace para recuperar tu progreso. Revisa también la carpeta de spam.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'El email no parece válido.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PART);
    const filas = hoja.getDataRange().getValues();
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).toLowerCase() !== email) continue;
      const ultimo = filas[i][4] ? new Date(filas[i][4]).getTime() : 0;
      if (Date.now() - ultimo < 10 * 60 * 1000) return generico; // como mucho un correo cada 10 minutos
      const enlace = CONFIG.URL_WEB + '?clave=' + encodeURIComponent(filas[i][3]);
      MailApp.sendEmail({
        to: email,
        name: CONFIG.REMITENTE,
        subject: 'Tu enlace para seguir con los retos de Navidad',
        body: 'Hola, ' + filas[i][1] + '.\n\nAbre este enlace para recuperar tus retos y tu expediente en este dispositivo:\n\n' + enlace +
              '\n\nGuárdalo y no lo compartas: con él se puede enviar respuestas en tu nombre.\n\nSi no lo has pedido tú, ignora este correo.'
      });
      hoja.getRange(i + 1, 5).setValue(new Date());
      return generico;
    }
    return generico;
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Acusaciones ---------- */

// Cada persona puede acusar a una de las sospechosas que ha descubierto (retos que ha acertado).
// Puede cambiar de opinión hasta ACUSACIONES_HASTA; cuenta la última.
function acusar(b) {
  const clave = String(b.clave || '').trim();
  const dia = Number(b.dia);
  if (new Date() >= new Date(CONFIG.ACUSACIONES_HASTA)) return { ok: false, error: 'Las acusaciones ya están cerradas.' };
  if (!clave) return { ok: false, error: 'Resuelve al menos un reto para poder acusar.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const yo = ss.getSheetByName(HOJA_PART).getDataRange().getValues().slice(1).find(p => String(p[3]) === clave);
    if (!yo) return { ok: false, codigo: 'clave', error: 'No encontramos tu participación.' };
    const email = String(yo[0]).toLowerCase();
    const descubierta = ss.getSheetByName(HOJA_ENVIOS).getDataRange().getValues().slice(1)
      .some(f => f[5] === true && String(f[2]).toLowerCase() === email && Number(f[1]) === dia);
    if (!descubierta) return { ok: false, error: 'Solo puedes acusar a personas sospechosas que hayas descubierto.' };
    const reto = leerRetos().find(r => r.dia === dia);
    const hoja = ss.getSheetByName(HOJA_ACUS);
    const filas = hoja.getDataRange().getValues();
    const fila = [email, String(yo[1]), dia, reto.persona, new Date()];
    for (let i = 1; i < filas.length; i++) {
      if (String(filas[i][0]).toLowerCase() === email) {
        hoja.getRange(i + 1, 1, 1, 5).setValues([fila]);
        return { ok: true, acusacion: { dia: dia, persona: reto.persona } };
      }
    }
    hoja.appendRow(fila);
    return { ok: true, acusacion: { dia: dia, persona: reto.persona } };
  } finally {
    lock.releaseLock();
  }
}

function acusacionDe(email) {
  const fila = SpreadsheetApp.getActive().getSheetByName(HOJA_ACUS).getDataRange().getValues().slice(1)
    .find(f => String(f[0]).toLowerCase() === email);
  return fila ? { dia: Number(fila[2]), persona: String(fila[3]) } : null;
}

/* ---------- Ranking ---------- */

// Puntuación de cada reto (se calcula con la primera respuesta correcta de cada persona y día):
//   - Acertar suma PUNTOS_ACIERTO (10) al momento.
//   - Si la revisión dice que el código NO funciona: 0 puntos y no cuenta como resuelto.
//   - Si la revisión marca clean code: PUNTOS_CLEAN_CODE (+1) más.
// Nada de la revisión cuenta hasta que se publica (24 horas después del cierre, a las 00:00).
// Gana quien más puntos tiene. Si hay empate, quien menos tiempo ha tardado en total
// (minutos desde que se abrió cada reto hasta su primera respuesta correcta).
function revisionDe(f, dia, ahora) {
  const funciona = normalizar(f[11] || '');
  const clean = normalizar(f[12] || '');
  const publicada = ahora >= publicacionNotas(dia);
  return {
    noFunciona: publicada && funciona === 'no',
    cleanCode: publicada && funciona !== 'no' && clean === 'si',
    revisado: publicada && (funciona === 'si' || funciona === 'no' || clean === 'si')
  };
}

function puntosDe(rev) {
  if (rev.noFunciona) return 0;
  return CONFIG.PUNTOS_ACIERTO + (rev.cleanCode ? CONFIG.PUNTOS_CLEAN_CODE : 0);
}

function ranking() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('ranking');
  if (enCache) return JSON.parse(enCache);

  const ahora = new Date();
  const filas = SpreadsheetApp.getActive().getSheetByName(HOJA_ENVIOS).getDataRange().getValues().slice(1);
  const personas = {};
  filas.filter(f => f[5] === true).forEach(f => {
    const email = String(f[2]).toLowerCase();
    const dia = Number(f[1]);
    const p = personas[email] || (personas[email] = { alias: String(f[3]), dias: {}, minutos: 0, puntos: 0, clean: 0 });
    if (p.dias[dia] !== undefined) return;
    const rev = revisionDe(f, dia, ahora);
    if (rev.noFunciona) { p.dias[dia] = null; return; }
    p.dias[dia] = Number(f[6]);
    p.minutos += Number(f[6]);
    p.puntos += puntosDe(rev);
    if (rev.cleanCode) p.clean++;
  });

  const lista = Object.keys(personas).map(k => {
    const p = personas[k];
    const dias = Object.keys(p.dias).filter(d => p.dias[d] !== null).map(Number).sort((a, b) => a - b);
    return { alias: p.alias, puntos: p.puntos, resueltos: dias.length, cleanCode: p.clean, minutos: p.minutos, dias: dias };
  }).filter(p => p.resueltos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.minutos - b.minutos)
    .slice(0, CONFIG.TOP_RANKING);

  const res = { actualizado: ahora.toISOString(), ranking: lista };
  cache.put('ranking', JSON.stringify(res), 60);
  return res;
}

/* ---------- Preparación (ejecutar una sola vez) ---------- */

function prepararHoja() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Europe/Madrid');

  const crear = (nombre, cabecera) => {
    let h = ss.getSheetByName(nombre);
    if (!h) h = ss.insertSheet(nombre);
    if (h.getLastRow() === 0) {
      h.appendRow(cabecera);
      h.getRange(1, 1, 1, cabecera.length).setFontWeight('bold');
      h.setFrozenRows(1);
    }
    return h;
  };

  const retos = crear(HOJA_RETOS, ['Día', 'Marca', 'Título', 'Enunciado', 'Entrada', 'Solución', 'Persona', 'Cargo', 'Foto (URL)', 'Historia que se desbloquea']);
  if (retos.getLastRow() === 1) {
    const filas = [];
    for (let d = 1; d <= 24; d++) filas.push([d, CONFIG.MARCAS[(d - 1) % CONFIG.MARCAS.length], '', '', '', '', '', '', '', '']);
    retos.getRange(2, 1, 24, 10).setValues(filas);
    retos.getRange('D:E').setWrap(true);
    retos.getRange('J:J').setWrap(true);
    retos.setColumnWidth(10, 420);
    retos.setColumnWidth(4, 420);
    retos.setColumnWidth(5, 300);
  }

  const env = crear(HOJA_ENVIOS, ['Fecha y hora', 'Día', 'Email', 'Alias', 'Respuesta', 'Correcto', 'Minutos desde apertura', 'Código', 'Huella', 'Posible copia',
    'Cómo se ejecuta', 'Revisión: funciona (SÍ/NO)', 'Revisión: +1 clean code (SÍ/NO)']);
  try {
    // Desplegables para que la revisión no tenga erratas
    env.getRange('L2:L').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÍ', 'NO'], true).build());
    env.getRange('M2:M').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÍ', 'NO'], true).build());
  } catch (err) { /* si falla, se puede escribir a mano */ }
  env.getRange('A:A').setNumberFormat('dd/mm/yyyy HH:mm:ss');
  env.getRange('H:H').setWrap(false).setFontFamily('Courier New');
  env.setColumnWidth(8, 320);

  crear(HOJA_PART, ['Email', 'Alias', 'Fecha de alta', 'Clave', 'Último correo de recuperación']);
  crear(HOJA_ACUS, ['Email', 'Alias', 'Acusa al expediente nº', 'Persona acusada', 'Fecha']);

  const hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hoja1 && ss.getSheets().length > 1 && hoja1.getLastRow() === 0) ss.deleteSheet(hoja1);
}

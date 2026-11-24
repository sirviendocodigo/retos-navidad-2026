/**
 * Retos navideños de código: backend en Google Apps Script.
 *
 * Esta hoja de cálculo es el "excel" de la competición:
 *   Retos           los 24 retos (enunciado, entrada y solución) y, por cada día, la persona sospechosa y el
 *                   trozo de historia que se desbloquea al acertar. Solo lo ve quien tenga acceso a la hoja.
 *   Envios          cada intento: fecha y hora, día, email, alias, respuesta, si es correcto, minutos tardados,
 *                   el código que ha pegado o subido, su huella y un aviso si es igual al de otra persona.
 *   Participantes   email y alias de cada persona inscrita.
 *
 * La web (index.html en GitHub Pages) nunca recibe las soluciones: manda la respuesta aquí y este
 * script dice si está bien.
 */

const CONFIG = {
  ANIO: 2026,
  MES: 12,                 // diciembre
  HORA_APERTURA: 10,       // a qué hora (hora de Madrid) se abre cada reto
  ESPERA_FALLO_SEG: 60,    // segundos de espera tras una respuesta incorrecta
  TOP_RANKING: 100,
  MAX_CODIGO: 40000,       // caracteres máximos del código (una celda admite 50.000)
  MARCAS: ['Next Digital', 'Lean Mind', 'sirviendo código;'] // se alternan día a día
};

const HOJA_RETOS = 'Retos';
const HOJA_ENVIOS = 'Envios';
const HOJA_PART = 'Participantes';

/* ---------- Puntos de entrada de la aplicación web ---------- */

function doGet(e) {
  const accion = (e && e.parameter && e.parameter.accion) || 'retos';
  if (accion === 'retos') return json(retosAbiertos());
  if (accion === 'ranking') return json(ranking());
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

function retosAbiertos() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('retos');
  if (enCache) return JSON.parse(enCache);

  const ahora = new Date();
  const retos = leerRetos().map(r => {
    const apertura = aperturaDia(r.dia);
    const abierto = ahora >= apertura && r.titulo !== '';
    const base = { dia: r.dia, marca: r.marca, apertura: apertura.toISOString(), abierto: abierto };
    if (!abierto) return base;
    return Object.assign(base, { titulo: r.titulo, enunciado: r.enunciado, entrada: r.entrada });
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
  const alias = String(b.alias || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const respuesta = String(b.respuesta || '').trim();
  const codigo = String(b.codigo || '');

  if (!b.consentimiento) return { ok: false, error: 'Tienes que aceptar la política de privacidad.' };
  if (alias.length < 2 || alias.length > 30) return { ok: false, error: 'El alias debe tener entre 2 y 30 caracteres.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'El email no parece válido.' };
  if (!respuesta || respuesta.length > 500) return { ok: false, error: 'Escribe una respuesta.' };
  if (codigo.trim().length < 10) return { ok: false, error: 'Pega tu código o sube el archivo con tu solución.' };
  if (codigo.length > CONFIG.MAX_CODIGO) return { ok: false, error: 'Tu código es demasiado largo (máximo ' + CONFIG.MAX_CODIGO + ' caracteres).' };

  const reto = leerRetos().find(r => r.dia === dia);
  if (!reto || reto.titulo === '') return { ok: false, error: 'Ese reto no existe.' };
  const apertura = aperturaDia(dia);
  const ahora = new Date();
  if (ahora < apertura) return { ok: false, error: 'Este reto todavía no está abierto.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();

    // Participantes: un email, un alias
    const hojaPart = ss.getSheetByName(HOJA_PART);
    const part = hojaPart.getDataRange().getValues().slice(1);
    const porEmail = part.find(p => String(p[0]).toLowerCase() === email);
    const porAlias = part.find(p => normalizar(p[1]) === normalizar(alias));
    let aliasFinal = alias;
    if (porEmail) {
      aliasFinal = String(porEmail[1]);
    } else {
      if (porAlias) return { ok: false, error: 'Ese alias ya lo está usando otra persona. Prueba con otro.' };
      hojaPart.appendRow([email, alias, ahora]);
    }

    // Envíos previos de esta persona para este día
    const hojaEnv = ss.getSheetByName(HOJA_ENVIOS);
    const todosDia = hojaEnv.getDataRange().getValues().slice(1).filter(f => Number(f[1]) === dia);
    const envios = todosDia.filter(f => String(f[2]).toLowerCase() === email);

    if (envios.some(f => f[5] === true)) {
      return { ok: true, correcto: true, yaResuelto: true, alias: aliasFinal, revelacion: revelacion(reto) };
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
    hojaEnv.appendRow([ahora, dia, email, aliasFinal, respuesta, correcto, minutos, "'" + codigo, huella, aviso]);
    if (correcto) CacheService.getScriptCache().remove('ranking');

    const res = { ok: true, correcto: correcto, alias: aliasFinal };
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

/* ---------- Ranking ---------- */

// Gana quien más retos resuelve. Si hay empate, quien haya tardado menos en total
// (minutos desde que se abrió cada reto hasta su primera respuesta correcta).
function ranking() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('ranking');
  if (enCache) return JSON.parse(enCache);

  const filas = SpreadsheetApp.getActive().getSheetByName(HOJA_ENVIOS).getDataRange().getValues().slice(1);
  const personas = {};
  filas.filter(f => f[5] === true).forEach(f => {
    const email = String(f[2]).toLowerCase();
    const dia = Number(f[1]);
    const p = personas[email] || (personas[email] = { alias: String(f[3]), dias: {}, minutos: 0 });
    if (p.dias[dia] === undefined) {
      p.dias[dia] = Number(f[6]);
      p.minutos += Number(f[6]);
    }
  });

  const lista = Object.keys(personas).map(k => {
    const p = personas[k];
    const dias = Object.keys(p.dias).map(Number).sort((a, b) => a - b);
    return { alias: p.alias, resueltos: dias.length, minutos: p.minutos, dias: dias };
  }).sort((a, b) => b.resueltos - a.resueltos || a.minutos - b.minutos)
    .slice(0, CONFIG.TOP_RANKING);

  const res = { actualizado: new Date().toISOString(), ranking: lista };
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

  const env = crear(HOJA_ENVIOS, ['Fecha y hora', 'Día', 'Email', 'Alias', 'Respuesta', 'Correcto', 'Minutos desde apertura', 'Código', 'Huella', 'Posible copia']);
  env.getRange('A:A').setNumberFormat('dd/mm/yyyy HH:mm:ss');
  env.getRange('H:H').setWrap(false).setFontFamily('Courier New');
  env.setColumnWidth(8, 320);

  crear(HOJA_PART, ['Email', 'Alias', 'Fecha de alta']);

  const hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hoja1 && ss.getSheets().length > 1 && hoja1.getLastRow() === 0) ss.deleteSheet(hoja1);
}

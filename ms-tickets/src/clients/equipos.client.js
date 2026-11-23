// =====================================================================
// CLIENTE HTTP de ms-equipos, para el microservicio de tickets.
// Copiado de para-el-consumidor/ del proveedor y completado.
// En el .env de ms-tickets:  EQUIPOS_URL=http://127.0.0.1:3012
// =====================================================================
const HttpError = require('../utils/http-error');
const EQUIPOS_URL = process.env.EQUIPOS_URL;

// Hace una petición GET a ms-equipos reenviando el token del usuario.
// Devuelve la respuesta de fetch, o null si ms-equipos no respondió.
async function pedir(ruta, token) {
  try {
    return await fetch(`${EQUIPOS_URL}${ruta}`, {
      headers: { Authorization: token },     // el token de la petición original
      signal: AbortSignal.timeout(3000),      // no esperar más de 3 segundos
    });
  } catch (error) {
    return null;                              // ms-equipos caído o sin responder
  }
}

// VALIDACIÓN: 400 si el equipo no existe · 503 si ms-equipos no responde
async function obtenerEquipo(id, token) {
  const respuesta = await pedir(`/equipos/${id}`, token);
  if (!respuesta) {
    throw new HttpError(503, 'ms-equipos no responde: no se puede validar el equipo');
  }
  if (respuesta.status === 404) {
    throw new HttpError(400, `No existe el equipo con id ${id}`);
  }
  if (!respuesta.ok) {
    throw new HttpError(503, `ms-equipos respondió ${respuesta.status} al validar el equipo`);
  }
  return respuesta.json();
}

// Solo los campos que ms-tickets muestra del equipo (objeto de la ficha)
function resumir(equipo) {
  return { id: equipo.id, serial: equipo.serial, descripcion: equipo.descripcion };
}

// COMPOSICIÓN de un ticket: { id, serial, descripcion } o null si no se pudo
async function buscarEquipo(id, token) {
  const respuesta = await pedir(`/equipos/${id}`, token);
  if (!respuesta || !respuesta.ok) return null;
  return resumir(await respuesta.json());
}

// COMPOSICIÓN del listado: UNA sola petición /equipos?ids=1,2,4
async function buscarEquipos(ids, token) {
  if (ids.length === 0) return new Map();
  const respuesta = await pedir(`/equipos?ids=${ids.join(',')}`, token);
  if (!respuesta || !respuesta.ok) return null;
  const equipos = await respuesta.json();
  return new Map(equipos.map((e) => [e.id, resumir(e)]));
}

module.exports = { pedir, obtenerEquipo, buscarEquipo, buscarEquipos };
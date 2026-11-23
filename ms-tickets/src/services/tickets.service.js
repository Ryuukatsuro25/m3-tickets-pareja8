// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// La relación con ms-equipos pasa por src/clients/equipos.client.js
// =====================================================================
const repo = require('../repositories/tickets.repository');
const equiposClient = require('../clients/equipos.client');
const { PRIORIDADES, validarTicket, construirTicket } = require('../models/ticket');
const HttpError = require('../utils/http-error');

const AVISO = 'ms-equipos no respondió: no se pudo obtener el equipo';

// GET /tickets  (filtros: ?prioridad= y ?ids=)
// Composición: UNA sola petición ?ids= a ms-equipos para todo el listado
async function listar(filtros, token) {
  if (filtros.prioridad !== undefined && !PRIORIDADES.includes(filtros.prioridad)) {
    throw new HttpError(400, `prioridad debe ser una de: ${PRIORIDADES.join(', ')}`);
  }
  const tickets = await repo.findAll(filtros);
  const ids = [...new Set(tickets.map((t) => t.equipo_id))];       // sin repetidos
  const equipos = await equiposClient.buscarEquipos(ids, token);   // Map o null
  return tickets.map((t) => {
    if (!equipos) return { ...t, equipo: null, aviso: AVISO };     // ms-equipos caído
    return { ...t, equipo: equipos.get(t.equipo_id) || null };
  });
}

async function obtener(id) {
  const ticket = await repo.findById(id);
  if (!ticket) throw new HttpError(404, `No existe el ticket con id ${id}`);
  return ticket;
}

// GET /tickets/:id con el objeto equipo
async function obtenerCompuesto(id, token) {
  const ticket = await obtener(id);
  return componer(ticket, token);
}

async function componer(ticket, token) {
  const equipo = await equiposClient.buscarEquipo(ticket.equipo_id, token);
  if (!equipo) return { ...ticket, equipo: null, aviso: AVISO };
  return { ...ticket, equipo };
}

// Regla de negocio: no puede haber dos tickets con el mismo número (409).
// idActual permite que al actualizar un ticket conserve su propio número.
async function verificarNumeroUnico(numero, idActual = null) {
  const existente = await repo.findByNumero(numero);
  if (existente && existente.id !== idActual) {
    throw new HttpError(409, `Ya existe un ticket con el número ${numero}`);
  }
}

// Validación de la relación con ms-equipos (400 no existe · 503 no responde)
// y regla de la ficha: equipo con estado_equipo = de_baja → 409
async function verificarEquipo(equipoId, token) {
  const equipo = await equiposClient.obtenerEquipo(equipoId, token);
  if (equipo.estado_equipo === 'de_baja') {
    throw new HttpError(409, `El equipo ${equipoId} está de baja: no se le pueden abrir tickets`);
  }
  return equipo;
}

async function crear(datos, token) {
  const errores = validarTicket(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const ticket = construirTicket(datos);
  await verificarEquipo(ticket.equipo_id, token);
  await verificarNumeroUnico(ticket.numero);
  const nuevo = await repo.create(ticket);
  return componer(nuevo, token);
}

// PUT reemplaza el registro completo: se valida igual que al crear
async function actualizar(id, datos, token) {
  await obtener(id);                                   // 404 si no existe
  const errores = validarTicket(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const ticket = construirTicket(datos);
  await verificarEquipo(ticket.equipo_id, token);
  await verificarNumeroUnico(ticket.numero, id);
  const actualizado = await repo.update(id, ticket);
  return componer(actualizado, token);
}

async function eliminar(id) {
  const borrado = await repo.remove(id);
  if (!borrado) throw new HttpError(404, `No existe el ticket con id ${id}`);
}

module.exports = { listar, obtener, obtenerCompuesto, crear, actualizar, eliminar };
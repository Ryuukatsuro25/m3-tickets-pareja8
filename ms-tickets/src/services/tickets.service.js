// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// =====================================================================
const repo = require('../repositories/tickets.repository');
const { PRIORIDADES, validarTicket, construirTicket } = require('../models/ticket');
const HttpError = require('../utils/http-error');

// GET /tickets  (filtros: ?prioridad= y ?ids=)
async function listar(filtros) {
  if (filtros.prioridad !== undefined && !PRIORIDADES.includes(filtros.prioridad)) {
    throw new HttpError(400, `prioridad debe ser una de: ${PRIORIDADES.join(', ')}`);
  }
  return repo.findAll(filtros);
}

async function obtener(id) {
  const ticket = await repo.findById(id);
  if (!ticket) throw new HttpError(404, `No existe el ticket con id ${id}`);
  return ticket;
}

// Regla de negocio: el número identifica el ticket ante el usuario que lo reporta,
// así que no puede haber dos tickets con el mismo número (409 = Conflict).
// idActual permite que al actualizar un ticket conserve su propio número.
async function verificarNumeroUnico(numero, idActual = null) {
  const existente = await repo.findByNumero(numero);
  if (existente && existente.id !== idActual) {
    throw new HttpError(409, `Ya existe un ticket con el número ${numero}`);
  }
}

async function crear(datos) {
  const errores = validarTicket(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const ticket = construirTicket(datos);
  await verificarNumeroUnico(ticket.numero);
  return repo.create(ticket);
}

// PUT reemplaza el registro completo: se valida igual que al crear
async function actualizar(id, datos) {
  await obtener(id);                                   // 404 si no existe
  const errores = validarTicket(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const ticket = construirTicket(datos);
  await verificarNumeroUnico(ticket.numero, id);
  return repo.update(id, ticket);
}

async function eliminar(id) {
  const borrado = await repo.remove(id);
  if (!borrado) throw new HttpError(404, `No existe el ticket con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };

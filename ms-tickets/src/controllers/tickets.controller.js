// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, query, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/tickets.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /tickets  ·  /tickets?prioridad=alta  ·  /tickets?ids=1,3
async function listar(req, res) {
  const filtros = { prioridad: req.query.prioridad };
  if (req.query.ids !== undefined) {                  // ?ids=1,3,8 → [1, 3, 8]
    filtros.ids = String(req.query.ids).split(',').map(Number);
    if (filtros.ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new HttpError(400, 'ids debe ser una lista de enteros separados por comas');
    }
  }
  const tickets = await service.listar(filtros);
  res.status(200).json(tickets);
}

// GET /tickets/:id
async function obtener(req, res) {
  const ticket = await service.obtener(leerId(req));
  res.status(200).json(ticket);
}

// POST /tickets
async function crear(req, res) {
  const nuevo = await service.crear(req.body, req.headers.authorization);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

// PUT /tickets/:id
async function actualizar(req, res) {
  const ticket = await service.actualizar(leerId(req), req.body, req.headers.authorization);
  res.status(200).json(ticket);
}

// DELETE /tickets/:id
async function eliminar(req, res) {
  await service.eliminar(leerId(req));
  res.status(204).end();                              // 204 No Content: éxito, sin cuerpo
}

module.exports = { listar, obtener, crear, actualizar, eliminar };

// =====================================================================
// CAPA DE MODELO (entidad)
// Define qué campos tiene un Ticket y qué reglas deben cumplir.
// No sabe nada de HTTP ni de bases de datos.
// =====================================================================

// Valores permitidos (los mismos del contrato de la API)
const PRIORIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['abierto', 'cerrado'];

const esTextoNoVacio = (v) => typeof v === 'string' && v.trim() !== '';

// true si el texto es una fecha real con formato AAAA-MM-DD (rechaza 2026-02-30)
function esFechaValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

// Devuelve una lista de errores de validación (vacía si todo está bien).
// Se usa igual al crear (POST) y al actualizar (PUT reemplaza el registro completo).
function validarTicket(datos) {
  const errores = [];
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return ['Se esperaba un objeto JSON con los datos del ticket'];
  }
  if (!esTextoNoVacio(datos.numero) || datos.numero.trim().length > 20) {
    errores.push('numero es obligatorio (texto de máximo 20 caracteres)');
  }
  if (!esTextoNoVacio(datos.asunto) || datos.asunto.trim().length > 150) {
    errores.push('asunto es obligatorio (texto de máximo 150 caracteres)');
  }
  if (!PRIORIDADES.includes(datos.prioridad)) {
    errores.push(`prioridad debe ser una de: ${PRIORIDADES.join(', ')}`);
  }
  if (!ESTADOS.includes(datos.estado)) {
    errores.push(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
  }
  if (!esFechaValida(datos.fecha)) {
    errores.push('fecha es obligatoria y debe ser una fecha válida con formato AAAA-MM-DD');
  }
  if (!Number.isInteger(datos.equipo_id) || datos.equipo_id <= 0){
    errores.push('equipo_id es obligatorio y debe ser un entero positivo');
  }
  return errores;
}

// Construye un ticket "limpio" solo con los campos del contrato
function construirTicket(datos) {
  return {
    numero: datos.numero.trim(),
    asunto: datos.asunto.trim(),
    prioridad: datos.prioridad,
    estado: datos.estado,
    fecha: datos.fecha,
    equipo_id: datos.equipo_id,
  };
}

module.exports = { PRIORIDADES, ESTADOS, validarTicket, construirTicket };

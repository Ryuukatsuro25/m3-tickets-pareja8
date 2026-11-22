// =====================================================================
// Configuración de la aplicación Express.
// Aquí se registran los middlewares, las rutas y el manejo de errores.
// =====================================================================
const express = require('express');
const ticketsRoutes = require('./routes/tickets.routes');

const app = express();

// Middleware: convierte el cuerpo JSON de la petición en un objeto (req.body)
app.use(express.json());

// Registro de cada petición en la terminal: método, ruta y código de respuesta.
// Se escribe en el evento 'finish', es decir, cuando la respuesta ya salió y
// se conoce su código (200, 201, 204, 400, 401, 403, 404, 409...).
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// Endpoint de salud: público, permite verificar que el microservicio está vivo
app.get('/health', (req, res) => {
  res.json({ servicio: 'ms-tickets', estado: 'ok' });
});

// Rutas del recurso. Todas las URIs de este microservicio empiezan por /tickets
app.use('/tickets', ticketsRoutes);

// Cualquier otra ruta: 404 Not Found
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejo centralizado de errores (los lanzan el servicio, el middleware de seguridad o el repositorio)
app.use((err, req, res, next) => {
  // JSON mal formado en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  // Respaldo: si MySQL rechaza un número repetido (índice UNIQUE), también es 409
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un ticket con ese número' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message, detalles: err.detalles });
});

module.exports = app;

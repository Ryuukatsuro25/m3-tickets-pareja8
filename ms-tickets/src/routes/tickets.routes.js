// =====================================================================
// CAPA DE PRESENTACIÓN (rutas)
// Asocia cada método HTTP + URI con una función del controlador y aplica
// los permisos que pide la Evaluación del Módulo 3:
//   todas las rutas exigen token (401 sin token o con token inválido)
//   GET: cualquier rol
//   POST, PUT y DELETE: solo administrador (403 para los demás roles)
// =====================================================================
const { Router } = require('express');
const controller = require('../controllers/tickets.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

router.use(verificarToken);                                            // todas exigen token (401)

router.get('/', controller.listar);                                    // listar, ?prioridad=, ?ids=
router.get('/:id', controller.obtener);                                // obtener por id
router.post('/', requiereRol('administrador'), controller.crear);      // crear (403 otros roles)
router.put('/:id', requiereRol('administrador'), controller.actualizar);
router.delete('/:id', requiereRol('administrador'), controller.eliminar);

module.exports = router;

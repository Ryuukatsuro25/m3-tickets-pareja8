# ms-tickets · Evaluación Módulo 3

Microservicio de **tickets de soporte** (entidad n.º 6 de la Preparación de la Evaluación del Módulo 3).
Redes y Servicios Multimedia · UAO · Jornada nocturna · Pareja 8.
Puerto: **3011** (escucha solo en `127.0.0.1`) · Base de datos propia: `tickets_db` (MySQL 8).

Construido con Node.js + Express en capas: **rutas → controlador → servicio → repositorio**, con el modelo (`models/ticket.js`) y `HttpError` (`utils/http-error.js`), igual que los microservicios del módulo. La seguridad usa el `auth.js` de ms-usuarios sin cambios.

## Cómo ejecutarlo

Requisitos: Node.js 22.9 o superior, MySQL 8 y ms-usuarios corriendo en el puerto 3001.

**1. Crear la base de datos y su usuario** (una sola vez, como `root`):

```sql
CREATE DATABASE tickets_db;
CREATE USER 'tickets_user'@'localhost' IDENTIFIED BY 'una-clave-segura';
GRANT ALL PRIVILEGES ON tickets_db.* TO 'tickets_user'@'localhost';
```

**2. Crear la tabla y los registros iniciales** (desde la carpeta `ms-tickets`):

```
mysql -u tickets_user -p tickets_db
mysql> SOURCE db/schema.sql;
```

**3. Configurar e iniciar el servicio:**

```
npm install
copy .env.example .env      # en Linux: cp .env.example .env
npm run dev
```

| Variable | Ejemplo | Para qué |
|---|---|---|
| PORT | 3011 | Puerto del microservicio |
| HOST | 127.0.0.1 | Solo acepta conexiones del mismo equipo |
| DB_HOST / DB_PORT | localhost / 3306 | Dónde está MySQL (en servidor2: la IP de servidor1) |
| DB_NAME / DB_USER / DB_PASSWORD | tickets_db / tickets_user / … | Base y usuario propios |
| JWT_SECRET | (frase secreta) | La **misma** de ms-usuarios; con ella se verifican los tokens |

Verificar: `http://localhost:3011/health` responde `{"servicio":"ms-tickets","estado":"ok"}`.

## Representación

Así responde `GET /tickets/1`:

```json
{ "id": 1, "numero": "TCK-001", "asunto": "La impresora del segundo piso no imprime", "prioridad": "media", "estado": "abierto", "fecha": "2026-11-10" }
```

| Atributo | Tipo | ¿Obligatorio al crear? | Reglas |
|---|---|---|---|
| id | entero | No: lo asigna MySQL | Positivo y único |
| numero | texto | Sí | No vacío, máximo 20 caracteres, **único (409)** |
| asunto | texto | Sí | No vacío, máximo 150 caracteres |
| prioridad | texto | Sí | `baja`, `media` o `alta` |
| estado | texto | Sí | `abierto` o `cerrado` |
| fecha | fecha | Sí | Formato `AAAA-MM-DD` y fecha real |

**Regla de negocio:** no puede haber dos tickets con el mismo `numero` → **409 Conflict** (al crear y al actualizar; un ticket puede conservar su propio número al actualizarse).

## Endpoints

Todas las rutas de `/tickets` exigen la cabecera `Authorization: Bearer <token>` (token de ms-usuarios). `/health` es la única ruta pública.

| Operación | Método | URI | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| Listar | GET | /tickets | — | 200 + arreglo | 401 |
| Filtrar | GET | /tickets?prioridad=alta | — | 200 + arreglo filtrado | 400 prioridad inválida · 401 |
| Consultar por lotes | GET | /tickets?ids=1,3 | — | 200 + arreglo con esos registros | 400 ids inválidos · 401 |
| Obtener | GET | /tickets/:id | — | 200 + objeto | 400 id inválido · 401 · 404 |
| Crear | POST | /tickets | JSON sin id | 201 + objeto + cabecera `Location` | 400 · 401 · 403 · 409 número repetido |
| Actualizar | PUT | /tickets/:id | JSON completo sin id | 200 + objeto actualizado | 400 · 401 · 403 · 404 · 409 |
| Eliminar | DELETE | /tickets/:id | — | 204 sin cuerpo | 400 · 401 · 403 · 404 |

Ejemplo · crear:

```
POST /tickets
Authorization: Bearer <token de administrador>
Content-Type: application/json

{ "numero": "TCK-005", "asunto": "El computador de recepción no enciende", "prioridad": "alta", "estado": "abierto", "fecha": "2026-11-20" }

→ 201 Created · Location: /tickets/5
{ "id": 5, "numero": "TCK-005", "asunto": "El computador de recepción no enciende", "prioridad": "alta", "estado": "abierto", "fecha": "2026-11-20" }
```

Ejemplo · número repetido:

```
POST /tickets   { "numero": "TCK-001", ... }
→ 409 Conflict   { "error": "Ya existe un ticket con el número TCK-001" }
```

Errores: siempre `{"error": "...", "detalles": [...]}` (`detalles` solo en errores de validación).

| Código | Cuándo |
|---|---|
| 200 OK | GET o PUT exitoso |
| 201 Created | POST exitoso (con cabecera `Location`) |
| 204 No Content | DELETE exitoso |
| 400 Bad Request | Datos inválidos, id no numérico, `?prioridad=` o `?ids=` inválidos, JSON mal formado |
| 401 Unauthorized | Sin token, token inventado o vencido |
| 403 Forbidden | Rol distinto de administrador en POST, PUT o DELETE |
| 404 Not Found | El id no existe o la ruta no existe |
| 409 Conflict | `numero` repetido |

## Seguridad

| Operación | Quién |
|---|---|
| GET (listar, filtrar, obtener) | Cualquier rol con token válido |
| POST, PUT, DELETE | Solo `administrador` |

## Registro de peticiones

Cada petición recibida se escribe en la terminal con su método, su ruta y el código de respuesta:

```
2026-11-22T17:18:20.992Z  POST /tickets -> 409
2026-11-22T17:18:21.053Z  DELETE /tickets/6 -> 204
```

En servidor2 se ven con `journalctl -u ms-tickets -f`.

## Relaciones

En esta versión ms-tickets **no guarda referencias** a otra entidad (ningún atributo termina en `_id`). La relación con el microservicio proveedor se construye en el examen.

## Pruebas

Colección de Postman: [`docs/ms-tickets.postman_collection.json`](docs/ms-tickets.postman_collection.json) — "ms-tickets · Evaluación M3", 16 peticiones y 21 pruebas.

1. Importarla en Postman.
2. En la pestaña **Variables** de la colección revisar: `auth` (ms-usuarios, `http://localhost:3001`), `base` (ms-tickets, `http://localhost:3011`), `admin_email`, `admin_password` y `rol_consulta` (un rol que exista en `ROLES` del `.env` de ms-usuarios y que **no** sea administrador).
3. **Run collection** en orden:

| Carpeta | Qué prueba | Códigos |
|---|---|---|
| 0 · Iniciar sesión | Login del administrador, crea el usuario de consulta y lo autentica | 200, 201/409 |
| 1 · CRUD | Listar, obtener, crear, actualizar y eliminar | 200, 201, 204 |
| 2 · Errores | Datos inválidos, id no numérico, id inexistente, número repetido (`TCK-001`), sin token, rol sin permiso | 400, 404, 409, 401, 403 |
| 3 · Filtro | `?prioridad=alta` y GET con el rol de consulta | 200 |

A través del host virtual del examen: `auth` y `base` = `http://<apellidos>.m3examen.com/api`.

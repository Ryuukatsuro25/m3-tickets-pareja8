-- db/schema.sql · ms-tickets · Evaluación Módulo 3
-- Se ejecuta conectado como tickets_user sobre la base tickets_db:
--   mysql -u tickets_user -p tickets_db
--   mysql> SOURCE db/schema.sql;
-- La tabla NO tiene ningún campo de referencia a otra entidad (nada terminado en _id):
-- la relación con el microservicio proveedor se construye en el examen.
USE tickets_db;
SET NAMES utf8mb4;            -- para que las tildes y la ñ se guarden bien

DROP TABLE IF EXISTS tickets;

CREATE TABLE tickets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  numero     VARCHAR(20)  NOT NULL UNIQUE,   -- regla: número único (409)
  asunto     VARCHAR(150) NOT NULL,
  prioridad  VARCHAR(10)  NOT NULL,          -- baja, media o alta
  estado     VARCHAR(10)  NOT NULL,          -- abierto o cerrado
  fecha      DATE         NOT NULL,           -- AAAA-MM-DD
  equipo_id  INT          NOT NULL
);

INSERT INTO tickets (numero, asunto, prioridad, estado, fecha, equipo_id) VALUES
  ('TCK-001', 'La impresora del segundo piso no imprime',   'media', 'abierto', '2026-11-10', 2),
  ('TCK-002', 'No se puede iniciar sesión en el portal',    'alta',  'abierto', '2026-11-15', 1),
  ('TCK-003', 'Solicitud de cambio de mouse',               'baja',  'cerrado', '2026-11-05', 4),
  ('TCK-004', 'Caída del correo institucional',             'alta',  'cerrado', '2026-11-18', 1);

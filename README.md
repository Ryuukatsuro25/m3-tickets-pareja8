# Evaluación Módulo 3 · Pareja 8 (jornada nocturna)

Redes y Servicios Multimedia · Universidad Autónoma de Occidente · Docente: Zeida Solarte.

|Integrante|Usuario de GitHub|
|-|-|
|Juan José Osorio Reyes|[Ryuukatsuro25](https://github.com/Ryuukatsuro25)|
|Hernán David Gutiérrez Alarcón|epsilon598 (https://github.com/epsilon598)|

## Microservicio asignado

|Microservicio|Entidad|Puerto|Base de datos|Regla|Filtro|
|-|-|-|-|-|-|
|[ms-tickets](ms-tickets)|Ticket (n.º 6)|3011|tickets\_db|`numero` único → 409|`?prioridad=`|

El contrato completo está en [ms-tickets/README.md](ms-tickets/README.md) y la colección de Postman en
[ms-tickets/docs](ms-tickets/docs).

## Estructura

```
.
├── README.md
└── ms-tickets/
    ├── README.md            ← contrato de la API
    ├── package.json · package-lock.json
    ├── .env.example         ← el .env NO se sube
    ├── db/schema.sql        ← tabla tickets + 4 registros iniciales
    ├── docs/ms-tickets.postman\_collection.json
    └── src/
        ├── index.js · app.js · db.js
        ├── routes/          ← método + URI → controlador, permisos por rol
        ├── controllers/     ← lee la petición y arma la respuesta
        ├── services/        ← validaciones y regla de negocio (409)
        ├── repositories/    ← consultas SQL parametrizadas
        ├── models/          ← atributos y validación del ticket
        ├── middlewares/     ← auth.js de ms-usuarios (401 / 403)
        └── utils/           ← HttpError
```

Nunca se suben `node\_modules` ni `.env`.


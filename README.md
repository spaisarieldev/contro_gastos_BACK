# Control de Gastos — Backend

API REST con **NestJS + Prisma + PostgreSQL** para control de ganancias Uber y gastos personales (single-user, sin autenticación).

## Requisitos

- Node.js 18+ (probado con 22)
- Docker Desktop (para PostgreSQL)

## Arranque rápido

### 1. Base de datos (Docker)

```bash
docker compose up -d
```

Esto levanta PostgreSQL en el puerto `5434` (evita choque con otros Postgres locales) con:

- usuario: `contro_gastos`
- password: `contro_gastos`
- base: `contro_gastos`

### 2. Variables de entorno

Copiá `.env.example` a `.env` (ya viene configurado para Docker local):

```env
DATABASE_URL="postgresql://contro_gastos:contro_gastos@localhost:5434/contro_gastos?schema=public"
PORT=3000
```

### 3. Instalar dependencias y migrar

```bash
npm install
npx prisma migrate dev --name init
```

`prisma migrate` crea las tablas en Postgres y genera el cliente de Prisma.

### 4. Correr la API

```bash
npm run start:dev
```

La API queda en `http://localhost:3000`.

---

## Qué es cada pieza (guía rápida)

| Pieza | Para qué sirve |
|--------|----------------|
| **NestJS** | Framework del backend: módulos, controllers (rutas HTTP) y services (lógica). |
| **Prisma** | ORM: describís tablas en `prisma/schema.prisma` y generás el cliente TypeScript. |
| **Migraciones** | Historial de cambios de esquema en `prisma/migrations`. |
| **PostgreSQL** | Base de datos real (acá en un contenedor Docker). |
| **DTO + class-validator** | Validan el body/query de cada endpoint antes de llegar al service. |

### Flujo típico de un endpoint

1. El **Controller** recibe la request HTTP.
2. Nest valida el **DTO**.
3. El **Service** usa `PrismaService` para leer/escribir en Postgres.
4. Se responde JSON al frontend.

---

## Endpoints

### Ganancias (`/ganancias`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/ganancias?anio=2026&mes=3` | Planilla del mes (todos los días + montos) |
| PUT | `/ganancias` | Upsert monto de un día `{ "fecha": "2026-03-15", "monto": 45000 }` |
| DELETE | `/ganancias/:fecha` | Borra el registro de ese día |

### Gastos (`/gastos`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/gastos?anio=2026&mes=3` | Lista del mes + auto-genera mensuales si faltan |
| POST | `/gastos` | Alta de gasto |
| PUT | `/gastos/:id` | Edición |
| PATCH | `/gastos/:id/pagado` | Toggle pagado `{ "pagado": true }` |
| DELETE | `/gastos/:id` | Baja (mensuales: desactiva plantilla) |
| POST | `/gastos/generar-mensuales?anio=&mes=` | Forzar generación mensual |

### Resumen (`/resumen`)

Lógica: **ganancias del mes M** vs **gastos del mes M+1**
(lo ganado en septiembre cubre los gastos de octubre).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/resumen/mes?anio=&mes=` | Totales + evolución diaria + falta/sobrante |
| GET | `/resumen/evolucion-mensual?meses=12` | Comparativa mes a mes (ganado vs gastos del siguiente) |

---

## Estructura del proyecto

```
src/
  prisma/          # Conexión global a la DB
  ganancias/       # Módulo Uber / ganancias diarias
  gastos/          # Módulo gastos + auto-generación
  resumen/         # Dashboard / estadísticas
  main.ts          # Bootstrap (CORS + ValidationPipe)
  app.module.ts    # Módulo raíz
prisma/
  schema.prisma    # Modelos
docker-compose.yml # PostgreSQL
```

## Scripts útiles

```bash
npm run start:dev          # API en modo watch
npx prisma studio          # UI visual de la base
docker compose down        # Apagar Postgres
docker compose down -v     # Apagar y borrar datos
```

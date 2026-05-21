# Mapa API y pruebas

## Comandos de validacion local

```powershell
cd backend
npm install
npm run require-check
npm test
npm start
```

Para el servicio de facturacion separado:

```powershell
cd billing-service
npm install
npm run bootstrap-admin -- admin@demo.com Password123!
npm start
```

## Rutas visuales principales

| Ruta | Rol | Uso |
| --- | --- | --- |
| `/login.html` | Publica | Login |
| `/register.html` | Publica | Registro |
| `/labonita-operativo.html` | ADMIN | Panel operativo central |
| `/admin.html` | ADMIN | Admin legado |
| `/admin-peticiones.html` | ADMIN | Peticiones |
| `/admin-facturacion.html` | ADMIN | Facturacion |
| `/admin-controles.html` | ADMIN | Controles |
| `/admin-billing-outbox.html` | ADMIN | Outbox facturacion |
| `/artist-operativo.html` | ARTIST | Portal operativo artista |
| `/artist-peticiones.html` | ARTIST | Peticiones propias |
| `/artist-mensajes.html` | ARTIST | Mensajes |
| `/profile.html` | ARTIST | Perfil |
| `/tutorial-test-plan.html` | Publica/local | Checklist de prueba |

## API operativa artista

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/ops/templates` | Listar plantillas |
| GET | `/api/ops/my/petitions` | Listar mis peticiones |
| POST | `/api/ops/my/petitions` | Crear peticion propia |
| GET | `/api/ops/my/petitions/:id` | Detalle propio |
| PUT | `/api/ops/my/petitions/:id` | Actualizar borrador propio |
| POST | `/api/ops/my/petitions/:id/submit` | Enviar a revision |
| GET | `/api/ops/my/petitions/:id/filled-form.pdf` | Descargar planilla completada |

## API operativa admin

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/ops/summary` | Resumen operativo |
| GET | `/api/admin/ops/petitions` | Listar peticiones |
| POST | `/api/admin/ops/petitions` | Crear peticion desde admin |
| GET | `/api/admin/ops/petitions/:id` | Detalle |
| POST | `/api/admin/ops/petitions/:id/request-info` | Pedir informacion |
| POST | `/api/admin/ops/petitions/:id/reject` | Rechazar |
| PUT | `/api/admin/ops/petitions/:id` | Actualizar |
| POST | `/api/admin/ops/petitions/:id/validate` | Validar |
| POST | `/api/admin/ops/petitions/:id/laboral` | Preparar alta/baja/A1 |
| POST | `/api/admin/ops/petitions/:id/invoices` | Crear factura interna |
| POST | `/api/admin/ops/petitions/:id/contracts` | Crear contrato interno |
| POST | `/api/admin/ops/petitions/:id/expenses` | Agregar gasto |
| POST | `/api/admin/ops/petitions/:id/liquidations` | Crear liquidacion |
| POST | `/api/admin/ops/petitions/:id/close-zero` | Cerrar a cero |
| GET | `/api/admin/ops/export/control-total.csv` | Export Control Total |
| GET | `/api/admin/ops/export/altas-bajas.csv` | Export altas/bajas |
| GET | `/api/admin/ops/export/gastos.csv` | Export gastos |
| GET | `/api/admin/ops/export/liquidaciones.csv` | Export liquidaciones |

## DELSOL

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/admin/delsol/status` | Estado modo DELSOL |
| POST | `/api/admin/delsol/test-read` | Prueba lectura simulada |
| POST | `/api/admin/delsol/test-write` | Prueba escritura, bloqueada si no hay permisos |
| GET | `/api/admin/delsol/queue` | Cola de sincronizacion |
| POST | `/api/admin/delsol/queue/process` | Procesar pendientes |
| POST | `/api/admin/delsol/queue/:id/process` | Procesar item |

## Checklist manual minimo

- Login admin correcto.
- Login artista correcto.
- Rutas protegidas redirigen si no hay sesion.
- Artista crea peticion incompleta.
- Checklist muestra faltantes.
- Admin observa y deja mensaje.
- Artista corrige y reenvia.
- Admin valida.
- Admin prepara laboral si corresponde.
- Admin crea factura interna.
- PDF de planilla descarga.
- Export CSV funciona.
- DELSOL queda en `mock` o `blocked_permission` sin romper el flujo.

## Hallazgos de validacion de esta entrega

- `npm ci` en `backend` fallaba porque `package-lock.json` no estaba sincronizado con `package.json`.
- Se ejecuto `npm install` en `backend` para sincronizar el lockfile y permitir validacion reproducible.
- Se ejecuto `npm run require-check` en `backend` y cargo rutas correctamente.
- Se ejecuto `npm install` en `billing-service`; esto genero `package-lock.json` para hacerlo reproducible.
- Se ejecuto smoke test local: `login.html` y `tutorial-test-plan.html` respondieron HTTP 200 en backend; `/api/health` respondio `{"ok":true}` en billing.
- `npm audit` en `backend` reporta vulnerabilidades, incluyendo `xlsx` sin fix disponible y actualizaciones de `sqlite3` potencialmente rompedoras. No se aplico `npm audit fix --force` para no romper el MVP.
- `npm audit` en `billing-service` reporta vulnerabilidades altas ligadas a dependencias transitivas de `sqlite3/node-gyp/tar`; requiere revision antes de produccion.
- `backend/.env.example` ahora documenta `BILLING_BASE_URL` y `BILLING_INTERNAL_KEY` para el proxy interno de facturacion.
- Step53 agrega hardening local: `helmet`, rate limit en login, bloqueo de secretos demo en produccion, bloqueo de registro publico en produccion y smoke test local.

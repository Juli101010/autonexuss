# La Bonita · Step 48 · Operativo 2026

Esta entrega deja el proyecto listo para probar localmente con una regla central:

**La Bonita funciona como sistema principal. DELSOL queda como integración externa desacoplada.**

Actualmente las pruebas de DELSOL que compartió Luciana permiten lectura (`LeerRegistro`, `LeerConfiguracion`, `CargaTabla`, `LanzaConsulta`) pero la escritura/actualización devuelve `BDSinPermiso`. Por eso esta versión permite avanzar con el software completo sin bloquearse por DELSOL.

## Qué incluye esta versión

- Panel nuevo: `/labonita-operativo.html`
- Mapa de Peticiones operativo 2026
- Creación de peticiones desde el panel admin
- Facturas internas / borradores con numeración `LB-FAC-BORRADOR-2026-000001`
- Contratos internos pendientes de firma
- Carga de gastos vinculados a petición
- Liquidaciones internas
- Control Total por petición
- Exportación CSV del Control Total
- Cola de sincronización DELSOL
- Panel DELSOL con prueba de lectura, prueba de escritura segura y procesamiento de cola
- Auditoría interna de acciones
- Variables `.env` para cambiar luego de `mock` a `live`

## Instalación local

```bash
cd backend
cp .env.example .env
npm install
npm start
```

El `npm start` ejecuta antes `scripts/bootstrap-demo.js`, que crea usuarios demo y una petición inicial.

## Usuarios demo

```txt
ADMIN:  admin@test.com  / 123456
ARTIST: artist@test.com / 123456
```

## URLs principales

```txt
Login:          http://localhost:3001/login.html
Panel general:  http://localhost:3001/app.html
Operativo 2026: http://localhost:3001/labonita-operativo.html
```

## DELSOL

Por defecto queda así:

```env
DELSOL_MODE=mock
DELSOL_DEFAULT_EJERCICIO=2026
DELSOL_WRITE_ENABLED=0
```

Mientras `DELSOL_WRITE_ENABLED=0`, las operaciones de factura, gasto o liquidación quedan guardadas en `delsol_sync_queue` y al procesarlas pasan a `blocked_permission` con el mensaje equivalente a `BDSinPermiso`.

Cuando la clienta habilite escritura real en DELSOL, se podrá pasar a:

```env
DELSOL_MODE=live
DELSOL_WRITE_ENABLED=1
DELSOL_BASE_URL=...
DELSOL_API_KEY=...
```

La lógica de negocio no cambia: solo se completa el adaptador real en `backend/src/integrations/delsol/delsol.client.js`.

## Flujo recomendado de prueba

1. Entrar como admin.
2. Ir a `/labonita-operativo.html`.
3. Crear una petición o usar la demo.
4. Crear factura interna.
5. Crear contrato.
6. Cargar gasto.
7. Crear liquidación.
8. Revisar Control Total.
9. Ver la cola DELSOL.
10. Probar lectura DELSOL: debe responder OK simulado.
11. Probar escritura segura: debe responder `BDSinPermiso` hasta que habiliten permisos reales.

## Criterio técnico

No se usan credenciales DELSOL en frontend. Todo queda preparado para backend.

DELSOL no bloquea la operatoria: La Bonita puede generar peticiones, facturas internas, contratos, gastos, liquidaciones, controles y auditoría aunque DELSOL todavía no escriba.

# La Bonita - Step50 operativo 2026

Esta versión refuerza la lógica central del sistema: la factura no nace aislada, nace desde el Mapa de Peticiones.

## Cambios principales

- Nueva lógica de planillas:
  - Se puede guardar una planilla incompleta como `BORRADOR_INCOMPLETO`.
  - No se puede validar ni facturar si faltan obligatorios.
  - Desde el detalle se puede volver a completar/editar la planilla.

- Validación administrativa:
  - La planilla completa queda en `ESPERANDO_VALIDACION`.
  - La administración debe validar la petición antes de continuar.

- Alta/Baja antes de factura:
  - Se agregó preparación de Alta/Baja/A1 interna.
  - Esta información alimenta el control de Altas/Bajas y queda en cola DELSOL Laboral.

- Facturación como eje principal:
  - La factura interna solo puede generarse desde una petición completa y validada.
  - Para los casos que requieren laboral, primero debe existir Alta/Baja preparada.
  - La numeración sigue siendo interna: `LB-FAC-BORRADOR-2026-000001`.
  - DELSOL queda como sincronización externa desacoplada.

- Reglas incorporadas:
  - Comisión asociadas: 6% con mínimo 20€.
  - Servicio puntual: 7%.
  - Extras automáticos por fuera de plazo: 5€; con A1: 10€.
  - Extras manuales posibles desde la pantalla de factura.

- Nuevas exportaciones:
  - Control Total CSV.
  - Altas/Bajas CSV.
  - Gastos CSV.
  - Liquidaciones CSV.

## Prueba local

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Entrar en:

```txt
http://localhost:3001/login.html
```

Usuario local:

```txt
admin@test.com
123456
```

Panel operativo:

```txt
http://localhost:3001/labonita-operativo.html
```

## Flujo de prueba recomendado

1. Crear una planilla Alta + Factura.
2. Usar `Rellenar demo`.
3. Guardar planilla.
4. Abrir la petición.
5. Validar petición.
6. Preparar Alta/Baja.
7. Crear factura interna.
8. Revisar Control Total.
9. Procesar cola DELSOL: debería quedar bloqueada por permiso si `DELSOL_MODE` no está live con escritura habilitada.

## DELSOL

Por defecto:

```env
DELSOL_MODE=mock
DELSOL_DEFAULT_EJERCICIO=2026
DELSOL_WRITE_ENABLED=0
```

No poner credenciales DELSOL en frontend. La app local funciona aunque DELSOL no tenga escritura habilitada.

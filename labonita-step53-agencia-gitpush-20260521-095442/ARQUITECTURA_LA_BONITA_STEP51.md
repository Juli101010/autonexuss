# Arquitectura La Bonita - Step 51

## Decisión principal

La Bonita es el sistema operativo principal. DELSOL es un sistema externo de sincronización fiscal/laboral.

```
Mapa de Peticiones
  -> Base interna La Bonita
  -> Cola de sincronización
  -> DELSOL Facturación
  -> DELSOL Laboral / Actividades
```

## Base interna

La app guarda primero:

- peticiones;
- planillas completas o incompletas;
- estado de validación;
- mensajes admin/usuario;
- facturas internas;
- contratos;
- gastos;
- liquidaciones;
- movimientos laborales;
- cola DELSOL;
- auditoría.

## Validación

Reglas:

- Sin planilla no hay petición válida.
- Se puede guardar y enviar con faltantes.
- Sin obligatorios completos no se aprueba.
- Sin aprobación admin no se factura.
- Sin confirmación DELSOL no hay factura fiscal.
- Observación y rechazo exigen mensaje obligatorio.

## Facturación

La Bonita genera números internos:

`LB-FAC-BORRADOR-2026-000001`

El número fiscal definitivo debe salir de DELSOL.

## DELSOL Facturación

Pendiente de cerrar tablas:

- clientes: `F_CLI` ya identificada;
- artículos/conceptos: pendiente;
- factura cabecera: pendiente;
- líneas factura: pendiente;
- cobros/vencimientos: pendiente.

## DELSOL Laboral / Actividades

Identificado:

- `F_TRA`: trabajadores/personas;
- `F_ACT`: actividades/importes;
- relación probable: `F_ACT.TRAACT = F_TRA.CODTRA`.

## Roles

### Usuario/artista

- crea planilla;
- guarda con faltantes;
- envía a revisión;
- ve observaciones/rechazo;
- corrige si administración observa;
- descarga PDF de planilla completada.

### Administrador

- valida;
- observa/rechaza;
- crea alta/baja;
- crea factura interna;
- crea contratos;
- carga gastos;
- genera liquidaciones;
- revisa control total;
- procesa cola DELSOL.

## Producción

Para uso real conviene usar PostgreSQL, HTTPS, backups y credenciales rotadas. SQLite queda para prueba local.

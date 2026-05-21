# Registro interno de agencia - La Bonita Enterprise 2026

## Ficha

- Cliente: LaBonita, SCCL.
- Proyecto: La Bonita Enterprise 2026.
- Tipo: Software a medida + facturacion/operacion interna.
- Fecha contrato: 2026-03-24.
- Estado actual: En curso, demo local funcional, pendiente produccion/DELSOL.
- Responsable final: Julian Gabriel Orellano.
- Moneda contractual: EUR.
- Valor nominal: 3.800 EUR.
- Nota de credito: 1.000 EUR.
- Neto a cobrar: 2.800 EUR.

## Hitos

| Hito | Importe | Disparador | Estado |
| --- | ---: | --- | --- |
| H1 firma | 1.400 EUR | Firma/activacion | Pendiente de confirmar cobro |
| H2 entrega funcional | 1.400 EUR | Entrega funcional + puesta en marcha/aceptacion | Pendiente de criterio final |
| Mantenimiento mensual | 160 EUR/mes | Desde entrega/puesta en marcha segun decision | Pendiente |
| Mantenimiento anual | 1.500 EUR/año | Pago anticipado 12 meses | Pendiente |

## Equipo RACI

| Area | Responsable | Cuenta ante cliente | Consulta | Informado |
| --- | --- | --- | --- | --- |
| Arquitectura y desarrollo core | Julian | Julian | Daiana/Fernando | LaBonita |
| QA y compliance | Daiana | Julian | LaBonita | Equipo |
| Seguridad y hardening | Fernando | Julian | Daiana | LaBonita |
| Finanzas internacionales | Josser | Julian | Cliente | Equipo |
| Validacion funcional cliente | Manuela/Natalia | LaBonita | Julian/Daiana | Equipo |

## Estado operativo

- Backend local: `http://127.0.0.1:3001/login.html`.
- Usuarios demo: `admin@test.com / 123456`, `artist@test.com / 123456`.
- Billing integrado: backend apunta a `http://127.0.0.1:3011`.
- DELSOL: modo `mock`, escritura real deshabilitada.
- Zip final previo: `dist-labonita/`.

## Decisiones pendientes

1. Confirmar si H1 ya fue cobrado.
2. Definir disparador exacto de H2.
3. Elegir mantenimiento mensual o anual.
4. Confirmar donde se guardan comprobantes y facturas internacionales.
5. Confirmar responsable de VPS/dominio/backups.
6. Confirmar si LaBonita acepta entrega local como preproduccion o cierre.
7. Confirmar datos/tables/permisos DELSOL reales.


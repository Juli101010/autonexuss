# Preguntas economicas y equipo implicado

Este proyecto debe impactar en la contabilidad interna de la agencia porque es el primer proyecto formal subido desde este flujo.

## Datos economicos base

- Cliente: LaBonita, SCCL.
- Proyecto: desarrollo, rescate tecnico, despliegue, operaciones, ciberseguridad, facturacion internacional y mantenimiento.
- Valor nominal: 3.800 EUR.
- Nota de credito: 1.000 EUR.
- Neto a cobrar: 2.800 EUR.
- Hito 1: 1.400 EUR.
- Hito 2: 1.400 EUR.
- Mantenimiento mensual: 160 EUR.
- Mantenimiento anual: 1.500 EUR.
- Hora fuera de alcance: 40 EUR.

## Distribucion nominal por modulo

| Modulo | Responsable | Valor nominal |
| --- | --- | ---: |
| Arquitectura y desarrollo core | Julian Gabriel Orellano | 1.800 EUR |
| Operaciones, QA y compliance | Daiana Elizabeth Sosa | 570 EUR |
| Ciberseguridad y hardening inicial | Fernando Gomez Bustamante | 1.050 EUR |
| Finanzas internacionales | Josser Ramirez Pichardo | 380 EUR |

La nota de credito se aplica al proyecto global. Falta definir internamente si se prorratea entre modulos o si la absorbe una unidad concreta.

## Preguntas necesarias para contabilidad

1. El hito 1 de 1.400 EUR, ya fue cobrado efectivamente?
2. Fecha exacta de cobro/acreditacion del hito 1.
3. Medio de cobro usado: transferencia, intermediario, cuenta EUR u otro.
4. Hubo comisiones bancarias, retenciones o diferencias de cambio?
5. Quien emite la factura internacional y con que datos fiscales?
6. El hito 2 se factura al entregar este zip, al desplegar VPS o al validar LaBonita en 5 dias habiles?
7. El mantenimiento arranca desde entrega local, puesta en marcha productiva o aceptacion formal?
8. LaBonita elegira mantenimiento mensual de 160 EUR o anual de 1.500 EUR?
9. La nota de credito de 1.000 EUR se registra como descuento comercial, bonificacion o ajuste estrategico?
10. Como se reparte internamente el neto de 2.800 EUR entre responsables?
11. Se paga a Daiana, Fernando y Josser como porcentaje, importe fijo por modulo o contra tareas aprobadas?
12. Hay costos de VPS, dominio, backups, email, Redis, DELSOL o herramientas que deban facturarse aparte?
13. El trabajo fuera de alcance a 40 EUR/h se cobra con aprobacion previa por escrito?
14. Se necesita orden de compra, recibo, invoice proforma o factura final para cada hito?
15. Que moneda de registro interno usara la agencia: EUR, ARS, USD o doble moneda?

## Trabajadores/agentes implicados

| Area | Responsable humano | Rol operativo | Evidencia esperada |
| --- | --- | --- | --- |
| Direccion tecnica | Julian | Arquitectura, desarrollo, integracion, entrega | Commits, zip, despliegue, acta |
| Operaciones/QA | Daiana | Validacion funcional, checklist, control de hitos | Checklist firmado, reporte QA |
| Seguridad | Fernando | Hardening, permisos, revision de entorno | Checklist seguridad, acciones VPS |
| Finanzas | Josser | Facturacion/cobro EUR, conciliacion | Comprobante/invoice/conciliacion |
| Cliente | Manuela/Natalia | Validacion de alcance y datos reales | Observaciones escritas o aceptacion |

## Registro interno recomendado

Crear en la contabilidad de agencia:

- Cliente: LaBonita SCCL.
- Proyecto: La Bonita Enterprise 2026.
- Contrato: 2026-03-24.
- Moneda contractual: EUR.
- Hitos: H1 firma, H2 entrega funcional.
- Mantenimiento: pendiente de modalidad.
- Centro de costo: Proyecto cliente / La Bonita.
- Lineas internas por modulo para medir rentabilidad.


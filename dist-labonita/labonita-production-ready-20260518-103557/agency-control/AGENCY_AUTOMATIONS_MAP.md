# Mapa de automatizaciones de agencia para La Bonita

## Reglas

- Ninguna automatizacion debe emitir factura fiscal, ejecutar pagos ni escribir en DELSOL live sin aprobacion humana.
- Todo trigger debe dejar log verificable.
- Toda salida contable debe poder relacionarse con contrato, hito o mantenimiento.

## Automatizaciones recomendadas

| Automatizacion | Trigger | Entrada | Salida | Error | Log |
| --- | --- | --- | --- | --- | --- |
| Aceptacion 5 dias | Acta/entrega marcada | Fecha entrega, cliente, responsable | Recordatorio a equipo | Falta fecha/responsable | Notion/tarea |
| H2 pendiente | Entrega funcional creada | Proyecto, importe, factura | Tarea contable | Falta criterio H2 | Registro finanzas |
| Mantenimiento mensual | Dia 1 de cada mes | Proyecto, modalidad, importe | Tarea de cobro | Cliente sin modalidad | Registro ingresos |
| DELSOL bloqueado | Cola con `blocked_permission` | Items DELSOL | Tarea tecnica | Sin credenciales | Cola + tarea |
| Backup check | Semanal | Servidor/base | Checklist backup/restore | Sin servidor | Reporte QA |
| QA pre-entrega | Antes de zip/despliegue | URL, usuarios demo | Checklist OK/fallos | App caida | Reporte QA |

## Preguntas vivas

- Quien recibe alertas: Julian solo, equipo o tambien LaBonita?
- El canal oficial sera Notion, WhatsApp, email u otro?
- Los comprobantes financieros se guardan en Notion, Drive, Odoo o carpeta local?
- Que eventos contables deben disparar tarea automaticamente?


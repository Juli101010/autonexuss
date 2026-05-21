# Agentes y operacion de agencia

## Agentes humanos del contrato

| Area | Responsable | Tarea principal |
| --- | --- | --- |
| Direccion general y desarrollo | Julian Gabriel Orellano | Arquitectura, rescate tecnico, backend, entrega y decision final |
| Operaciones y compliance | Daiana Elizabeth Sosa | Hitos, QA funcional, consistencia y seguimiento |
| Ciberseguridad | Fernando Gomez Bustamante | Hardening, permisos, proteccion y revision inicial |
| Finanzas internacionales | Josser Ramirez Pichardo | Facturacion internacional, cobro EUR y conciliacion |

## Agentes operativos recomendados dentro de la agencia

| Agente | Uso | Entrada | Salida | Logs/Evidencia |
| --- | --- | --- | --- | --- |
| Agente QA LaBonita | Ejecutar checklist antes de entrega | URL local/productiva y usuarios demo | Reporte de flujos OK/falla | Capturas, checklist firmado |
| Agente Seguridad | Revisar headers, dependencias, secretos y accesos | Repo, `.env.example`, servidor | Lista de riesgos y fixes | `npm audit`, checklist OWASP |
| Agente Contabilidad | Registrar hitos, mantenimiento y reparto interno | Contrato, cobros, equipo | Asientos/registro interno | Comprobantes, acta de cobro |
| Agente DELSOL | Validar tablas y permisos | Credenciales/test DELSOL | Mapa de tablas y prueba real | Respuesta API, cola sync |
| Agente Documentacion | Mantener README, actas y roadmap | Cambios tecnicos | Entrega entendible | Versiones de docs |

## Automatizaciones futuras recomendadas

- Recordatorio interno si faltan documentos en una peticion.
- Alerta de vencimiento de 5 dias habiles de aceptacion.
- Reintento programado de cola DELSOL.
- Reporte semanal de proyectos con balance distinto de cero.
- Registro mensual de mantenimiento a cobrar.

## Preguntas antes de activar automatizaciones

1. Quien recibe alertas internas: Julian, Daiana, LaBonita o todos?
2. WhatsApp, email o ambos?
3. Que eventos deben generar notificacion contable?
4. Que acciones requieren aprobacion humana antes de ejecutarse?
5. Donde se guardan logs oficiales de entrega y mantenimiento?


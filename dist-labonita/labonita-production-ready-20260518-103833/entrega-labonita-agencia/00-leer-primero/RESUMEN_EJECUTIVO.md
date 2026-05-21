# Resumen ejecutivo - La Bonita

## Que es

La Bonita es un sistema operativo para gestionar peticiones de artistas/personas asociadas, altas, facturacion, formacion, documentos, controles internos, liquidaciones y preparacion de sincronizacion con DELSOL.

## Para que sirve

Centraliza el flujo que antes quedaba repartido entre planillas, PDFs, Excel, WhatsApp y validaciones manuales. El eje es el Mapa de Peticiones: cada peticion avanza desde borrador hasta revision, validacion, factura interna, movimientos laborales, gastos, liquidacion y cierre.

## Estado de entrega

Estado actual: demo funcional local, registro creado en agencia y paquete de continuidad organizado.

Incluye:

- Codigo principal `backend`.
- Servicio separado `billing-service`.
- Planillas oficiales copiadas.
- Demo de referencia.
- Contrato firmado.
- Mapa de peticiones.
- Mapa API y checklist de pruebas.
- Roadmap de librerias GitHub.
- Preguntas contables y de equipo.
- Registro Notion en `Agencia - HQ / Proyectos`.
- Tareas Notion para H1/H2, QA, seguridad, DELSOL y acta de entrega.

## Lo que ya se puede mostrar

- Login admin/artista.
- Portal artista.
- Panel admin operativo.
- Creacion y revision de peticiones.
- Validacion de obligatorios.
- Observacion/rechazo con mensajes.
- PDF completado.
- Controles CSV.
- Factura interna.
- Cola DELSOL mock/bloqueada por permisos.

## Lo que falta para produccion

- VPS, dominio, HTTPS y secretos reales.
- Backups y prueba de restauracion.
- Resolver/aceptar riesgos de dependencias.
- Confirmar tablas y permisos DELSOL reales.
- Prueba de escritura DELSOL crear-leer-confirmar numero fiscal.
- Aprobacion formal de LaBonita dentro de ventana contractual.
- Definir mantenimiento mensual o anual.

## URLs actuales

- App local: http://127.0.0.1:3001/login.html
- Proyecto Notion: https://www.notion.so/364b7aa5a51f810db947f1f15c3467d7

## Decision tecnica importante

No se integraron ahora SurveyJS, Form.io, CASL, BullMQ ni Playwright para no romper el MVP. Quedan como roadmap priorizado. El sistema actual se mejora primero con documentacion, pruebas, seguridad, despliegue y validacion real del flujo.

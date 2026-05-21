# Cumplimiento del contrato - La Bonita

Fuente revisada: `Contrato_Autonexus_LaBonita_Enterprise_2026-03-24_final_firmado.pdf`.

## Condiciones economicas confirmadas

- Valor nominal del proyecto: 3.800 EUR.
- Nota de credito estrategica: 1.000 EUR.
- Saldo neto final: 2.800 EUR.
- Hito 1 a la firma: 1.400 EUR.
- Hito 2 contra entrega funcional y puesta en marcha: 1.400 EUR.
- Mantenimiento mensual: 160 EUR finales por mes.
- Mantenimiento anual promocional: 1.500 EUR por 12 meses.
- Fuera de alcance: 40 EUR por hora, minimo 1 hora.

## Equipo contractual

- Julian Gabriel Orellano: direccion general, arquitectura, desarrollo core, rescate tecnico, despliegue y aprobacion final.
- Daiana Elizabeth Sosa: operaciones, compliance, control de hitos, QA funcional y validacion de entregables.
- Fernando Gomez Bustamante: ciberseguridad, hardening, permisos, vulnerabilidades heredadas y proteccion de datos.
- Josser Ramirez Pichardo: finanzas internacionales, cobro en EUR, conciliacion y documentacion bancaria.

## Modulos del contrato vs sistema actual

| Modulo contractual | Estado actual | Evidencia en proyecto | Pendiente |
| --- | --- | --- | --- |
| Arquitectura y desarrollo core | Cubierto para demo funcional | `backend/`, `src/config/db.js`, `src/routes.js`, paneles publicos | Endurecer para produccion y migracion futura a PostgreSQL |
| Operaciones, QA y compliance | Parcialmente cubierto | `tutorial-test-plan.html`, checklist local, documentacion step52 | QA formal con escenarios firmados por LaBonita |
| Ciberseguridad inicial | Parcialmente cubierto | JWT, cookies HttpOnly, roles, headers basicos, `SECURITY.md` | Rate limit, CSP fuerte, HTTPS, backups, hardening VPS |
| Facturacion internacional | Documentado, no operativo contable externo | `billing-service/`, outbox, preguntas contables | Confirmar intermediario, cuenta EUR, factura y conciliacion real |
| Puesta en marcha | Preparada para local | `.env.example`, scripts npm, usuarios demo | VPS, dominio, SSL, secretos reales y prueba con cliente |
| Accesos y titularidad cliente | Pendiente de despliegue | No aplica en local | Entregar credenciales de VPS/repositorio al cliente cuando pague/avance contrato |
| Backups | Pendiente produccion | Recomendado en docs | Definir frecuencia, destino, responsable y prueba de restauracion |

## Criterios de aceptacion sugeridos

La entrega deberia considerarse funcional cuando LaBonita pueda:

1. Entrar como administracion y artista.
2. Crear una peticion desde planilla.
3. Guardar borrador incompleto.
4. Ver campos/documentos faltantes.
5. Enviar a revision.
6. Observar, rechazar o validar desde admin.
7. Descargar PDF completado.
8. Crear factura interna sin emitir numeracion fiscal.
9. Ver cola DELSOL pendiente/bloqueada por permisos.
10. Exportar controles CSV.

## Riesgos contractuales

- DELSOL real depende de permisos, tablas y documentacion final del cliente/proveedor. No debe prometerse escritura real hasta validar acceso.
- El contrato habla de despliegue y VPS; este paquete local no reemplaza la puesta en marcha productiva.
- La seguridad inicial existe, pero no equivale a monitoreo 24/7 ni auditoria externa completa.
- `npm audit` reporta vulnerabilidades de dependencias; algunas requieren cambios potencialmente rompedores y `xlsx` no tiene fix directo disponible. Debe tratarse antes de produccion.
- Nuevos modulos, integraciones o redisenos estructurales deben tratarse como fuera de alcance.

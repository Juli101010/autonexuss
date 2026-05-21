# README de entrega - La Bonita Step53 Agencia

## Objetivo

Entregar un paquete comprensible para continuar y cerrar La Bonita como primer proyecto formal de la agencia: sistema, demo, planillas, contrato, mapa de peticiones, pruebas, recursos tecnicos y preguntas economicas para contabilidad.

## Contenido de esta carpeta

- `01-contrato`: contrato firmado y resumen de cumplimiento.
- `02-mapa-peticiones`: mapa operativo simplificado y fuente de verdad.
- `03-demo`: demo HTML de referencia y plan de prueba local.
- `04-planillas-documentos`: planillas PDF, DOCX y XLSX copiadas desde el sistema.
- `05-api-y-pruebas`: mapa de rutas, pruebas y validaciones.
- `06-mejoras-github`: librerias/repo recomendados para mejorar el producto.
- `07-contabilidad-agencia`: preguntas economicas, equipo implicado e impacto contable.

## Entrega funcional actual

El sistema permite:

- Login con roles `ADMIN` y `ARTIST`.
- Portal de artista/usuario con peticiones propias.
- Panel admin operativo.
- Mapa de Peticiones como eje.
- Validacion de campos obligatorios y documentos.
- Observaciones, rechazo, mensajes y notificaciones internas.
- Descarga de planilla completada en PDF.
- Factura interna, gastos, contratos, liquidaciones y cierre a cero.
- Cola preparada para DELSOL sin depender de escritura real.
- Tutorial y checklist de prueba local.

## Regla clave

La Bonita no debe inventar numeracion fiscal. El numero fiscal definitivo debe venir de DELSOL cuando la integracion real este habilitada. El sistema local genera borradores internos y cola de sincronizacion.

## Como continuar

1. Probar el flujo completo con usuarios demo.
2. Validar con LaBonita cada planilla y campo obligatorio.
3. Confirmar tablas/permisos DELSOL.
4. Definir servidor, backups y secretos.
5. Cerrar preguntas economicas y equipo.
6. Planificar produccion y mantenimiento.

## Avisos importantes antes de produccion

- No incluir `.env` reales en ningun zip ni repositorio.
- No subir `node_modules`.
- Cambiar `JWT_SECRET` e `INTERNAL_KEY`.
- Activar HTTPS, backups y dominio real.
- Resolver vulnerabilidades de dependencias o dejar aceptacion de riesgo documentada.
- Confirmar DELSOL con permisos reales antes de prometer factura fiscal automatica.

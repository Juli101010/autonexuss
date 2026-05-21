# Mapa operativo resumido

## Flujo principal

1. Usuario/artista entra al portal.
2. Elige tipo de peticion.
3. Completa planilla.
4. Adjunta documentos si corresponde.
5. Guarda borrador o envia a revision.
6. Administracion revisa checklist.
7. Administracion observa, rechaza o valida.
8. Si valida, se habilitan acciones internas: laboral, contrato, factura, gastos, liquidacion y cierre.
9. La cola DELSOL guarda operaciones para sincronizar cuando existan permisos.
10. Control Total concentra ingreso, gastos, liquidaciones, margen y balance a cero.

## Tipos de peticion activos

- Alta + Factura Puntual.
- Presupuesto.
- Contrato de Formacion.
- Persona Asociada.
- Servicio Puntual.

## Reglas fuertes

- Sin planilla no hay peticion valida.
- Sin datos completos no hay aprobacion.
- Sin aprobacion admin no hay factura interna final.
- Sin confirmacion DELSOL no hay factura fiscal.
- Formacion requiere 10 dias de antelacion.
- Servicio puntual maximo 2 veces; a la tercera debe pasar a persona asociada.
- Comision asociadas: 6%, minimo 20 EUR.
- Comision servicios puntuales: 7%.
- El cierre operativo debe tender a balance cero.

## Documentos/planillas incluidos

- Formulario inscripcion persona asociada.
- Formulario servicio puntual.
- Peticion alta factura puntual.
- Peticion contrato formacion.
- PRL: consentimiento renuncia, entrega EPIS, examen inicial.
- Controles Excel: altas mes, gastos, solo/control puntual, costes, BBDD para altas.

## Estados operativos importantes

- `BORRADOR`
- `EN_REVISION`
- `OBSERVADA_CORRECCION`
- `RECHAZADA`
- `VALIDADA`
- `ALTA_BAJA_INTERNA`
- `CONTRATO_EN_CURSO`
- `FACTURA_INTERNA`
- `LIQUIDACION_INTERNA`
- `CERRADA_CERO`


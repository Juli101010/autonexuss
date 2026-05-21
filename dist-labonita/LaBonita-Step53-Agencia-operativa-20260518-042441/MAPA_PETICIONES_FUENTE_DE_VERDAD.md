# LaBonita — Fuente de verdad del Mapa de Peticiones

## Criterio de trabajo

La carpeta `LaBonita - Ultimo enviado` se toma como fuente documental del proceso. El eje real del sistema es el **Mapa de Peticiones**. Todo lo que no alimente ese mapa, la base única de datos, los controles internos, el área privada o las automatizaciones derivadas debe quedar fuera del alcance funcional principal.

El archivo `demo (1).html` se toma como referencia aprobada de experiencia visual: paleta amarilla/gris, sidebar por áreas, tarjetas, mapa visual, formularios por pasos, estado de DelSol, avisos y controles.

## Columna vertebral funcional

1. **Petición**
   - Alta + Factura
   - Presupuesto
   - Contrato de Formación
   - Servicio Puntual asociado a una petición o a un acompañante

2. **Validación interna**
   - La persona puede guardar una petición incompleta.
   - La administración decide qué campos son obligatorios y cuáles no.
   - Si falta información, el sistema genera checklist y recordatorios.
   - Antes del OK final debe quedar en estado de espera/validación.

3. **Altas, bajas y Seguridad Social**
   - Fechas de actuación, viajes, altas/bajas por día.
   - A1 cuando corresponde.
   - Exportación o vista interna equivalente al control de altas.

4. **Contratos**
   - Contrato laboral por período de trabajo.
   - Contrato con cliente.
   - Firma virtual/documentos oficiales.

5. **Facturación**
   - Datos fiscales del cliente.
   - Tipo de IVA: 21%, 4%, exento UE con VIES, exento país no UE, exento formación u otro.
   - Preparado para conexión con Software DelSol: Facturación, Contable y Laboral.

6. **Cálculos**
   - Comisión LaBonita.
   - Retención IRPF.
   - Gastos puntuales.
   - Gastos de representación.
   - Seguridad Social.
   - Nómina.
   - Pagos, adelantos y liquidaciones.

7. **Cierre en cero**
   - Cada proyecto/bolo debe cerrar con balance cero.
   - El Control Total debe concentrar facturación, gastos, comisiones, pagos y estado final.

## Módulos que sí corresponden al mapa

- Área privada de artista/persona asociada.
- Área privada de servicio puntual.
- Área privada de administradoras.
- Petición Alta + Factura.
- Presupuesto convertible a Alta + Factura.
- Contrato de Formación.
- Persona Asociada.
- Servicio Puntual.
- Documentos PRL, DNI/NIE, Seguridad Social, firma, EPIS si corresponde.
- Avisos, recordatorios, comunicados y mensajes.
- Controles internos derivados de los Excel actuales.
- DelSol Sync preparado, sin inventar integración real hasta confirmar API/proceso.

## Controles actuales a reemplazar o unificar

- `CONTROL TOTAL`: resumen global y cierre en cero.
- `BBDD PARA ALTAS`: datos de altas/bajas en formato copiable para Seguridad Social y A1.
- `CONTROL ALTAS MES`: vista mensual de altas y nóminas.
- `COSTES`: datos ya calculados desde Laboral.
- `CONTROL GASTOS`: gastos puntuales, generales, tickets/facturas y saldos.
- `CONTROL PUNTUALES`: personas invitadas/acompañantes/servicios puntuales.

## Reglas funcionales fuertes

- Trámites habituales: mínimo 3 días laborables.
- Trámites especiales/extranjeros: 7 días laborables.
- Formación: mínimo 10 días de antelación.
- No aceptar altas el mismo día de trabajo.
- Servicio puntual máximo 2 veces; a la tercera debe pasar a persona asociada.
- Comisión asociadas: 6%, mínimo 20 €.
- Comisión servicios puntuales: 7%.
- Extras: seguros especiales, riesgos laborales especiales, modificación/anulación de factura, modificación/anulación de nómina, alta fuera de plazo.

## Correcciones aplicadas en este paquete

- Se corrigió HTML roto en `backend/public/app.html` que cortaba los paneles de Facturación y Controles.
- Se agregó panel base de Citas online para que la ruta `#/citas` no apunte a un panel inexistente.
- Se corrigió un bug de runtime en `backend/src/modules/controls/controls.service.js`: `payouts_total` y `balance_to_zero` se calculaban pero se devolvían con variables inexistentes.
- Se corrigió un error de sintaxis en `backend/public/js/app.js` dentro del render de campos faltantes.
- Se mejoró la ruta de Facturación para activar menú y título correctamente.

## Próximo paso recomendado

No seguir agregando pantallas aisladas. Primero hay que consolidar una versión estable del shell aprobado:

1. Dashboard visual como demo aprobado.
2. Mapa de Peticiones como centro operativo.
3. Wizard Alta + Factura alineado al PDF.
4. Wizard Servicio Puntual alineado al PDF.
5. Wizard Persona Asociada alineado al PDF.
6. Controles internos derivados de la petición, no cargados a mano.
7. Avisos automáticos por faltantes, caducidades y movimientos.
8. DelSol como módulo preparado, sin simular una integración que todavía no está confirmada.

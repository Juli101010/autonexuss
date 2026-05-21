# Relación con alcance contratado

Según el alcance funcional trabajado, La Bonita necesita:

- Mapa de peticiones como eje del sistema.
- Panel diferenciado por roles: usuario/cliente y administración.
- Formularios/planillas asociados a cada petición.
- Revisión, aprobación o rechazo administrativo.
- Mensaje de rechazo con motivo.
- Descarga de documentos/planillas completos.
- Facturación desde peticiones aprobadas.
- Sincronización con Software DELSOL.
- Trazabilidad de cada operación.

La prueba actual demuestra que la parte crítica de facturación con DELSOL es viable:

```txt
Autenticación OK
Lectura OK
Actualización OK
Alta F_FAC OK
Alta F_LFA OK
```

Pendiente para cerrar producción:

```txt
Endpoint exacto de borrado
Limpieza de factura 208 de prueba
Mapper completo con todos los campos requeridos
Validación de cliente/IVA antes de aprobar
Control de idempotencia para no duplicar facturas
```


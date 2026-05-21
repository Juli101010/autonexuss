# La Bonita - Step 51

## Qué trae esta versión

Versión local reforzada para probar el circuito real del sistema antes de cerrar la integración final con DELSOL.

### Eje funcional

La columna vertebral es el Mapa de Peticiones:

1. Petición desde planilla real.
2. Guardado con o sin datos faltantes.
3. Envío a revisión.
4. Validación administrativa.
5. Observación/rechazo con mensaje obligatorio al usuario.
6. Descarga de planilla completada en PDF.
7. Alta/Baja / A1 / movimiento laboral interno cuando corresponde.
8. Factura interna/borrador.
9. Contrato.
10. Gastos.
11. Liquidación/nómina interna.
12. Control total.
13. Cola de sincronización DELSOL.

### Planillas preparadas

- Petición de Alta + Factura Puntual.
- Formulario Servicio Puntual.
- Petición de Contrato de Formación.
- Formulario Inscripción Persona Asociada.
- Documentación PRL de referencia: consentimiento/renuncia, entrega de EPIs y examen inicial.

Las planillas fuente quedan disponibles en `/public/templates`; también se copiaron PRL y Excel de controles como material de referencia. El sistema genera una planilla completada en PDF a partir de los datos cargados.

### Roles

**Usuario / artista**

- Crea planillas.
- Guarda con datos faltantes.
- Envía a revisión aunque falten datos.
- Ve observaciones o rechazo de administración.
- Corrige cuando la petición queda observada.
- Descarga su planilla completada en PDF.

**Administrador**

- Ve todas las peticiones.
- Valida solo si no faltan obligatorios.
- Observa con mensaje obligatorio.
- Rechaza con motivo obligatorio.
- Descarga planilla completada.
- Genera alta/baja, factura interna, contrato, gastos, liquidación y control total.
- Maneja cola DELSOL.

### DELSOL

DELSOL queda desacoplado. La Bonita funciona primero con base interna y luego sincroniza.

- DELSOL Facturación: clientes, facturas, líneas, artículos/conceptos y cobros. Pendiente de cerrar tablas reales.
- DELSOL Laboral/Actividades: `F_TRA` y `F_ACT` ya quedan contempladas como base de trabajadores y actividades/importes.

La numeración fiscal definitiva NO la decide La Bonita. Debe salir de DELSOL cuando se active la emisión real.

## Cómo probar localmente

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Entrar a:

```txt
http://localhost:3001/login.html
```

Usuario admin local:

```txt
admin@test.com
123456
```

Panel principal:

```txt
http://localhost:3001/app.html
```

Panel operativo admin:

```txt
http://localhost:3001/labonita-operativo.html
```

Portal usuario/artista:

```txt
http://localhost:3001/artist-operativo.html
```

## Prueba recomendada

### Como usuario/artista

1. Crear cuenta desde registro o usar un usuario artista.
2. Entrar a Mis peticiones.
3. Elegir una planilla.
4. Guardarla con datos faltantes.
5. Enviarla a revisión.
6. Descargar la planilla completada.

### Como admin

1. Entrar con admin.
2. Abrir Operativo 2026.
3. Seleccionar la petición.
4. Revisar faltantes.
5. Observar con mensaje obligatorio o completar/validar.
6. Descargar planilla completada.
7. Validar si está completa.
8. Preparar Alta/Baja.
9. Crear factura interna.
10. Crear liquidación/gastos.
11. Revisar Control Total.

## Seguridad local incluida

- Contraseñas hasheadas con bcrypt.
- Sesión en cookie HttpOnly.
- Separación de roles admin / artista.
- Tokens DELSOL fuera del frontend.
- Credenciales reales solo en `.env`.
- Descarga de documentos protegida por propietario o admin.
- Cabeceras básicas de seguridad.
- Auditoría interna de acciones críticas.

## Pendientes antes de producción real

- Migrar de SQLite local a PostgreSQL productivo.
- Activar HTTPS.
- Configurar backups automáticos.
- Rotar credenciales DELSOL ya compartidas por mail/capturas.
- Confirmar tablas DELSOL de facturación: cabecera, líneas, artículos/conceptos y cobros.
- Probar factura real completa con numeración asignada por DELSOL.
- Revisar permisos finos por rol si agregan más perfiles internos.

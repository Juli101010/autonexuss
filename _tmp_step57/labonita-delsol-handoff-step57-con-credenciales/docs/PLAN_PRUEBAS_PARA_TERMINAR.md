# Plan de pruebas para terminar la integración

## Prueba 1 · Verificar estado actual de factura 208

Ejecutar:

```powershell
node .\scripts\verificar-factura-208.cjs
```

Esperado si sigue creada:

```txt
F_FAC 208: OK con datos
F_LFA 208: OK con datos
```

## Prueba 2 · Borrar factura 208 de prueba

Ejecutar:

```powershell
node .\scripts\borrar-factura-208-smart.cjs
```

El script prueba variantes de endpoint.

Orden correcto:

```txt
1. borrar línea F_LFA
2. borrar cabecera F_FAC
3. verificar que no exista
```

## Prueba 3 · Confirmar endpoint exacto de borrado

Si el script no puede borrar porque todos devuelven 404, pedir a Kiki:

```txt
URL exacta del endpoint de borrado usado en Postman.
Método exacto.
Headers.
Body exacto.
Si usó query params o form-data/key-value.
```

## Prueba 4 · Alta controlada luego de resolver borrado

No crear más facturas de prueba hasta poder borrar correctamente.

Cuando el borrado esté resuelto, correr:

```powershell
$env:CONFIRMAR_CREACION="SI"
node .\scripts\crear-factura-prueba-confirmada.cjs
```

## Prueba 5 · Integración en La Bonita

Conectar el servicio real:

```txt
DelsolAuthService
DelsolClient
DelsolInvoiceService
InvoiceSyncQueue
AuditLog
```


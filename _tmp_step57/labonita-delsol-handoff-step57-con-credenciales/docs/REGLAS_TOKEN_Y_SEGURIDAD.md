# Reglas de token, seguridad y arquitectura

## Regla principal

Para La Bonita, cada operación crítica contra DELSOL debe pedir token nuevo.

Motivo: los tokens caducan rápido y las pruebas devolvieron `Unauthorized` cuando se reutilizó un token viejo.

## Flujo obligatorio

```txt
acción crítica
→ autenticar /login/Autenticar
→ obtener token JWT
→ ejecutar endpoint /admin/...
→ registrar request/response
→ descartar token
```

## Reintento

Si DELSOL devuelve `Unauthorized`:

```txt
1. pedir token nuevo
2. reintentar una sola vez
3. si vuelve a fallar, registrar error y no duplicar operación
```

## Backend solamente

No exponer en frontend:

- código de fabricante,
- código de cliente,
- base de datos,
- password,
- token JWT.

## Variables de entorno

Usar `.env.delsol.local` en desarrollo y secrets/variables de entorno en producción.

## Auditoría interna

Cada sincronización debe guardar:

```txt
petition_id
acción: consulta / alta factura / alta línea / actualización / borrado
endpoint
tabla
payload_sanitizado
respuesta DELSOL
usuario admin
fecha/hora
estado
número DELSOL generado
```

## Idempotencia

Antes de crear factura, revisar si la petición ya tiene `delsol_invoice_number`.

Si existe, no crear otra factura.

## Numeración

La numeración no se calcula en frontend. Se calcula en backend justo antes de escribir.


# LEER PRIVADO · CREDENCIALES DELSOL

Este paquete incluye credenciales reales para pruebas locales de La Bonita contra DELSOL.

## Uso rápido

Desde PowerShell:

```powershell
cd C:\Users\Julian\Downloads\labonita-delsol-handoff-step57-con-credenciales
node .\scripts\verificar-factura-208.cjs
node .\scripts\borrar-factura-208-smart.cjs
```

## Archivos con credenciales reales

- `.env.delsol.local`
- `config/.env.delsol.local`
- `config/delsol.credentials.local.json`
- `config/postman_environment_labonita_delsol_2026.local.json`

## Regla para la app

No usar un token fijo. La app debe autenticar contra:

`POST https://api.sdelsol.com/login/Autenticar`

antes de cada operación crítica, y luego llamar a:

`https://api.sdelsol.com/admin/...`

con `Authorization: Bearer <token>`.

## Estado de pruebas

- Autenticación: OK.
- Lectura `F_FAC`: OK.
- Lectura `F_LFA`: OK.
- Escritura `F_FAC`: OK.
- Escritura `F_LFA`: OK.
- Factura de prueba creada: `TIPFAC=1`, `CODFAC=208`.
- Pendiente urgente: borrar/limpiar factura 208 si sigue existiendo.

No subir este paquete a GitHub ni compartirlo fuera del equipo técnico autorizado.

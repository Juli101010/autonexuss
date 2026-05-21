# Informe técnico · Integración La Bonita con Software DELSOL

## 1. Objetivo

Dejar asentado el estado real de la integración entre La Bonita y Software DELSOL para poder terminar las pruebas de facturación y preparar el desarrollo final del módulo.

El objetivo principal del sistema es que una petición aprobada en La Bonita pueda generar su factura en DELSOL, respetando numeración, cliente, base imponible, IVA, total, líneas de factura y auditoría interna.

## 2. Conexión y autenticación

La autenticación correcta no va contra `/admin/Autenticar`. La ruta que funcionó es:

```txt
POST https://api.sdelsol.com/login/Autenticar
```

Body esperado:

```json
{
  "codigoFabricante": "...",
  "codigoCliente": "...",
  "baseDatosCliente": "FS006",
  "password": "PASSWORD_EN_BASE64"
}
```

Respuesta esperada:

```json
{
  "resultado": "JWT_TOKEN",
  "respuesta": "OK"
}
```

Decisión de arquitectura: **generar token nuevo en cada operación crítica**, porque los tokens caducan rápido y DELSOL devuelve `Unauthorized` cuando la sesión vence.

## 3. Base y ejercicio probados

- Base: `FS006`.
- Ejercicio: `2026`.
- API admin usada luego de autenticar: `https://api.sdelsol.com/admin/...`.

## 4. Tablas confirmadas

| Tabla | Uso confirmado |
|---|---|
| `F_CLI` | Clientes |
| `F_ART` | Artículos/conceptos |
| `F_FAC` | Cabecera de facturas |
| `F_LFA` | Líneas de factura |
| `F_COB` | Cobros |
| `F_PRE` | Presupuestos |
| `F_LAL` | Líneas de albarán/remito |

## 5. Lectura de factura real confirmada

Se consultó la última factura del ejercicio 2026:

```sql
SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'
```

Resultado:

```txt
ultimaFactura = 207
```

Luego se leyó la factura 207 en `F_FAC` y sus líneas en `F_LFA`.

Cabecera detectada:

```txt
TIPFAC = 1
CODFAC = 207
REFFAC = CARMELINA BENIARBEIG
FECFAC = 2026-05-18
CLIFAC = 3207
CNOFAC = AYUNTAMIENTO DE BENIARBEIG
CNIFAC = P0302600B
NET1FAC = 800
BAS1FAC = 800
PIVA1FAC = 21
IIVA1FAC = 168
TOTFAC = 968
EDRFAC = 2026
```

Línea detectada:

```txt
TIPLFA = 1
CODLFA = 207
POSLFA = 1
DESLFA = Recital "Polsim de temps de records"...
CANLFA = 1
PRELFA = 800
TOTLFA = 800
```

Relación confirmada:

```txt
F_FAC.TIPFAC + F_FAC.CODFAC
=
F_LFA.TIPLFA + F_LFA.CODLFA
```

## 6. Escritura confirmada

Se probó `ActualizarRegistro` en:

- `F_FAC` sobre factura 207, manteniendo valores iguales.
- `F_LFA` sobre la línea 207, manteniendo valores iguales.

Ambas respuestas fueron:

```json
{
  "resultado": "",
  "respuesta": "OK"
}
```

Luego se probó alta real de factura de prueba:

- Cabecera: `F_FAC`, factura `208`.
- Línea: `F_LFA`, línea `208`.

Ambas altas respondieron `OK` y la lectura posterior también respondió `OK`.

## 7. Estado delicado actual

La prueba de alta creó una factura de prueba:

```txt
TIPFAC = 1
CODFAC = 208
REFFAC = PRUEBA INTEGRACION LA BONITA
TOTFAC = 1.21
```

Y una línea:

```txt
TIPLFA = 1
CODLFA = 208
POSLFA = 1
DESLFA = PRUEBA INTEGRACION LA BONITA - BORRAR
TOTLFA = 1
```

El borrado falló porque el endpoint probado:

```txt
POST https://api.sdelsol.com/admin/BorrarRegistro
```

devolvió `404`, indicando que la ruta exacta no coincide. Esto no es problema de permisos; es problema de endpoint/nombre de ruta.

## 8. Pendiente inmediato

Confirmar el endpoint exacto de borrado.

Candidatos a probar:

```txt
/admin/BorraRegistro
/admin/BorrarRegistro
/admin/EliminarRegistro
/admin/EliminaRegistro
```

Si ninguno responde, pedir a Kiki la captura/export de Postman donde borró `F_ACT` con `filtro`.

## 9. Lógica final para la app

Cuando una petición se aprueba:

1. La Bonita guarda toda la información en su propia base.
2. El administrador aprueba la petición.
3. Backend autentica contra DELSOL y obtiene token nuevo.
4. Backend consulta última factura:

```sql
SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'
```

5. Backend calcula `CODFAC = ultima + 1`.
6. Backend escribe cabecera en `F_FAC`.
7. Backend escribe línea/s en `F_LFA`.
8. Backend vuelve a leer y verifica que exista.
9. Backend guarda en La Bonita:
   - número DELSOL,
   - request enviado,
   - respuesta recibida,
   - usuario que aprobó,
   - fecha/hora,
   - estado `sincronizado` o `error`.

## 10. Reglas de seguridad

- Las credenciales reales no deben quedar en el frontend.
- Las credenciales reales no deben subirse a GitHub.
- El token nunca debe viajar al navegador.
- Cada operación crítica debe pedir token nuevo.
- Si una operación falla a mitad de camino, registrar estado y permitir reintento controlado.
- Evitar duplicar facturas: usar idempotencia interna por `petition_id`.


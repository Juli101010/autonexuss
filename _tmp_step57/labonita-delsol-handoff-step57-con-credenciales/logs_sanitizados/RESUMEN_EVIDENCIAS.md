# Evidencias sanitizadas de pruebas

## Autenticación

- Endpoint correcto: `/login/Autenticar`.
- Respuesta obtenida: `OK`.
- Token: no se guarda en este ZIP.

## Lectura factura 207

```txt
SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'
→ 207
```

```txt
F_FAC 207 → OK
F_LFA 207 → OK
```

## Escritura

```txt
ActualizarRegistro F_FAC 207 → OK
ActualizarRegistro F_LFA 207 → OK
EscribirRegistro F_FAC 208 → OK
EscribirRegistro F_LFA 208 → OK
```

## Borrado

```txt
/admin/BorrarRegistro → 404
```

Interpretación: no es permiso; falta confirmar endpoint exacto.


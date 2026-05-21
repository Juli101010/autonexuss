# Estado de factura de prueba 208

Durante la prueba controlada se creó una factura de prueba:

```txt
F_FAC:
TIPFAC = 1
CODFAC = 208
REFFAC = PRUEBA INTEGRACION LA BONITA
TOTFAC = 1.21
```

Y una línea:

```txt
F_LFA:
TIPLFA = 1
CODLFA = 208
POSLFA = 1
DESLFA = PRUEBA INTEGRACION LA BONITA - BORRAR
TOTLFA = 1
```

El alta y la lectura funcionaron. El borrado falló porque el endpoint probado `/admin/BorrarRegistro` devolvió 404.

Acción inmediata: confirmar endpoint real de borrado y limpiar 208 antes de nuevas altas de prueba.


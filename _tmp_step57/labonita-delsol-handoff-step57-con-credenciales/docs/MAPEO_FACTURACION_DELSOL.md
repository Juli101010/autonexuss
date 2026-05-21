# Mapeo de facturación DELSOL para La Bonita

## Tablas principales

### `F_FAC` · Cabecera de factura

Campos confirmados relevantes:

```txt
TIPFAC   tipo/serie de factura
CODFAC   número de factura
REFFAC   referencia interna
FECFAC   fecha factura
CLIFAC   código cliente
CNOFAC   nombre cliente en factura
CNIFAC   NIF/CIF cliente
NET1FAC  neto principal
BAS1FAC  base imponible principal
PIVA1FAC porcentaje IVA principal
IIVA1FAC importe IVA principal
TOTFAC   total factura
ESTFAC   estado
EDRFAC   ejercicio
ALMFAC   almacén, se vio GEN
TRAFAC   transportista/valor auxiliar
USUFAC   usuario alta
USMFAC   usuario modificación
```

### `F_LFA` · Líneas de factura

Campos confirmados relevantes:

```txt
TIPLFA   tipo/serie, coincide con TIPFAC
CODLFA   número factura, coincide con CODFAC
POSLFA   posición de línea
ARTLFA   código artículo, puede ir vacío si se factura descripción libre
DESLFA   descripción de línea
CANLFA   cantidad
PRELFA   precio unitario
TOTLFA   total línea sin IVA
IVALFA   indicador/valor IVA de línea observado en 0
PIVLFA   porcentaje IVA de línea observado en 0
TIVLFA   tipo IVA línea observado en 0
DOCLFA   documento origen
EJELFA   ejercicio origen
```

## Relación cabecera/línea

```txt
F_FAC.TIPFAC = F_LFA.TIPLFA
F_FAC.CODFAC = F_LFA.CODLFA
```

## Mapeo desde La Bonita

| La Bonita | DELSOL | Observación |
|---|---|---|
| petición.id | auditoría interna | No necesariamente va a DELSOL |
| referencia petición | `REFFAC` | Ej. nombre evento/servicio |
| fecha factura | `FECFAC` | Fecha de aprobación/emisión |
| cliente DELSOL | `CLIFAC` | Debe existir o crearse/vincularse |
| nombre cliente | `CNOFAC` | Copiar desde `F_CLI` o formulario |
| NIF/CIF | `CNIFAC` | Validar antes de aprobar |
| importe base | `NET1FAC`, `BAS1FAC`, `TOTLFA` | Base sin IVA |
| IVA % | `PIVA1FAC` | Usado en cabecera |
| IVA importe | `IIVA1FAC` | base * IVA / 100 |
| total | `TOTFAC` | base + IVA |
| descripción servicio | `DESLFA` | Línea de factura |
| cantidad | `CANLFA` | Normalmente 1 |
| precio | `PRELFA` | Importe base |

## Numeración

Regla:

```sql
SELECT MAX(CODFAC) AS ultimaFactura FROM F_FAC WHERE TIPFAC = '1'
```

Luego:

```txt
nuevo CODFAC = ultimaFactura + 1
```

Esta consulta debe ejecutarse justo antes de escribir la factura, en backend, con bloqueo lógico/idempotencia para evitar duplicados.


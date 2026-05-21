# Nominasol / Laboral Readonly Discovery

Fecha: 2026-05-19T05:30:18.475Z
Ejercicio: 2026

No contiene credenciales, tokens ni datos personales. Es un laboratorio externo al sistema La Bonita.

## Entorno

- Login URL configurada: https://api.sdelsol.com/login/Autenticar
- Admin URL configurada: https://api.sdelsol.com/admin
- Credenciales presentes: si

## Hallazgos

### all_tables_count
- Estado: OK
- Filas: 1
- Columnas: total
- Muestra estructural:
```json
[
  {
    "total": 71
  }
]
```

### filtered_tables_information_schema
- Estado: OK
- Filas: 4
- Columnas: TABLE_NAME
- Muestra estructural:
```json
[
  {
    "TABLE_NAME": "F_CON"
  },
  {
    "TABLE_NAME": "F_EMP"
  },
  {
    "TABLE_NAME": "F_NOM"
  },
  {
    "TABLE_NAME": "F_TRA"
  }
]
```

### filtered_tables_sysobjects
- Estado: OK
- Filas: 4
- Columnas: name
- Muestra estructural:
```json
[
  {
    "name": "F_CON"
  },
  {
    "name": "F_EMP"
  },
  {
    "name": "F_NOM"
  },
  {
    "name": "F_TRA"
  }
]
```

### filtered_columns_information_schema
- Estado: OK
- Filas: 409
- Columnas: TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
- Muestra estructural:
```json
[
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "CODCON",
    "DATA_TYPE": "bigint",
    "ORDINAL_POSITION": 1
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "TRACON",
    "DATA_TYPE": "bigint",
    "ORDINAL_POSITION": 2
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "CCFCON",
    "DATA_TYPE": "bigint",
    "ORDINAL_POSITION": 3
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "FFOCON",
    "DATA_TYPE": "date",
    "ORDINAL_POSITION": 4
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "FPRCON",
    "DATA_TYPE": "date",
    "ORDINAL_POSITION": 5
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "FINCON",
    "DATA_TYPE": "date",
    "ORDINAL_POSITION": 6
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "FFICON",
    "DATA_TYPE": "date",
    "ORDINAL_POSITION": 7
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "NFOCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 8
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "DISCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 9
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "OCUCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 10
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "OFECON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 11
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "PEMCON",
    "DATA_TYPE": "int",
    "ORDINAL_POSITION": 12
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "OLECON",
    "DATA_TYPE": "int",
    "ORDINAL_POSITION": 13
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "TCRCON",
    "DATA_TYPE": "int",
    "ORDINAL_POSITION": 14
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "NOMCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 15
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "AP1CON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 16
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "AP2CON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 17
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "ETNCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 18
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "ETRCON",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 19
  },
  {
    "TABLE_NAME": "F_CON",
    "COLUMN_NAME": "ETPCON",
    "DATA_TYPE": "int",
    "ORDINAL_POSITION": 20
  }
]
```

### f_emp_columns
- Estado: OK
- Filas: 50
- Columnas: TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
- Muestra estructural:
```json
[
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "CODEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 1
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "NIFEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 2
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "DENEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 3
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "NOMEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 4
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "SIGEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 5
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "DOMEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 6
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "NUMEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 7
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "ESCEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 8
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "PISEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 9
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "PRTEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 10
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "POBEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 11
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "MUNEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 12
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "CPOEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 13
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "PROEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 14
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "TELEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 15
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "FAXEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 16
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "EJEEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 17
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "CLAEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 18
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "REGEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 19
  },
  {
    "TABLE_NAME": "F_EMP",
    "COLUMN_NAME": "TOMEMP",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 20
  }
]
```

### f_tra_columns
- Estado: OK
- Filas: 196
- Columnas: TABLE_NAME, COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
- Muestra estructural:
```json
[
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "CODTRA",
    "DATA_TYPE": "bigint",
    "ORDINAL_POSITION": 1
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "DNITRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 2
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "NSSTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 3
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "NOCTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 4
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "NOMTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 5
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "AP1TRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 6
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "AP2TRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 7
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "TC2TRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 8
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "SIGTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 9
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "DOMTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 10
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "NUMTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 11
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "BLQTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 12
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "ESCTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 13
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "PISTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 14
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "PRTTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 15
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "CPOTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 16
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "MUNTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 17
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "PROTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 18
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "CAUTRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 19
  },
  {
    "TABLE_NAME": "F_TRA",
    "COLUMN_NAME": "PAITRA",
    "DATA_TYPE": "varchar",
    "ORDINAL_POSITION": 20
  }
]
```

### nominas_columns
- Estado: OK
- Filas: 0

### trabajadores_columns
- Estado: OK
- Filas: 0

### counts_known_candidates
- Estado: OK
- Filas: 1
- Columnas: F_EMP, F_TRA
- Muestra estructural:
```json
[
  {
    "F_EMP": 1,
    "F_TRA": 1448
  }
]
```

### count_nominas_if_exists
- Estado: OK
- Filas: 0

### count_trabajadores_if_exists
- Estado: OK
- Filas: 0

## Conclusión Técnica

La base consultada expone tablas candidatas laborales/Nominasol. Se puede preparar un segundo paso con pruebas de lectura por entidad y mapeo campo a campo antes de escribir.

## Próxima Decisión

Elegir una tabla candidata de trabajadores/nominas, validar claves primarias por lectura y pedir confirmación antes de cualquier EscribirRegistro.

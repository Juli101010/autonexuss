# DelSol / Nominasol Discovery Readonly

Fecha: 2026-05-18T23:59:15.064Z
Modo: live
Live habilitado: si

Este reporte no contiene credenciales ni tokens. Solo guarda resultados de consultas de lectura para confirmar tablas/campos reales.

## Resultado

### information_schema_candidates
- Estado: OK
- Columnas detectadas: TABLE_NAME
- Filas muestra: 2
- Muestra sanitizada:
```json
[
  {
    "TABLE_NAME": "F_EMP"
  },
  {
    "TABLE_NAME": "F_TRA"
  }
]
```

### sysobjects_candidates
- Estado: OK
- Columnas detectadas: name
- Filas muestra: 2
- Muestra sanitizada:
```json
[
  {
    "name": "F_EMP"
  },
  {
    "name": "F_TRA"
  }
]
```

### sample_F_TRA
- Estado: OK
- Columnas detectadas: sin filas
- Filas muestra: 0

### sample_N_TRA
- Estado: OK
- Columnas detectadas: sin filas
- Filas muestra: 0

### sample_TRABAJADORES
- Estado: OK
- Columnas detectadas: sin filas
- Filas muestra: 0

### sample_NOMINAS
- Estado: OK
- Columnas detectadas: sin filas
- Filas muestra: 0

### sample_F_FAC
- Estado: OK
- Columnas detectadas: TIPFAC, CODFAC, REFFAC, FECFAC, ESTFAC, ALMFAC, AGEFAC, PROFAC, CLIFAC, CNOFAC, CDOFAC, CPOFAC, CCPFAC, CPRFAC, CNIFAC, TIVFAC, REQFAC, TELFAC, NET1FAC, NET2FAC, NET3FAC, PDTO1FAC, PDTO2FAC, PDTO3FAC, IDTO1FAC, IDTO2FAC, IDTO3FAC, PPPA1FAC, PPPA2FAC, PPPA3FAC, IPPA1FAC, IPPA2FAC, IPPA3FAC, PPOR1FAC, PPOR2FAC, PPOR3FAC, IPOR1FAC, IPOR2FAC, IPOR3FAC, PFIN1FAC, PFIN2FAC, PFIN3FAC, IFIN1FAC, IFIN2FAC, IFIN3FAC, BAS1FAC, BAS2FAC, BAS3FAC, PIVA1FAC, PIVA2FAC, PIVA3FAC, IIVA1FAC, IIVA2FAC, IIVA3FAC, PREC1FAC, PREC2FAC, PREC3FAC, IREC1FAC, IREC2FAC, IREC3FAC, PRET1FAC, IRET1FAC, TOTFAC, FOPFAC, PRTFAC, TPOFAC, OB1FAC, OB2FAC, TDRFAC, CDRFAC, OBRFAC, REPFAC, EMBFAC, AATFAC, REAFAC, PEDFAC, FPEFAC, COBFAC, CREFAC, TIRFAC, CORFAC, COPFAC, TRAFAC, VENFAC, PRIFAC, ASOFAC, IMPFAC, CBAFAC, HORFAC, COMFAC, USUFAC, USMFAC, FAXFAC, IMGFAC, EFEFAC, CAMFAC, TRNFAC, CISFAC, TRCFAC, NET4FAC, PDTO4FAC, IDTO4FAC, PPPA4FAC, IPPA4FAC, PPOR4FAC, IPOR4FAC, PFIN4FAC, IFIN4FAC, BAS4FAC, EMAFAC, PASFAC, TPDFAC, TIDFAC, A1KFAC, CEMFAC, CPAFAC, BNOFAC, BENFAC, BOFFAC, BDCFAC, BNUFAC, TIVA1FAC, TIVA2FAC, TIVA3FAC, RCCFAC, BIBFAC, BICFAC, EFSFAC, EFVFAC, CIEFAC, GFEFAC, TIFFAC, TPVIDFAC, TERFAC, TFIFAC, TFAFAC, TREFAC, CVIFAC, DEPFAC, FROFAC, NASFAC, EDRFAC, DEMFAC, FUMFAC, ITBFAC, STBFAC, DECFAC, SDCFAC, TRZFAC, EERFAC, TRVFAC, TOVFAC, TVEFAC, BTFFAC, BCFFAC, BCOFAC, BCEFAC, BNEFAC, BCSFAC, BTDFAC, BRTFAC, WHAFAC, DVFFAC, RDRFAC, CIDFAC, PDFFAC, PRDFAC
- Filas muestra: 1

### sample_F_LFA
- Estado: OK
- Columnas detectadas: TIPLFA, CODLFA, POSLFA, ARTLFA, DESLFA, CANLFA, DT1LFA, DT2LFA, DT3LFA, PRELFA, TOTLFA, IVALFA, DOCLFA, DTPLFA, DCOLFA, COSLFA, BULLFA, COMLFA, MEMLFA, EJELFA, ALTLFA, ANCLFA, FONLFA, FFALFA, FCOLFA, IINLFA, PIVLFA, TIVLFA, FIMLFA, CE1LFA, CE2LFA, IMALFA, SUMLFA, NIMLFA, TCOLFA, RTILFA
- Filas muestra: 1

## Criterio operacional

- Facturacion: se puede marcar como DelSol synced solo si la cola devuelve OK y guarda codigo externo.
- Nomina: no se marca como Nominasol oficial si no aparece una tabla/campo laboral confirmado.
- Si DelSol no expone catalogo, se conserva nomina interna/PDF/liquidacion y queda pendiente mapeo Nominasol oficial.

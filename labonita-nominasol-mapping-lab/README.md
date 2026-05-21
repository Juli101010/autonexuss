# Laboratorio externo Nominasol / DelSol laboral

Este laboratorio queda fuera del sistema La Bonita. Su objetivo es descubrir, sin escritura y sin exponer credenciales, si las credenciales entregadas permiten mapear Nominasol real.

## Regla de seguridad

- No se imprime ningun secreto.
- No se ejecuta `EscribirRegistro`.
- No se modifica La Bonita.
- No se marca nomina como oficial si no hay tabla/campo Nominasol confirmado.

## Scripts

```powershell
node nominasol-readonly-discovery.js
node nominasol-compare-envs.js
```

## Resultado actual

Se probaron 4 entornos/paquetes de credenciales comerciales y luego la base Nominasol indicada por el cliente.

En las bases comerciales solo aparecian candidatas auxiliares:

```txt
F_EMP
F_RET
F_SAL
F_TRA
```

En la base laboral quedaron confirmadas tablas laborales/Nominasol:

```txt
F_EMP  empresa
F_TRA  trabajadores
F_CON  contratos
F_NOM  nominas
```

## Decision

Con la base laboral ya hay mapeo inicial suficiente para preparar integracion laboral, pero todavia no se debe escribir en Nominasol desde La Bonita hasta validar los campos obligatorios y una prueba controlada con registro reservado.

La Bonita puede mantener:

- nomina interna PDF;
- liquidacion interna;
- cola DelSol de liquidation/payment;
- estado laboral sincronizado;
- lectura Nominasol de trabajadores, contratos y nominas.

Pero todavia no debe afirmar:

- alta/baja real Nominasol escrita por La Bonita;
- comunicacion oficial Seguridad Social;
- calculo legal de nomina desde Nominasol.

## Para cerrar el 10/10

Hace falta ejecutar una prueba controlada por fuera del sistema:

1. Validar campos obligatorios de `F_TRA`, `F_CON` y `F_NOM`.
2. Leer una entidad de prueba o vacia.
3. Confirmacion humana.
4. Escritura controlada con codigo reservado.
5. Lectura posterior.
6. Borrado, anulacion o marcado seguro confirmado.
7. Recien entonces integracion en La Bonita.

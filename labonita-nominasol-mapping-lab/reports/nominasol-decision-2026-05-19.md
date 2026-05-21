# Decision Tecnica Nominasol

Fecha: 2026-05-19

Este documento esta sanitizado. No contiene credenciales, tokens, codigos de cliente, codigos de fabricante ni contrasenas.

## Resultado

La base laboral indicada por el cliente responde correctamente por API en modo solo lectura.

Tablas confirmadas:

| Tabla | Lectura funcional | Filas | Columnas |
|---|---|---:|---:|
| F_EMP | empresa | 1 | 50 |
| F_TRA | trabajadores | 1448 | 196 |
| F_CON | contratos | 16774 | 134 |
| F_NOM | nominas | 260 | 29 |

Relaciones inferidas con buena base tecnica:

| Relacion | Uso probable |
|---|---|
| F_CON.TRACON -> F_TRA.CODTRA | contrato pertenece a trabajador |
| F_NOM.TRANOM -> F_TRA.CODTRA | nomina pertenece a trabajador |
| F_NOM.CODNOM | identificador de nomina |
| F_CON.CODCON | identificador de contrato |
| F_TRA.CODTRA | identificador de trabajador |

## Decision

Ya no corresponde decir que no hay Nominasol. Si hay tablas laborales reales.

Lo correcto es:

- preparar integracion de lectura Nominasol;
- mapear trabajador, contrato y nomina contra `F_TRA`, `F_CON` y `F_NOM`;
- mantener escritura deshabilitada hasta completar prueba controlada por fuera del sistema.

No se recomienda todavia escribir altas, bajas o nominas desde La Bonita hasta validar:

- campos obligatorios minimos;
- codigos/catologos auxiliares requeridos por contrato;
- endpoint valido de escritura;
- lectura posterior del registro creado;
- estrategia segura de anulacion/borrado o registro reservado.

## Proxima Prueba Controlada

1. Elegir un trabajador de prueba o crear un codigo reservado autorizado.
2. Leer `F_TRA`, `F_CON` y `F_NOM` filtrando por ese codigo.
3. Confirmar campos obligatorios con documentacion o con plantilla de registro real.
4. Ejecutar una escritura controlada fuera de La Bonita.
5. Leer de vuelta el registro.
6. Anular/borrar si el API lo permite, o marcarlo claramente como prueba.
7. Solo despues integrar en la cola laboral de La Bonita.

## Estado Para La Bonita

Facturacion puede seguir con su cola DelSol ya probada.

Laboral/Nomina debe pasar a estado:

`Mapeo Nominasol confirmado en lectura; escritura pendiente de prueba controlada`.

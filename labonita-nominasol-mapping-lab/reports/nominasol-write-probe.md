# Nominasol Write Probe (Controlado)

Fecha: 2026-05-19T10:59:53.846Z
Base: .env.ns006.local

Prueba controlada: solo `ActualizarRegistro` sobre una fila existente, reenviando valores equivalentes de claves/campos minimos para confirmar permiso de escritura por tabla.

## Resultado por tabla

### F_TRA
- Lectura: OK
- Escritura (update controlado): OK
- Clave usada: `{"CODTRA":50006}`

### F_CON
- Lectura: OK
- Escritura (update controlado): OK
- Clave usada: `{"CODCON":456}`

### F_NOM
- Lectura: ERROR
- Escritura (update controlado): ERROR
- Error: F_NOM sin filas para prueba controlada

## Conclusión

Escritura parcial confirmada. Se requiere ajuste por tabla antes de activar integración completa.

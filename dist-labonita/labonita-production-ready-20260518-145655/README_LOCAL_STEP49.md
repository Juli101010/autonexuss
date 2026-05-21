# La Bonita - step49 planillas reales + UI mejorada

Esta versión mejora el step48 con dos correcciones centrales:

1. El login fue rediseñado para acercarse al estilo aprobado del demo: limpio, profesional, logo contenido y sin imágenes gigantes.
2. El panel `labonita-operativo.html` ahora crea peticiones desde las planillas reales enviadas por La Bonita.

## Planillas incorporadas

Quedaron incorporadas como referencia dentro de `backend/public/templates/`:

- `peticion-alta-factura-puntual.pdf`
- `formulario-servicio-puntual.pdf`
- `peticion-contrato-formacion.pdf`
- `formulario-inscripcion-persona-asociada.pdf`

El formulario operativo reproduce sus campos principales para que una petición no sea un alta vacía.

## Flujo de prueba

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Entrar a:

```txt
http://localhost:3001/login.html
```

Usuario local:

```txt
admin@test.com
123456
```

Luego abrir:

```txt
http://localhost:3001/labonita-operativo.html
```

## Qué probar

1. Elegir una planilla: Alta + Factura, Servicio Puntual, Contrato Formación o Persona Asociada.
2. Completar obligatorios o usar `Rellenar demo`.
3. Guardar la petición.
4. Seleccionar la petición creada.
5. Revisar que el detalle muestre los datos de planilla.
6. Crear factura interna.
7. Crear contrato.
8. Agregar gasto.
9. Crear liquidación.
10. Revisar Control Total.
11. Revisar cola DELSOL.

## DELSOL

DELSOL sigue desacoplado. Esta versión no depende de escritura real.

- Lectura: preparada.
- Escritura: bloqueada hasta que la clienta habilite permisos y confirme tablas.
- Ejercicio: 2026 por defecto.
- Facturas reales fiscales: no se numeran hasta confirmación externa.

## Decisión técnica importante

La Bonita guarda primero toda la información propia del Mapa de Peticiones. DELSOL se usa luego como destino de sincronización, no como base principal del sistema.

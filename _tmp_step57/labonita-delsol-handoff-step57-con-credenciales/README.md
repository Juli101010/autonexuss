# PAQUETE STEP57 · CON CREDENCIALES REALES INCLUIDAS

Este ZIP trae las credenciales reales en `.env.delsol.local` para que los scripts ejecuten llamados contra DELSOL sin copiar archivos adicionales. Usar solo localmente. No subir a GitHub.

Regla técnica definida: pedir token nuevo en cada operación crítica contra DELSOL.

---

# La Bonita · Informe y kit de integración DELSOL STEP56

Este ZIP deja ordenado lo que ya se probó con la API de Software DELSOL y lo que falta para cerrar las pruebas de facturación en La Bonita.

## Estado rápido

- Autenticación correcta: `POST https://api.sdelsol.com/login/Autenticar`.
- Regla decidida: **pedir token nuevo en cada operación crítica**.
- Base probada: `FS006`, ejercicio `2026`.
- Tablas centrales confirmadas:
  - `F_CLI`: clientes.
  - `F_ART`: artículos/conceptos.
  - `F_FAC`: cabecera de facturas.
  - `F_LFA`: líneas de facturas.
  - `F_COB`: cobros.
  - `F_PRE`: presupuestos.
- Lectura de factura real confirmada: factura `207`.
- Escritura confirmada en facturación: `F_FAC` y `F_LFA` respondieron `OK` en actualización y alta.
- Prueba de alta: se creó factura de prueba `208` con línea `208`.
- Pendiente urgente: confirmar borrado de la factura de prueba `208`. El endpoint `/admin/BorrarRegistro` devolvió `404`; hay que probar variantes o confirmar URL exacta en Postman/Kiki.

## Archivos principales

- `docs/INFORME_API_DELSOL_LA_BONITA.md`: informe completo para pasar al equipo.
- `docs/MAPEO_FACTURACION_DELSOL.md`: tablas y campos confirmados.
- `docs/REGLAS_TOKEN_Y_SEGURIDAD.md`: regla de token nuevo por operación y seguridad.
- `docs/PLAN_PRUEBAS_PARA_TERMINAR.md`: pasos para terminar las pruebas.
- `docs/ESTADO_FACTURA_208_PRUEBA.md`: alerta sobre la factura de prueba creada.
- `scripts/delsol-client.cjs`: cliente base Node/CommonJS, con token fresco por operación.
- `scripts/verificar-factura-208.cjs`: verifica si la factura/línea 208 existe.
- `scripts/borrar-factura-208-smart.cjs`: intenta borrar 208 probando variantes de endpoint.
- `scripts/crear-factura-prueba-confirmada.cjs`: script de alta controlada, bloqueado por variable `CONFIRMAR_CREACION=SI`.
- `config/.env.delsol.example`: plantilla de variables, sin credenciales reales.
- `postman/labonita-delsol-step56.postman_collection.json`: colección de Postman con endpoints principales.

## Uso local recomendado

1. Copiar `config/.env.delsol.example` como `.env.delsol.local` en la raíz del kit o del proyecto.
2. Completar las credenciales reales localmente. No subirlas a GitHub.
3. Ejecutar:

```powershell
node .\scripts\verificar-factura-208.cjs
```

4. Si la 208 existe, intentar limpieza:

```powershell
node .\scripts\borrar-factura-208-smart.cjs
```

5. Si el borrado sigue fallando por 404, pedir a Kiki/export de Postman la URL exacta de borrado usada para `F_ACT`.

## Regla obligatoria para la app

Cada operación DELSOL debe autenticar de nuevo. No usar token fijo, no guardar token en frontend, no exponer credenciales en el navegador.


# La Bonita · Step52 · Modo tutorial + plan de prueba local

Esta versión suma un modo tutorial opcional para administración y usuario/artista, más una pantalla de checklist para probar el sistema antes de subirlo.

## Cómo iniciar localmente

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Abrir:

- Login: http://localhost:3001/login.html
- Panel admin: http://localhost:3001/labonita-operativo.html
- Portal usuario/artista: http://localhost:3001/artist-operativo.html
- Plan de prueba: http://localhost:3001/tutorial-test-plan.html

Usuarios de prueba:

- Admin: `admin@test.com` / `123456`
- Artista: `artist@test.com` / `123456`

## Qué se agregó

### Modo tutorial admin

Botón visible: **🧭 Modo tutorial**

Recorre:

1. identidad del panel;
2. dashboard;
3. Mapa de Peticiones;
4. nueva petición desde planilla;
5. completitud de obligatorios;
6. guardar borrador;
7. enviar a revisión;
8. listado de peticiones;
9. detalle, validación, observación y rechazo;
10. acciones posteriores: factura, contrato, gastos, liquidación y control;
11. DELSOL desacoplado;
12. exportaciones y prueba.

### Modo tutorial usuario/artista

Botón visible: **🧭 Modo tutorial**

Recorre:

1. portal de usuario;
2. selección de planilla;
3. control de completitud;
4. documentos fuente;
5. carga de datos;
6. guardar borrador;
7. enviar a revisión;
8. listado propio;
9. detalle, mensajes y descarga;
10. PDF completado.

### Plan de prueba

Pantalla nueva:

```txt
/tutorial-test-plan.html
```

Incluye checklist persistente en el navegador para validar:

- arranque local;
- login admin y usuario;
- planillas con faltantes;
- envío a revisión;
- observación/rechazo con mensaje;
- aprobación solo con datos completos;
- descarga de PDF;
- factura interna;
- control total;
- DELSOL mock/desacoplado;
- seguridad mínima antes de subir.

## Regla funcional que se mantiene

- Sin planilla no hay petición válida.
- Sin datos completos no hay aprobación.
- Sin aprobación admin no hay factura interna final.
- Sin confirmación de DELSOL no hay factura fiscal.
- La numeración fiscal no la genera La Bonita: debe salir de DELSOL.
- La Bonita genera número interno de borrador y guarda el número fiscal externo recién cuando DELSOL lo confirme.

## Pendientes antes de producción final

1. Confirmar tablas de factura cabecera, líneas, conceptos/artículos y cobros en DELSOL Facturación.
2. Probar alta real de factura en DELSOL sin forzar numeración fiscal.
3. Leer la factura creada y guardar número externo confirmado.
4. Revisar permisos reales por rol en servidor.
5. Pasar a base productiva, idealmente PostgreSQL.
6. Configurar HTTPS, backups y secretos reales en `.env` del servidor.

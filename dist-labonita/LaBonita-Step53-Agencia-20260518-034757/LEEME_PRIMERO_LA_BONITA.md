# La Bonita - entrega organizada para agencia

Esta carpeta contiene el sistema La Bonita en estado Step53 Agencia: el codigo operativo base, las planillas reales, el demo, el contrato revisado y la documentacion necesaria para seguir terminando el producto sin perder el mapa general.

## Como esta organizado

- `backend/`: sistema principal La Bonita, con login, portal artista, panel administracion, Mapa de Peticiones, planillas, documentos, controles, cola DELSOL mock y PDFs internos.
- `billing-service/`: servicio standalone de facturacion/liquidaciones, preparado para integrarse o seguir separado.
- `entrega-labonita-agencia/`: carpeta de entrega para entender el proyecto, mostrarlo, probarlo y continuar el desarrollo.
- `MAPA_PETICIONES_FUENTE_DE_VERDAD.md`: documento base del flujo operativo.
- `SECURITY.md`: resumen de seguridad actual y pendientes.

## Inicio rapido

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Abrir:

- Login: http://localhost:3001/login.html
- Panel admin: http://localhost:3001/labonita-operativo.html
- Portal artista: http://localhost:3001/artist-operativo.html
- Plan de prueba: http://localhost:3001/tutorial-test-plan.html

Usuarios demo:

- Admin: `admin@test.com` / `123456`
- Artista: `artist@test.com` / `123456`

## Que mirar primero

1. `entrega-labonita-agencia/00-leer-primero/README_ENTREGA.md`
2. `entrega-labonita-agencia/01-contrato/CUMPLIMIENTO_CONTRATO.md`
3. `entrega-labonita-agencia/02-mapa-peticiones/MAPA_OPERATIVO_RESUMIDO.md`
4. `entrega-labonita-agencia/05-api-y-pruebas/MAPA_API_Y_PRUEBAS.md`
5. `entrega-labonita-agencia/07-contabilidad-agencia/PREGUNTAS_ECONOMICAS_Y_EQUIPO.md`

## Estado real

La Bonita ya tiene una base funcional para demo y validacion local. Antes de produccion faltan decisiones externas: permisos reales DELSOL, VPS/HTTPS/backups, datos fiscales reales, definicion final de mantenimiento y aprobacion de flujo por LaBonita.


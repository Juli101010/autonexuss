# Como mostrar el demo

## Opcion recomendada: sistema local

```powershell
cd backend
copy .env.example .env
npm install
npm start
```

Abrir:

- Login: http://localhost:3001/login.html
- Admin: http://localhost:3001/labonita-operativo.html
- Artista: http://localhost:3001/artist-operativo.html
- Checklist: http://localhost:3001/tutorial-test-plan.html

## Usuarios demo

- Admin: `admin@test.com` / `123456`
- Artista: `artist@test.com` / `123456`

## Guion corto para cliente

1. Entrar como artista.
2. Crear una peticion.
3. Guardarla incompleta y mostrar checklist.
4. Enviar a revision.
5. Entrar como admin.
6. Observar la peticion con mensaje.
7. Volver como artista y corregir.
8. Validar como admin.
9. Descargar PDF completado.
10. Preparar factura interna y ver cola DELSOL.

## Archivos incluidos

- `tutorial-test-plan.html`: checklist persistente de prueba local.
- `labonita-demo-referencia.html`: demo visual de referencia, si estaba disponible en Descargas.


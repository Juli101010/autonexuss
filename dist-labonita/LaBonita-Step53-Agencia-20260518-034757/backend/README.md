# La Bonita Backend

## Inicio rápido

```bash
cp .env.example .env
npm install
npm start
```

Usuarios demo:

```txt
admin@test.com / 123456
artist@test.com / 123456
```

Panel operativo:

```txt
http://localhost:3001/labonita-operativo.html
```

## DELSOL

La integración DELSOL queda desacoplada. Por defecto:

```env
DELSOL_MODE=mock
DELSOL_DEFAULT_EJERCICIO=2026
DELSOL_WRITE_ENABLED=0
```

Esto permite construir y probar todo el sistema sin depender del permiso de escritura de DELSOL. Las operaciones quedan en `delsol_sync_queue`.

Para activar escritura real cuando DELSOL lo permita:

```env
DELSOL_MODE=live
DELSOL_WRITE_ENABLED=1
DELSOL_BASE_URL=...
DELSOL_API_KEY=...
```

Nunca poner tokens DELSOL en frontend.

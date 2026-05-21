# Seguridad (resumen)

## Autenticación
- Sesión por **JWT** firmado con `JWT_SECRET` (env) y expiración `7d`.
- El token se entrega y mantiene en **cookie HttpOnly** (`token`) con `SameSite=Lax` y `Secure` en producción.

## Autorización (roles)
- Middleware `src/modules/auth/auth.middleware.js` valida:
  - usuario logueado (token)
  - rol (`ADMIN` / `ARTIST`) cuando aplica
- Endpoints críticos están protegidos por `requireAdmin` / `requireArtist`.

## Frontend (acceso a páginas)
- Se añadió guard en páginas protegidas:
  - redirecciona a `/login.html` si `GET /api/auth/me` devuelve 401.
- Objetivo: nadie navega a pantallas sin sesión.

## Base de datos
- SQLite local: acceso solo en servidor.
- Queries parametrizadas (`?`) para prevenir SQL injection.
- Passwords: **bcrypt** (cost 12) en `users.password`.

## Archivos y documentos
- Subida controlada por endpoints autenticados.
- Documentos oficiales quedan registrados en tabla `documents` con auditoría.

## Recomendaciones producción (pendientes)
- `JWT_SECRET` fuerte y único en env.
- Rate limiting en `/auth/login`.
- CSP/Headers (helmet) + HSTS.
- Backups + cifrado de disco del servidor.

# Deploy local seguro para `labonita.coop`

Objetivo: publicar esta instancia local para pruebas de cliente sin exponer datos internos de la agencia.

## 1) Variables recomendadas para modo prueba

Backend (`backend/.env`):

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<secreto-fuerte>
ALLOW_PUBLIC_REGISTER=0

DELSOL_MODE=live
DELSOL_WRITE_ENABLED=0
DELSOL_LOGIN_URL=https://api.sdelsol.com/login/Autenticar
DELSOL_ADMIN_URL=https://api.sdelsol.com/admin
DELSOL_CODIGO_FABRICANTE=<real>
DELSOL_CODIGO_CLIENTE=<real>
DELSOL_BASE_DATOS=<real>
DELSOL_PASSWORD=<real>

BILLING_BASE_URL=http://127.0.0.1:3011
BILLING_INTERNAL_KEY=<secreto-fuerte>
```

Billing (`billing-service/.env`):

```env
PORT=3011
JWT_SECRET=<secreto-fuerte>
INTERNAL_KEY=<mismo BILLING_INTERNAL_KEY del backend>
```

## 2) Arranque local

Terminal 1:

```powershell
cd "C:\Users\Julian\OneDrive\Documentos\New project\labonita-step53-agencia\billing-service"
npm start
```

Terminal 2:

```powershell
cd "C:\Users\Julian\OneDrive\Documentos\New project\labonita-step53-agencia\backend"
npm start
```

Verificación:

```powershell
curl http://127.0.0.1:3001/login.html
```

## 3) Exponer por dominio (opción recomendada: Cloudflare Tunnel)

Requiere que `labonita.coop` esté gestionado en Cloudflare DNS.

1. Instalar cloudflared:

```powershell
winget install Cloudflare.cloudflared
```

2. Login y creación del túnel:

```powershell
cloudflared tunnel login
cloudflared tunnel create labonita-local
```

3. Crear DNS del subdominio de demo:

```powershell
cloudflared tunnel route dns labonita-local demo.labonita.coop
```

4. Ejecutar túnel:

```powershell
cloudflared tunnel run --url http://127.0.0.1:3001 labonita-local
```

5. Resultado esperado:
- `https://demo.labonita.coop` apunta a la instancia local.

## 4) Seguridad mínima obligatoria para demo cliente

1. Activar Cloudflare Access sobre `demo.labonita.coop` (OTP por email o allowlist).
2. Mantener `DELSOL_WRITE_ENABLED=0` durante demo.
3. No exponer `.env`, `.sqlite`, ni logs con payloads sensibles.
4. Rotar `JWT_SECRET` e `INTERNAL_KEY` antes de pasar a productivo real.

## 5) Checklist final antes de mostrar al cliente

1. `backend`: `npm test`
2. Login admin y artista OK.
3. Crear factura interna en modo local OK.
4. `/api/admin/delsol/status` responde `mode=live` y `write_enabled=false` para demo segura.
5. URL pública `https://demo.labonita.coop` solicita control de acceso.

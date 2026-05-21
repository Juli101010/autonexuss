# Deploy VPS para labonita.coop

Guia para subir La Bonita al servidor `46.224.27.229` sin exponer archivos internos de agencia ni credenciales en el paquete.

## 1. DNS del dominio

En el panel DNS de `labonita.coop`:

```txt
A     @      46.224.27.229
A     www    46.224.27.229
```

TTL recomendado durante pruebas: 300 segundos.

## 2. Subida del paquete

El ZIP generado no contiene `backend/.env`.

Desde PowerShell local:

```powershell
scp "C:\Users\Julian\OneDrive\Documentos\New project\dist-labonita\labonita-production-ready-20260518-103557.zip" root@46.224.27.229:/opt/labonita-release.zip
```

Luego entrar al servidor:

```bash
ssh root@46.224.27.229
```

## 3. Preparar servidor

```bash
apt update
apt install -y nginx unzip curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
mkdir -p /opt/labonita
unzip -o /opt/labonita-release.zip -d /opt/labonita
```

## 4. Variables privadas

Crear el archivo real en el servidor:

```bash
cd /opt/labonita/backend
cp .env.example .env
nano .env
```

Valores minimos:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<secreto-fuerte>
ALLOW_PUBLIC_REGISTER=1

DELSOL_MODE=live
DELSOL_WRITE_ENABLED=1
DELSOL_DEFAULT_EJERCICIO=2026
DELSOL_LOGIN_URL=https://api.sdelsol.com/login/Autenticar
DELSOL_ADMIN_URL=<url-admin-delsol>
DELSOL_CODIGO_FABRICANTE=<real>
DELSOL_CODIGO_CLIENTE=<real>
DELSOL_BASE_DATOS=<real>
DELSOL_PASSWORD=<real>

BILLING_BASE_URL=http://127.0.0.1:3011
BILLING_INTERNAL_KEY=<secreto-fuerte>
```

Si se usa `billing-service`, crear tambien `/opt/labonita/billing-service/.env` con el mismo `INTERNAL_KEY`.

## 5. Instalar y levantar

```bash
cd /opt/labonita/backend
npm ci --omit=dev
SMOKE_EXPECT_DELSOL_MODE=live npm test
pm2 start server.js --name labonita-backend --cwd /opt/labonita/backend
pm2 save
```

Opcional para billing:

```bash
cd /opt/labonita/billing-service
npm ci --omit=dev
pm2 start server.js --name labonita-billing --cwd /opt/labonita/billing-service
pm2 save
```

## 6. Nginx

Crear `/etc/nginx/sites-available/labonita.coop`:

```nginx
server {
  listen 80;
  server_name labonita.coop www.labonita.coop;

  client_max_body_size 25m;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Activar:

```bash
ln -sf /etc/nginx/sites-available/labonita.coop /etc/nginx/sites-enabled/labonita.coop
nginx -t
systemctl reload nginx
```

## 7. HTTPS

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d labonita.coop -d www.labonita.coop
```

## 8. Verificacion final

```bash
curl -I https://labonita.coop/login.html
curl https://labonita.coop/api/health
pm2 logs labonita-backend --lines 80
```

En la app:

1. Crear usuario desde `/register.html`.
2. Entrar como usuario y crear una peticion.
3. Entrar como admin, validar peticion, preparar laboral, crear factura interna y procesar DelSol.
4. Revisar `/app.html#/delsol`: la cola debe mostrar `synced` o errores reprocesables por item.

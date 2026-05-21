# LaBonita Billing Service (Standalone)

Servicio standalone de facturación y liquidaciones para artistas.
- Emisor fijo: LaBonita (config en .env)
- Facturas: DRAFT -> ISSUED (numeración/serie) -> SENT -> PAID
- Liquidación: comisión + reparto artistas + IRPF por artista + neto
- Reminders: genera emails en outbox (sin SMTP)
- Preparado para DelSol: outbox + links (sin integración real)

## Run
```bash
npm install
cp .env.example .env
npm run bootstrap-admin -- admin@demo.com Password123!
npm start
```

UI: http://localhost:3010/login.html

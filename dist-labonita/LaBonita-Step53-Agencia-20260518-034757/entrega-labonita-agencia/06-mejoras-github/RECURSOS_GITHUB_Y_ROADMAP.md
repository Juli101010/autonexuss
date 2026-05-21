# Recursos GitHub y roadmap tecnico

No se instalo ninguna dependencia nueva en esta entrega. Esta lista sirve para guiar la mejora del producto sin romper el MVP actual.

## Matriz de herramientas

| Herramienta | Origen | Uso en La Bonita | Prioridad | Instalar ahora | Motivo | Riesgo | Requiere adaptacion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SurveyJS | https://github.com/surveyjs/survey-library | Formularios dinamicos JSON, multi-paso y validaciones | Alta futura | No | Sirve para versionar planillas sin hardcodear UI | Migracion de schemas y UI | Si |
| Form.io / formio.js | https://github.com/formio/formio.js | Alternativa de builder/render JSON Schema | Alta futura | No | Puede generar formularios administrables | Mayor superficie y dependencia | Si |
| pdf-lib | https://github.com/Hopding/pdf-lib | Completar/aplanar PDFs reales | Alta | No | El sistema ya usa PDFKit; pdf-lib serviria para escribir sobre PDFs oficiales | Mapear campos PDF reales lleva trabajo | Si |
| BullMQ | https://github.com/taskforcesh/bullmq | Cola DELSOL con reintentos, workers y Redis | Alta produccion | No | Mejor que cola SQLite si hay procesos reales/reintentos | Requiere Redis e infraestructura | Si |
| CASL | https://github.com/stalniy/casl | Permisos finos backend/frontend | Media/Alta | No | Roles por recurso, propietario y accion | Refactor de autorizacion | Si |
| Shepherd.js | https://github.com/shipshapecode/shepherd | Tutorial guiado profesional | Media | No | Mejoraria onboarding admin/artista | Dependencia frontend y estilos | Baja |
| Playwright | https://github.com/microsoft/playwright | Pruebas E2E login/peticiones/factura | Alta | No | Evita romper flujos antes de subir | Requiere instalar browsers/CI | Si |
| OWASP CheatSheetSeries | https://github.com/OWASP/CheatSheetSeries | Checklist seguridad Node/web | Alta | No aplica | Guia de hardening, headers, validacion, cookies, dependencias | Ninguno si se usa como guia | No |
| Bemi Prisma | https://github.com/BemiHQ/bemi-prisma | Auditoria automatica si se migra a PostgreSQL + Prisma | Media futura | No | Audit trail fuerte para compliance | Requiere PostgreSQL/Prisma | Si |

## Orden recomendado

1. Cerrar MVP actual con pruebas manuales y aprobacion de LaBonita.
2. Agregar Playwright para flujo critico.
3. Mejorar PDFs reales con pdf-lib si los PDF oficiales tienen campos o coordenadas estables.
4. Pasar permisos a una capa mas fina tipo CASL o middleware propio equivalente.
5. Migrar cola DELSOL a BullMQ solo cuando haya Redis/VPS y escritura real.
6. Evaluar SurveyJS/Form.io cuando las planillas cambien seguido y LaBonita necesite administrarlas sin tocar codigo.

## Fuentes revisadas

- SurveyJS indica soporte para formularios JSON dinamicos, multi-page y frameworks como React/Angular/Vue.
- Form.io/formio.js renderiza formularios JSON producidos por su builder.
- pdf-lib permite crear/modificar PDFs y trabajar con formularios.
- BullMQ es una cola basada en Redis para jobs y procesamiento.
- CASL permite restringir acciones segun recursos y usuario.
- Shepherd permite recorridos guiados/onboarding.
- OWASP NodeJS Security Cheat Sheet recomienda validacion, logs, cookies, headers, controles contra fuerza bruta y npm audit.
- Bemi Prisma requiere PostgreSQL + Prisma y sirve para auditoria automatica de cambios.


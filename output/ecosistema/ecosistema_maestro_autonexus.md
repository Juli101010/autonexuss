# Ecosistema Maestro Autonexus OS

## Estado

Curaduría operativa inicial.

Este documento no instala todo de golpe. Ordena qué entra al sistema, qué queda activo ahora, qué queda preparado para después y qué se descarta por rendimiento en esta PC.

## Criterio principal

Autonexus OS debe funcionar gratis o con el menor costo posible, priorizando una PC con 8 GB RAM.

## Base estable actual

- DeepSeek local por Ollama.
- Autonexus Master.
- scripts PowerShell.
- tareas en TASKS.md.
- eventos en graph/events.json.
- panel HTML local.
- GitHub como memoria y versionado.
- comando simple scripts/pedir_autonexus.ps1.

## Componentes curados

### 1. Ruflo / Claude Flow

No se instala completo ahora.

Se toma la idea central:

- enjambre de agentes;
- memoria compartida;
- coordinación por tareas;
- agentes especializados;
- aprendizaje por eventos;
- trazabilidad;
- consenso o revisión antes de cambios importantes.

Aplicación en Autonexus:

- catálogo propio de agentes;
- eventos propios;
- orquestador propio;
- panel propio;
- permisos de Dirección.

### 2. Claude Code skills / subagentes

Estado: preparado, no activo como ruta principal en esta PC.

Motivo:

Claude Code funciona, pero los modelos locales con tools fueron pesados o inestables. DeepSeek no soporta tools para Claude Code. Qwen 3.5 4B saturó la máquina.

Aplicación en Autonexus:

- crear estructura .claude/agents;
- crear estructura .claude/skills;
- mantener compatibilidad futura;
- no depender de Claude Code local por ahora.

### 3. Hooks

Estado: sí entra como núcleo conceptual.

Hooks necesarios:

- antes de ejecutar;
- después de ejecutar;
- antes de modificar archivos;
- antes de commit;
- después de QA;
- antes de activar automatizaciones;
- antes de modo YOLO.

Aplicación:

- policy JSON;
- aprobación de Dirección;
- bloqueo de tareas de riesgo;
- logs de aprendizaje.

### 4. n8n MCP

Estado: preparado para fase posterior.

Uso esperado:

- diseñar workflows;
- documentar automatizaciones;
- conectar formularios, CRM, emails, webhooks y tareas;
- exponer workflows controlados como herramientas.

No se activa todavía porque requiere instalación/configuración aparte.

### 5. Playwright / Browser Agent

Estado: recomendado para siguiente fase técnica.

Uso esperado:

- probar paneles;
- navegar prototipos web;
- revisar sitios de clientes;
- hacer QA visual;
- automatizar pruebas.

Debe instalarse liviano y solo cuando haya Node.js listo.

### 6. Grafo visual / Graphify alternativo

Estado: entra como prioridad visual.

Objetivo:

- ver agentes;
- ver rutas;
- ver tareas;
- ver eventos;
- ver entregables;
- ver relaciones entre proyectos;
- mostrar la agencia como sistema vivo.

Implementación liviana:

- HTML local;
- JSON graph/events.json;
- nodos por tipo;
- colores por agente/ruta/riesgo;
- sin motor 3D pesado al inicio.

### 7. Segundo cerebro

Estado: entra como núcleo.

Componentes:

- documentos Markdown;
- registros JSON;
- tareas;
- eventos;
- decisiones;
- aprendizajes;
- entregables;
- memoria de proyectos.

No usar base vectorial todavía. Primero ordenar archivos y metadatos.

### 8. PDF / XLS / DOCX

Estado: entra como módulo de producción.

Uso esperado:

- propuestas;
- informes;
- reportes;
- entregables comerciales;
- documentos internos;
- planillas de análisis.

Se integra por scripts y carpetas output.

### 9. TDD / Diagnose

Estado: entra como módulo técnico.

Uso esperado:

- diagnosticar scripts;
- revisar errores;
- crear checklists;
- probar antes de commit;
- registrar fallas y aprendizajes.

### 10. Skill Creator

Estado: entra como función de auto-mejora.

Regla:

si una tarea se repite, Autonexus propone crear skill.

Dirección aprueba antes de aplicar.

### 11. Agency Agents

Estado: entra como catálogo inicial.

Agentes base:

- Dirección;
- PM;
- QA;
- WebDev;
- Documentador;
- Automatizaciones;
- Research;
- Odoo;
- Comercial;
- Datos;
- Seguridad;
- Panel Visual;
- GitHub Dev;
- Skill Creator.

### 12. Research / Scraping

Estado: entra con control.

Uso esperado:

- investigación comercial;
- oportunidades;
- análisis de fuentes públicas;
- reportes internos.

No se activa scraping agresivo automático. Primero diseño, fuentes, scoring y QA.

### 13. Modo YOLO controlado

Estado: permitido solo como modo interno con límites.

Reglas:

- nunca activo por defecto;
- requiere aprobación de Dirección;
- debe tener alcance;
- debe tener rollback;
- debe registrar cambios;
- no puede tocar producción sin aprobación.

## Prioridad inmediata

1. Consolidar catálogo de agentes.
2. Consolidar catálogo de skills.
3. Mejorar panel visual.
4. Crear grafo visual de agentes/rutas/eventos.
5. Crear módulo de hooks internos.
6. Crear módulo Playwright cuando la PC esté estable.
7. Dejar n8n MCP para fase posterior.

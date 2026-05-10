# Tareas Autonexus OS

Este archivo registra las tareas reales del sistema.

Cada tarea debe permitir saber:

- qué se pidió
- quién lo pidió
- qué agente debería intervenir
- qué skill corresponde
- qué permiso requiere
- qué riesgo tiene
- qué resultado dejó
- qué aprendizaje debe guardarse
- qué parte del grafo debe actualizarse

---

## Formato de tarea

- ID:
- Fecha:
- Solicitante:
- Descripción:
- Tipo:
- Objeto de trabajo:
- Agente sugerido:
- Skill sugerido:
- Nivel de permiso:
- Riesgo:
- Estado:
- Resultado esperado:
- Requiere aprobación de Dirección:
- Aprendizaje a guardar:
- Actualización de grafo:

---

## TASK-001

- ID: TASK-001
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Preparar la base inicial de Autonexus OS y subirla a GitHub.
- Tipo: infraestructura / sistema interno
- Objeto de trabajo: repositorio autonexuss
- Agente sugerido: Agente PM + Agente Documentador
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: completado
- Resultado esperado: repositorio inicial disponible en GitHub
- Requiere aprobación de Dirección: no
- Aprendizaje a guardar: primero se construye gobierno, memoria, agentes y grafo antes de instalar herramientas pesadas.
- Actualización de grafo: evento inicial de repositorio creado.

---

## TASK-002

- ID: TASK-002
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear el primer proyecto real de la agencia dentro del Brain.
- Tipo: memoria / organización interna
- Objeto de trabajo: brain/proyectos/autonexus_agencia.md
- Agente sugerido: Agente PM + Agente Documentador
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: completado
- Resultado esperado: Autonexus Agencia queda definido como proyecto interno activo.
- Requiere aprobación de Dirección: no
- Aprendizaje a guardar: el sistema empieza a registrar proyectos reales dentro del Brain antes de automatizar.
- Actualización de grafo: registrar proyecto interno Autonexus Agencia.

---

## TASK-003

- ID: TASK-003
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear flujo base de nueva tarea
- Tipo: sistema interno
- Objeto de trabajo: Autonexus OS
- Agente sugerido: Agente PM
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Tarea registrada en Autonexus OS
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: La tarea queda documentada para seguimiento operativo.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-004

- ID: TASK-004
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear el flujo operativo base para registrar y procesar nuevas tareas
- Tipo: proceso interno
- Objeto de trabajo: brain/procesos/flujo_nueva_tarea.md
- Agente sugerido: Agente PM + Agente Documentador
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Flujo base de nueva tarea creado dentro del Brain
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Toda tarea debe pasar por clasificación, permiso, riesgo, resultado, aprendizaje y grafo.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-005

- ID: TASK-005
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear router inicial para clasificar tareas por descripción
- Tipo: sistema interno
- Objeto de trabajo: scripts/router_tarea.ps1
- Agente sugerido: Agente PM
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Router inicial de tareas creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema empieza a clasificar tareas automáticamente según palabras clave.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-006

- ID: TASK-006
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Preparar una propuesta comercial para un cliente que quiere implementar Odoo
- Tipo: Odoo
- Objeto de trabajo: Proyecto Odoo
- Agente sugerido: Agente Odoo
- Skill sugerido: Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Tarea clasificada y registrada por el router operativo
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El router permite clasificar tareas sin completar todos los campos manualmente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-007

- ID: TASK-007
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Mejorar el router para detectar tareas mixtas como comercial más Odoo
- Tipo: sistema interno
- Objeto de trabajo: scripts/router_tarea.ps1
- Agente sugerido: Agente PM
- Skill sugerido: Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Router mejorado con detección de casos mixtos
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Cuando una tarea contiene intención comercial y técnica, debe asignarse a más de un agente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-008

- ID: TASK-008
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Preparar una propuesta comercial para un cliente que quiere implementar Odoo
- Tipo: comercial + Odoo
- Objeto de trabajo: Propuesta comercial Odoo
- Agente sugerido: Agente Comercial + Agente Odoo
- Skill sugerido: Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Tarea clasificada y registrada por el router operativo
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El router clasifica tareas según palabras clave y detecta casos mixtos.
- Actualización de grafo: Registrar evento asociado a la tarea.

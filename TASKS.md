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

---

## TASK-009

- ID: TASK-009
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Ejecutar TASK-008 creando la primera propuesta base Odoo y el flujo interno de propuesta comercial Odoo
- Tipo: comercial + Odoo
- Objeto de trabajo: output/propuestas/propuesta_base_odoo.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Primera propuesta base Odoo creada como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede pasar de registrar una tarea a producir un entregable base.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-010

- ID: TASK-010
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA de la propuesta base Odoo y crear checklist de revisión para propuestas comerciales Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: output/propuestas/propuesta_base_odoo.md
- Agente sugerido: Agente QA + Agente Comercial + Agente Odoo
- Skill sugerido: QA Preproducción + Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Reporte QA y checklist de propuesta Odoo creados
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Toda propuesta comercial Odoo debe pasar por QA antes de enviarse a un cliente real.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-011

- ID: TASK-011
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Mejorar la propuesta base Odoo creando una plantilla comercial completa con diagnóstico, fases, supuestos, exclusiones y entregables
- Tipo: comercial + Odoo
- Objeto de trabajo: output/propuestas/plantilla_propuesta_odoo_completa.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Plantilla comercial Odoo completa creada como base interna mejorada
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las propuestas Odoo deben separar diagnóstico, fases, supuestos, exclusiones, riesgos y aprobación de Dirección.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-012

- ID: TASK-012
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear un cliente ficticio de prueba y generar una propuesta Odoo adaptada usando la plantilla comercial completa
- Tipo: comercial + Odoo
- Objeto de trabajo: output/propuestas/propuesta_odoo_distribuidora_alfa.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente Documentador
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Cliente ficticio y propuesta Odoo adaptada creados
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede usar una plantilla general para producir una propuesta contextualizada según un perfil de cliente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-013

- ID: TASK-013
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear script generador de propuestas Odoo desde archivos de cliente
- Tipo: sistema interno + comercial + Odoo
- Objeto de trabajo: scripts/generar_propuesta_odoo.ps1
- Agente sugerido: Agente PM + Agente Comercial + Agente Odoo
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Script generador de propuestas Odoo creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema empieza a convertir clientes del Brain en entregables comerciales generados por script.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-014

- ID: TASK-014
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Distribuidora Alfa
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_distribuidora_alfa_generada.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta Odoo generada automáticamente desde archivo de cliente
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-015

- ID: TASK-015
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear script para registrar clientes desde consola
- Tipo: sistema interno + cliente
- Objeto de trabajo: scripts/crear_cliente.ps1
- Agente sugerido: Agente PM + Agente Comercial + Agente Documentador
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Script crear_cliente.ps1 creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS empieza a crear clientes desde consola sin editar archivos manualmente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-016

- ID: TASK-016
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear ficha de cliente para Empresa Demo Beta
- Tipo: cliente + documentación
- Objeto de trabajo: .\brain\clientes\cliente_empresa_demo_beta.md
- Agente sugerido: Agente Comercial + Agente Documentador
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Ficha de cliente creada en Brain
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede crear clientes desde consola y dejarlos listos para generar propuestas.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-017

- ID: TASK-017
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Empresa Demo Beta
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_beta_generada.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta Odoo generada automáticamente desde archivo de cliente
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-018

- ID: TASK-018
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear script de QA automático para propuestas Odoo
- Tipo: QA + sistema interno
- Objeto de trabajo: scripts/qa_propuesta_odoo.ps1
- Agente sugerido: Agente QA + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Script QA de propuestas Odoo creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS empieza a revisar entregables generados antes de considerarlos utilizables.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-019

- ID: TASK-019
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático de propuesta Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_beta_generada.md
- Agente sugerido: Agente QA + Agente Comercial + Agente Odoo
- Skill sugerido: QA Preproducción + Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Reporte QA automático creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las propuestas generadas por script deben revisarse antes de cualquier envío real.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-020

- ID: TASK-020
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear pipeline Odoo para crear cliente, generar propuesta y ejecutar QA automático en un solo flujo
- Tipo: sistema interno + comercial + Odoo + QA
- Objeto de trabajo: scripts/pipeline_odoo.ps1
- Agente sugerido: Agente PM + Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline Odoo creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS empieza a orquestar flujos completos desde un solo comando.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-021

- ID: TASK-021
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear ficha de cliente para Empresa Demo Gamma
- Tipo: cliente + documentación
- Objeto de trabajo: .\brain\clientes\cliente_empresa_demo_gamma.md
- Agente sugerido: Agente Comercial + Agente Documentador
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Ficha de cliente creada en Brain
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede crear clientes desde consola y dejarlos listos para generar propuestas.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-022

- ID: TASK-022
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Empresa Demo Gamma
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_gamma_generada.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta Odoo generada automáticamente desde archivo de cliente
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-023

- ID: TASK-023
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático de propuesta Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_gamma_generada.md
- Agente sugerido: Agente QA + Agente Comercial + Agente Odoo
- Skill sugerido: QA Preproducción + Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Reporte QA automático creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las propuestas generadas por script deben revisarse antes de cualquier envío real.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-024

- ID: TASK-024
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Corregir pipeline Odoo para aceptar solo Nombre, TipoEmpresa y Necesidad sin romper parámetros opcionales
- Tipo: sistema interno + Odoo + QA
- Objeto de trabajo: scripts/pipeline_odoo.ps1
- Agente sugerido: Agente PM + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline Odoo corregido para parámetros opcionales seguros
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los parámetros opcionales vacíos no deben pasarse como argumentos sin valor.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-025

- ID: TASK-025
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear ficha de cliente para Cliente Real X
- Tipo: cliente + documentación
- Objeto de trabajo: .\brain\clientes\cliente_cliente_real_x.md
- Agente sugerido: Agente Comercial + Agente Documentador
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Ficha de cliente creada en Brain
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede crear clientes desde consola y dejarlos listos para generar propuestas.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-026

- ID: TASK-026
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Cliente Real X
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_cliente_real_x_generada.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta Odoo generada automáticamente desde archivo de cliente
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-027

- ID: TASK-027
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático de propuesta Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_cliente_real_x_generada.md
- Agente sugerido: Agente QA + Agente Comercial + Agente Odoo
- Skill sugerido: QA Preproducción + Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Reporte QA automático creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las propuestas generadas por script deben revisarse antes de cualquier envío real.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-028

- ID: TASK-028
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear comando único Autonexus Odoo para ejecutar pipeline, commitear y subir a GitHub
- Tipo: sistema interno + Odoo + automatización
- Objeto de trabajo: scripts/autonexus_odoo.ps1
- Agente sugerido: Agente PM + Agente Automatizaciones + Agente QA
- Skill sugerido: Cierre de Tarea + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Comando único Autonexus Odoo creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El flujo Odoo puede ejecutarse y versionarse desde un solo comando.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-029

- ID: TASK-029
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear ficha de cliente para Empresa Demo Delta
- Tipo: cliente + documentación
- Objeto de trabajo: .\brain\clientes\cliente_empresa_demo_delta.md
- Agente sugerido: Agente Comercial + Agente Documentador
- Skill sugerido: Propuesta Cliente + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Ficha de cliente creada en Brain
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede crear clientes desde consola y dejarlos listos para generar propuestas.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-030

- ID: TASK-030
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Empresa Demo Delta
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_delta_generada.md
- Agente sugerido: Agente Comercial + Agente Odoo + Agente QA
- Skill sugerido: Propuesta Cliente + Auditoría Odoo + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta Odoo generada automáticamente desde archivo de cliente
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-031

- ID: TASK-031
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático de propuesta Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_empresa_demo_delta_generada.md
- Agente sugerido: Agente QA + Agente Comercial + Agente Odoo
- Skill sugerido: QA Preproducción + Propuesta Cliente + Auditoría Odoo
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Reporte QA automático creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las propuestas generadas por script deben revisarse antes de cualquier envío real.
- Actualización de grafo: Registrar evento asociado a la tarea.

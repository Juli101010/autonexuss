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


---

## TASK-035

- ID: TASK-035
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Limpiar cliente genérico creado por error y bloquear valores de ejemplo en autonexus_odoo
- Tipo: sistema interno + limpieza + seguridad
- Objeto de trabajo: scripts/autonexus_odoo.ps1
- Agente sugerido: Agente PM + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Cliente genérico eliminado y comando único protegido contra valores de ejemplo
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los comandos de ejemplo no deben ejecutarse sin reemplazar los valores placeholder.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-036

- ID: TASK-036
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear ficha de cliente para Ferretería San Martín
- Tipo: cliente + documentación
- Objeto de trabajo: .\brain\clientes\cliente_ferreteria_san_martin.md
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

## TASK-037

- ID: TASK-037
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar propuesta Odoo automática para Ferretería San Martín
- Tipo: comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_ferreteria_san_martin_generada.md
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

## TASK-038

- ID: TASK-038
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático de propuesta Odoo
- Tipo: QA + comercial + Odoo
- Objeto de trabajo: .\output\propuestas\propuesta_odoo_ferreteria_san_martin_generada.md
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

## TASK-039

- ID: TASK-039
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear reporte de estado general de Autonexus OS
- Tipo: sistema interno + reporte + control
- Objeto de trabajo: output/reportes/estado_autonexus_os.md
- Agente sugerido: Agente PM + Agente Documentador + Agente QA
- Skill sugerido: Cierre de Tarea + QA Preproducción
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Reporte de estado general creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema necesita reportes de estado para no depender de revisar archivos manualmente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-040

- ID: TASK-040
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear panel HTML local de estado de Autonexus OS
- Tipo: sistema interno + panel + control
- Objeto de trabajo: ui/panel_autonexus.html
- Agente sugerido: Agente PM + Agente Web/Dev + Agente Documentador
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Panel HTML local creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El sistema necesita una vista local para controlar clientes, propuestas, reportes y eventos.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-041

- ID: TASK-041
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear orquestador maestro Autonexus para recibir pedidos generales y elegir ruta de trabajo
- Tipo: sistema interno + orquestación + multiagente
- Objeto de trabajo: scripts/autonexus.ps1
- Agente sugerido: Agente PM + Agente Automatizaciones + Agente QA
- Skill sugerido: Cierre de Tarea + QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Orquestador maestro creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS necesita una entrada única para interpretar pedidos y activar rutas disponibles.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-042

- ID: TASK-042
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Necesito ordenar los próximos pasos para convertir Autonexus OS en una orquesta de agentes con panel visual y memoria operativa
- Tipo: web / desarrollo
- Objeto de trabajo: Desarrollo web / repositorio
- Agente sugerido: Agente Web/Dev
- Skill sugerido: QA Preproducción
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Tarea clasificada y registrada por el router operativo
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El router clasifica tareas según palabras clave y detecta casos mixtos.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-043

- ID: TASK-043
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Actualizar panel maestro para mostrar conversaciones de agentes, agentes registrados, skills y eventos
- Tipo: sistema interno + panel + multiagente
- Objeto de trabajo: ui/panel_autonexus.html
- Agente sugerido: Agente PM + Agente Web/Dev + Agente Documentador
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Panel maestro actualizado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: La visualización del sistema debe integrar clientes, propuestas, QA, conversaciones, agentes, skills y eventos.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-044

- ID: TASK-044
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar documento: Mapa de próximos módulos de Autonexus OS
- Tipo: documentación + producción interna
- Objeto de trabajo: .\output\documentos\documento_mapa_de_proximos_modulos_de_autonexus_os.md
- Agente sugerido: Agente Documentador + Agente PM
- Skill sugerido: Cierre de Tarea + Orquestación de Agentes
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Documento generado como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede generar documentos internos desde un pedido estructurado.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-045

- ID: TASK-045
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático del documento: Mapa de próximos módulos de Autonexus OS
- Tipo: QA + documentación
- Objeto de trabajo: .\output\reportes\qa_documento_mapa_de_proximos_modulos_de_autonexus_os.md
- Agente sugerido: Agente QA + Agente Documentador
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: QA automático de documento generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los documentos generados también deben tener revisión automática mínima.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-046

- ID: TASK-046
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear pipeline Web/Dev para generar prototipos HTML, paneles y piezas visuales
- Tipo: sistema interno + web + desarrollo + multiagente
- Objeto de trabajo: scripts/autonexus_web.ps1
- Agente sugerido: Agente PM + Agente Web/Dev + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline Web/Dev creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS debe poder crear prototipos visuales además de documentos y propuestas.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-047

- ID: TASK-047
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar prototipo Web/Dev: Landing visual Autonexus OS
- Tipo: web + desarrollo + prototipo
- Objeto de trabajo: .\output\web\web_landing_visual_autonexus_os.html
- Agente sugerido: Agente Web/Dev + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Prototipo HTML generado como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede generar prototipos HTML desde pedidos estructurados.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-048

- ID: TASK-048
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático Web/Dev: Landing visual Autonexus OS
- Tipo: QA + web + desarrollo
- Objeto de trabajo: .\output\reportes\qa_web_landing_visual_autonexus_os.md
- Agente sugerido: Agente QA + Agente Web/Dev
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA automático Web/Dev generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los prototipos HTML generados deben revisarse antes de publicarse.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-049

- ID: TASK-049
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear pipeline de automatizaciones, n8n y hooks como blueprint seguro
- Tipo: sistema interno + automatización + n8n + hooks
- Objeto de trabajo: scripts/autonexus_auto.ps1
- Agente sugerido: Agente PM + Agente Automatizaciones + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline de automatizaciones creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS debe diseñar automatizaciones de forma segura antes de conectar herramientas reales.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-050

- ID: TASK-050
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Diseñar automatización: Lead a propuesta Odoo
- Tipo: automatización + n8n + hooks
- Objeto de trabajo: .\output\automatizaciones\automatizacion_lead_a_propuesta_odoo.md
- Agente sugerido: Agente Automatizaciones + Agente PM
- Skill sugerido: Cierre de Tarea + QA Preproducción
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Diseño de automatización creado como blueprint seguro
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede diseñar automatizaciones sin activar producción ni exponer credenciales.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-051

- ID: TASK-051
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA de automatización: Lead a propuesta Odoo
- Tipo: QA + automatización
- Objeto de trabajo: .\output\reportes\qa_automatizacion_lead_a_propuesta_odoo.md
- Agente sugerido: Agente QA + Agente Automatizaciones
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA de automatización generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Ninguna automatización debe activarse sin QA y aprobación.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-052

- ID: TASK-052
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear pipeline de investigación y prospección para oportunidades comerciales y scraping controlado
- Tipo: sistema interno + investigación + prospección
- Objeto de trabajo: scripts/autonexus_research.ps1
- Agente sugerido: Agente PM + Agente Comercial + Agente Automatizaciones + Agente QA
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline de investigación creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS necesita un módulo de investigación profunda separado de Odoo, documentos, web y automatizaciones.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-053

- ID: TASK-053
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Diseñar investigación/prospección: Oportunidades Odoo habla hispana
- Tipo: investigación + prospección + scraping
- Objeto de trabajo: .\output\investigacion\investigacion_oportunidades_odoo_habla_hispana.md
- Agente sugerido: Agente PM + Agente Comercial + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Diseño de investigación profunda creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede preparar investigaciones y prospección con fuentes, queries, scoring y CSV base.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-054

- ID: TASK-054
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA de investigación/prospección: Oportunidades Odoo habla hispana
- Tipo: QA + investigación + prospección
- Objeto de trabajo: .\output\reportes\qa_investigacion_oportunidades_odoo_habla_hispana.md
- Agente sugerido: Agente QA + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA de investigación generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Toda investigación de oportunidades debe pasar por QA antes de contacto externo.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-055

- ID: TASK-055
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear módulo de auto-mejora controlada para Autonexus OS
- Tipo: sistema interno + auto-mejora + gobierno
- Objeto de trabajo: scripts/autonexus_self_improve.ps1
- Agente sugerido: Agente PM + Agente Automatizaciones + Agente QA
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Módulo de auto-mejora controlada creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede proponer, aprobar y aplicar mejoras internas con control de Dirección.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-056

- ID: TASK-056
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Proponer auto-mejora: MEJORA-001
- Tipo: auto-mejora + propuesta
- Objeto de trabajo: .\output\mejoras\mejora_mejora_001.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Propuesta de auto-mejora creada
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede proponer mejoras internas sin aplicarlas automáticamente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-057

- ID: TASK-057
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Aprobar auto-mejora: MEJORA-001
- Tipo: auto-mejora + aprobación
- Objeto de trabajo: .\output\mejoras\mejora_mejora_001.json
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Auto-mejora aprobada por Dirección
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Las mejoras internas requieren aprobación antes de aplicarse.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-058

- ID: TASK-058
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Aplicar auto-mejora: MEJORA-001
- Tipo: auto-mejora + aplicación controlada
- Objeto de trabajo: .\brain\governance\applied_improvements.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Auto-mejora aplicada con control de Dirección
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede aplicar mejoras internas aprobadas y dejar trazabilidad.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-059

- ID: TASK-059
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Corregir módulo de auto-mejora para agregar propiedades JSON nuevas sin errores
- Tipo: sistema interno + auto-mejora + corrección
- Objeto de trabajo: scripts/autonexus_self_improve.ps1
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Módulo de auto-mejora corregido
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: PowerShell requiere Add-Member para agregar propiedades nuevas a objetos JSON cargados.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-060

- ID: TASK-060
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear pipeline GitHub/Dev para issues, changelog, release notes y QA técnico
- Tipo: sistema interno + GitHub + desarrollo
- Objeto de trabajo: scripts/autonexus_dev.ps1
- Agente sugerido: Agente PM + Agente Web/Dev + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Pipeline GitHub/Dev creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS necesita un módulo Dev para ordenar cambios técnicos, releases y rollback.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-061

- ID: TASK-061
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear paquete GitHub/Dev: Consolidar arquitectura modular de Autonexus OS
- Tipo: GitHub + desarrollo + release
- Objeto de trabajo: .\output\dev\issue_consolidar_arquitectura_modular_de_autonexus_os.md
- Agente sugerido: Agente Web/Dev + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Issue, plan técnico, changelog y release notes generados
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede ordenar cambios técnicos con trazabilidad Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-062

- ID: TASK-062
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA técnico GitHub/Dev: Consolidar arquitectura modular de Autonexus OS
- Tipo: QA + GitHub + desarrollo
- Objeto de trabajo: .\output\reportes\qa_dev_consolidar_arquitectura_modular_de_autonexus_os.md
- Agente sugerido: Agente QA + Agente Web/Dev
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA técnico GitHub/Dev generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los cambios técnicos necesitan QA y rollback.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-063

- ID: TASK-063
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear orquestador maestro modular para enrutar pedidos a Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev
- Tipo: sistema interno + orquestador + multiagente
- Objeto de trabajo: scripts/autonexus_master.ps1
- Agente sugerido: Agente PM + Agente Automatizaciones + Agente QA
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Orquestador maestro modular creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS necesita una entrada única capaz de elegir el pipeline correcto según el pedido.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-064

- ID: TASK-064
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar prototipo Web/Dev: Plan de integración modular de Autonexus OS
- Tipo: web + desarrollo + prototipo
- Objeto de trabajo: .\output\web\web_plan_de_integracion_modular_de_autonexus_os.html
- Agente sugerido: Agente Web/Dev + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Prototipo HTML generado como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede generar prototipos HTML desde pedidos estructurados.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-065

- ID: TASK-065
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático Web/Dev: Plan de integración modular de Autonexus OS
- Tipo: QA + web + desarrollo
- Objeto de trabajo: .\output\reportes\qa_web_plan_de_integracion_modular_de_autonexus_os.md
- Agente sugerido: Agente QA + Agente Web/Dev
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA automático Web/Dev generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los prototipos HTML generados deben revisarse antes de publicarse.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-066

- ID: TASK-066
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Ejecutar orquestador maestro modular: Necesito un plan interno para conectar todos los módulos de Autonexus OS y avanzar hacia una interfaz visual de control de agentes
- Tipo: orquestador maestro + Web/Dev
- Objeto de trabajo: output/reportes/master_ultima_ruta.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Prototipo HTML generado con QA Web/Dev.
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El orquestador maestro decide rutas entre Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-067

- ID: TASK-067
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear interfaz visual local de comando para Autonexus OS
- Tipo: sistema interno + interfaz + orquestador
- Objeto de trabajo: ui/comando_autonexus.html
- Agente sugerido: Agente PM + Agente Web/Dev + Agente QA
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Centro de comando visual local creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS necesita una interfaz visual para que Dirección escriba pedidos y obtenga la ruta/comando de ejecución.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-068

- ID: TASK-068
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Consultar Ollama CLI para clasificar pedido
- Tipo: LLM local + Ollama CLI
- Objeto de trabajo: .\output\llm\ollama_clasifica_este_pedido_quiero_mejorar_el_panel_visual_de_autonexus_os_p.md
- Agente sugerido: Agente PM + Motor Local Ollama
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Respuesta local de Ollama CLI generada
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS usa Ollama por CLI cuando la API local no responde correctamente.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-069

- ID: TASK-069
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Consultar DeepSeek local para clasificar pedido
- Tipo: LLM local + DeepSeek + Ollama API
- Objeto de trabajo: .\output\llm\ollama_clasifica_este_pedido_quiero_mejorar_el_panel_visual_de_autonexus_os_p.md
- Agente sugerido: Agente PM + Motor Local DeepSeek
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Respuesta local de DeepSeek generada por API Ollama
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS usa DeepSeek local para tareas simples y clasificación sin depender de API paga.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-070

- ID: TASK-070
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Limpiar archivos temporales de Ollama y evitar que vuelvan a subirse
- Tipo: sistema interno + limpieza + LLM local
- Objeto de trabajo: .gitignore
- Agente sugerido: Agente PM + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Temporales de Ollama excluidos del versionado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los payloads temporales de Ollama no deben quedar versionados en GitHub.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-071

- ID: TASK-071
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Consultar DeepSeek local para clasificar pedido
- Tipo: LLM local + DeepSeek + Ollama API
- Objeto de trabajo: .\output\llm\ollama_crear_un_documento_interno_sobre_como_usar_deepseek_local_dentro_de_au.md
- Agente sugerido: Agente PM + Motor Local DeepSeek
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Respuesta local de DeepSeek generada por API Ollama
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS usa DeepSeek local para tareas simples y clasificación sin depender de API paga.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-072

- ID: TASK-072
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar documento: Documento - Crear un documento interno sobre cómo usar DeepSeek local dentro de Au
- Tipo: documentación + producción interna
- Objeto de trabajo: .\output\documentos\documento_documento_crear_un_documento_interno_sobre_como_usar_deepseek_local_dentro_de_au.md
- Agente sugerido: Agente Documentador + Agente PM
- Skill sugerido: Cierre de Tarea + Orquestación de Agentes
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Documento generado como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede generar documentos internos desde un pedido estructurado.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-073

- ID: TASK-073
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático del documento: Documento - Crear un documento interno sobre cómo usar DeepSeek local dentro de Au
- Tipo: QA + documentación
- Objeto de trabajo: .\output\reportes\qa_documento_documento_crear_un_documento_interno_sobre_como_usar_deepseek_local_dentro_de_au.md
- Agente sugerido: Agente QA + Agente Documentador
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: QA automático de documento generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los documentos generados también deben tener revisión automática mínima.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-074

- ID: TASK-074
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Ejecutar orquestador maestro modular: Crear un documento interno sobre cómo usar DeepSeek local dentro de Autonexus OS para clasificar pedidos simples y decidir rutas de trabajo
- Tipo: orquestador maestro + documentos
- Objeto de trabajo: output/reportes/master_ultima_ruta.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Documento interno generado desde ruta general.
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El orquestador maestro decide rutas entre Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-075

- ID: TASK-075
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Consultar DeepSeek local para clasificar pedido
- Tipo: LLM local + DeepSeek + Ollama API
- Objeto de trabajo: .\output\llm\ollama_crear_un_prototipo_web_interno_para_visualizar_autonexus_os_como_siste.md
- Agente sugerido: Agente PM + Motor Local DeepSeek
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Respuesta local de DeepSeek generada por API Ollama
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS usa DeepSeek local para tareas simples y clasificación sin depender de API paga.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-076

- ID: TASK-076
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Generar prototipo Web/Dev: Prototipo Web - Crear un prototipo web interno para visualizar Autonexus OS como siste
- Tipo: web + desarrollo + prototipo
- Objeto de trabajo: .\output\web\web_prototipo_web_crear_un_prototipo_web_interno_para_visualizar_autonexus_os_como_siste.html
- Agente sugerido: Agente Web/Dev + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Prototipo HTML generado como borrador interno
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede generar prototipos HTML desde pedidos estructurados.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-077

- ID: TASK-077
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA automático Web/Dev: Prototipo Web - Crear un prototipo web interno para visualizar Autonexus OS como siste
- Tipo: QA + web + desarrollo
- Objeto de trabajo: .\output\reportes\qa_web_prototipo_web_crear_un_prototipo_web_interno_para_visualizar_autonexus_os_como_siste.md
- Agente sugerido: Agente QA + Agente Web/Dev
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA automático Web/Dev generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los prototipos HTML generados deben revisarse antes de publicarse.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-078

- ID: TASK-078
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Ejecutar orquestador maestro modular: Crear un prototipo web interno para visualizar Autonexus OS como sistema de agentes, rutas, tareas, eventos, memoria y entregables
- Tipo: orquestador maestro + Web/Dev
- Objeto de trabajo: output/reportes/master_ultima_ruta.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Prototipo HTML generado con QA Web/Dev.
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El orquestador maestro decide rutas entre Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-079

- ID: TASK-079
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Consultar DeepSeek local para clasificar pedido
- Tipo: LLM local + DeepSeek + Ollama API
- Objeto de trabajo: .\output\llm\ollama_crear_un_informe_interno_del_estado_actual_de_autonexus_os_modulos_que.md
- Agente sugerido: Agente PM + Motor Local DeepSeek
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Respuesta local de DeepSeek generada por API Ollama
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS usa DeepSeek local para tareas simples y clasificación sin depender de API paga.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-080

- ID: TASK-080
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear paquete GitHub/Dev: Cambio Dev - Crear un informe interno del estado actual de Autonexus OS: módulos qu
- Tipo: GitHub + desarrollo + release
- Objeto de trabajo: .\output\dev\issue_cambio_dev_crear_un_informe_interno_del_estado_actual_de_autonexus_os_modulos_qu.md
- Agente sugerido: Agente Web/Dev + Agente PM
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Issue, plan técnico, changelog y release notes generados
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Autonexus OS puede ordenar cambios técnicos con trazabilidad Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-081

- ID: TASK-081
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Realizar QA técnico GitHub/Dev: Cambio Dev - Crear un informe interno del estado actual de Autonexus OS: módulos qu
- Tipo: QA + GitHub + desarrollo
- Objeto de trabajo: .\output\reportes\qa_dev_cambio_dev_crear_un_informe_interno_del_estado_actual_de_autonexus_os_modulos_qu.md
- Agente sugerido: Agente QA + Agente Web/Dev
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: medio
- Estado: registrado
- Resultado esperado: QA técnico GitHub/Dev generado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Los cambios técnicos necesitan QA y rollback.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-082

- ID: TASK-082
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Ejecutar orquestador maestro modular: Crear un informe interno del estado actual de Autonexus OS: módulos que funcionan, módulos descartados por rendimiento, arquitectura estable con DeepSeek local, GitHub, panel, tareas, eventos y próximos pasos
- Tipo: orquestador maestro + GitHub/Dev
- Objeto de trabajo: output/reportes/master_ultima_ruta.md
- Agente sugerido: Agente PM + Agente QA + Agente Automatizaciones
- Skill sugerido: Orquestación de Agentes + QA Preproducción + Cierre de Tarea
- Nivel de permiso: 3
- Riesgo: medio
- Estado: registrado
- Resultado esperado: Paquete GitHub/Dev generado: issue, plan, changelog, release notes y QA.
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El orquestador maestro decide rutas entre Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-083

- ID: TASK-083
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Corregir panel maestro para evitar cambios por timestamp variable
- Tipo: sistema interno + panel + limpieza Git
- Objeto de trabajo: scripts/panel_autonexus.ps1
- Agente sugerido: Agente PM + Agente Web/Dev + Agente QA
- Skill sugerido: QA Preproducción + Cierre de Tarea
- Nivel de permiso: 1
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Panel maestro estabilizado para no ensuciar Git por hora de generación
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: El panel no debe cambiar si solo cambia el timestamp.
- Actualización de grafo: Registrar evento asociado a la tarea.

---

## TASK-084

- ID: TASK-084
- Fecha: 2026-05-10
- Solicitante: Dirección
- Descripción: Crear comando simple de pedido para Autonexus OS
- Tipo: sistema interno + comando simple + DeepSeek local
- Objeto de trabajo: scripts/pedir_autonexus.ps1
- Agente sugerido: Agente PM + Motor Local DeepSeek + Autonexus Master
- Skill sugerido: Orquestación de Agentes + Cierre de Tarea
- Nivel de permiso: 2
- Riesgo: bajo
- Estado: registrado
- Resultado esperado: Comando simple de pedido creado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: Dirección necesita una entrada corta para pedir acciones sin comandos largos.
- Actualización de grafo: Registrar evento asociado a la tarea.

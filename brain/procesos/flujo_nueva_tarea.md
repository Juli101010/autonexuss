# Flujo Operativo: Nueva Tarea

## Propósito

Definir cómo Autonexus OS debe recibir, clasificar, ejecutar, registrar y aprender de cada tarea nueva.

Este flujo aplica para tareas pedidas por Dirección, trabajadores humanos o agentes virtuales.

---

## Circuito principal

1. Dirección o trabajador solicita una tarea.
2. Agente PM interpreta la solicitud.
3. Agente PM clasifica el tipo de tarea.
4. Se identifica el objeto de trabajo.
5. Se selecciona agente responsable.
6. Se selecciona skill correspondiente.
7. Se consulta memoria relevante en Autonexus Brain.
8. Se evalúa nivel de permiso.
9. Se evalúa riesgo.
10. Si la acción está permitida, se ejecuta.
11. Si requiere autorización, se eleva a Dirección.
12. Agente QA revisa si corresponde.
13. Se registra resultado.
14. Se guarda aprendizaje.
15. Se actualiza TASKS.md.
16. Se actualiza graph/events.json.
17. Se informa a Dirección.

---

## Tipos de tarea iniciales

- Comercial
- Odoo
- Web / desarrollo
- Automatización
- Documentación
- QA
- Diseño de proceso
- Investigación
- Soporte interno
- Gestión de cliente

---

## Reglas de permiso

### Puede avanzar sin aprobación

- lectura
- clasificación
- resumen
- borradores internos
- documentación
- registro de tareas
- propuesta de pasos

### Requiere aprobación de Dirección

- envío a clientes
- definición de precios
- cambios en producción
- uso de credenciales
- creación de agentes nuevos
- activación de automatizaciones reales
- modificación de bases de datos reales
- publicación externa

---

## Formato mínimo de cada tarea

Cada tarea debe tener:

- ID
- Fecha
- Solicitante
- Descripción
- Tipo
- Objeto de trabajo
- Agente sugerido
- Skill sugerido
- Nivel de permiso
- Riesgo
- Estado
- Resultado esperado
- Requiere aprobación de Dirección
- Aprendizaje a guardar
- Actualización de grafo

---

## Estados posibles

- registrado
- en análisis
- pendiente de aprobación
- en ejecución
- bloqueado
- en QA
- completado
- descartado
- convertido en skill
- convertido en agente propuesto

---

## Salida esperada

Toda tarea debe terminar con una de estas salidas:

1. Resultado entregado.
2. Tarea bloqueada con motivo.
3. Solicitud de aprobación a Dirección.
4. Propuesta de nuevo skill.
5. Propuesta de nuevo agente.
6. Aprendizaje documentado.
7. Actualización de grafo.

---

## Regla final

Si una tarea se repite más de tres veces, el sistema debe proponer convertirla en skill.

Si una necesidad aparece de manera recurrente y ningún agente existente la cubre bien, el sistema debe proponer un nuevo agente.

Nada de eso se activa sin aprobación de Dirección.

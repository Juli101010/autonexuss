# Automatización: Lead a propuesta Odoo

## Estado

Diseño interno seguro.  
No ejecuta acciones reales.  
No contiene credenciales.  
No conectar a producción sin aprobación de Dirección.

## Fecha

2026-05-10 02:39:04

---

# 1. Pedido recibido

Cuando entra un lead interesado en Odoo, clasificarlo, crear ficha de cliente, generar propuesta borrador, ejecutar QA y dejar todo registrado sin enviar nada automáticamente.

---

# 2. Trigger previsto

nuevo lead manual o futuro webhook

---

# 3. Sistemas involucrados

Autonexus OS; GitHub; futuro n8n; futuro formulario web

---

# 4. Acción esperada

clasificar lead y preparar entregables internos sin envío externo

---

# 5. Diseño del flujo

## Paso 1 — Entrada

El flujo recibe un evento, pedido, formulario, webhook, archivo o acción manual.

## Paso 2 — Clasificación

Autonexus OS clasifica el tipo de pedido, riesgo y agente responsable.

## Paso 3 — Validación

Antes de ejecutar cualquier acción externa se valida:

- permiso
- riesgo
- datos requeridos
- si hay credenciales involucradas
- si afecta producción
- si requiere aprobación de Dirección

## Paso 4 — Ejecución segura

En esta etapa solo se diseña el flujo.  
La ejecución real queda bloqueada hasta aprobación.

## Paso 5 — Registro

Toda ejecución debe registrar:

- tarea
- evento
- resultado
- aprendizaje
- responsable final

## Paso 6 — QA

Toda automatización debe tener un reporte QA antes de activarse.

---

# 6. Riesgos declarados

no enviar mensajes automáticos; no usar credenciales reales; no activar producción; no prometer precios ni plazos

---

# 7. Reglas de seguridad

No se permite:

- guardar tokens en el repo
- subir credenciales
- ejecutar webhooks productivos sin aprobación
- modificar bases reales
- enviar mensajes a clientes reales sin validación
- activar tareas automáticas sin control de Dirección

---

# 8. Próximos pasos

1. Revisar diseño.
2. Validar si se implementará en n8n, script local o hook.
3. Definir datos de entrada y salida.
4. Crear entorno de prueba.
5. Ejecutar QA.
6. Pedir aprobación de Dirección antes de activar.

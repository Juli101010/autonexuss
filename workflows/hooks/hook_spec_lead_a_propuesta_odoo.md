# Hook Spec: Lead a propuesta Odoo

## Estado

Diseño interno.  
No activo.  
No contiene URL real ni secreto.

---

## Endpoint sugerido

POST /autonexus/hooks/lead_a_propuesta_odoo

---

## Payload sugerido

{
  "source": "sistema_origen",
  "event": "evento_detectado",
  "request": "pedido o dato recibido",
  "risk_level": "bajo|medio|alto",
  "requires_approval": true
}

---

## Respuesta esperada

{
  "status": "received",
  "route": "classified",
  "requires_direction_approval": true
}

---

## Seguridad

- No exponer públicamente sin autenticación.
- No guardar tokens en GitHub.
- No activar producción sin QA.
- No ejecutar acciones sensibles sin aprobación de Dirección.

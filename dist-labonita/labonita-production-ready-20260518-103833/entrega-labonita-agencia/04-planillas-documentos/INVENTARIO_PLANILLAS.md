# Inventario de planillas y documentos

Las planillas fueron copiadas desde `backend/public/templates`.

## Planillas principales

| Archivo | Uso |
| --- | --- |
| `templates/formulario-inscripcion-persona-asociada.pdf` | Alta/onboarding de persona asociada |
| `templates/formulario-servicio-puntual.pdf` | Servicio puntual o acompanante |
| `templates/peticion-alta-factura-puntual.pdf` | Alta + factura puntual |
| `templates/peticion-contrato-formacion.pdf` | Contrato de formacion |

## PRL

| Archivo | Uso |
| --- | --- |
| `templates/prl/model-consent-renuncia.pdf` | Renuncia/consentimiento PRL |
| `templates/prl/modelo-entrega-epis.docx` | Entrega EPIS |
| `templates/prl/plantilla-ex-inicial-medea.pdf` | Examen inicial |

## Controles Excel

| Archivo | Uso |
| --- | --- |
| `templates/controles/bbdd-para-altas.xlsx` | Base para altas |
| `templates/controles/control-altas-mes.xlsx` | Altas del mes |
| `templates/controles/control-gastos.xlsx` | Gastos |
| `templates/controles/control-solo.xlsx` | Control puntual/solo |
| `templates/controles/costes.xlsx` | Costes |

## Pendiente recomendado

Validar con LaBonita si cada campo del sistema coincide con la ultima version oficial de cada planilla. Si cambian los PDFs, actualizar tambien los schemas en `backend/src/modules/petitions/petition.schemas.js` y las reglas operativas de `backend/src/modules/operations/operations.controller.js`.


param(
    [Parameter(Mandatory=$true)]
    [string]$Id,

    [Parameter(Mandatory=$true)]
    [string]$Descripcion
)

$desc = $Descripcion.ToLower()

$Tipo = "sistema interno"
$Agente = "Agente PM"
$Skill = "Cierre de Tarea"
$NivelPermiso = 1
$Riesgo = "bajo"
$Objeto = "Autonexus OS"

# Detectores base
$esOdoo = $desc -match "odoo|afip|factura|facturación|suscripcion|suscripción|nota de credito|nota de crédito|contabilidad|producto|precio"
$esComercial = $desc -match "lead|cliente|propuesta|presupuesto|venta|comercial|seguimiento"
$esAutomatizacion = $desc -match "n8n|automatizacion|automatización|webhook|workflow|hook|mcp"
$esWeb = $desc -match "web|pagina|página|html|css|javascript|app|dashboard|panel|github"
$esDocumentacion = $desc -match "documento|manual|informe|resumen|memoria|brain|aprendizaje"
$esQA = $desc -match "qa|test|prueba|validar|revisar|error|riesgo"

# Casos mixtos primero
if ($esComercial -and $esOdoo) {
    $Tipo = "comercial + Odoo"
    $Agente = "Agente Comercial + Agente Odoo"
    $Skill = "Propuesta Cliente + Auditoría Odoo"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Propuesta comercial Odoo"
}
elseif ($esComercial -and $esAutomatizacion) {
    $Tipo = "comercial + automatización"
    $Agente = "Agente Comercial + Agente Automatizaciones"
    $Skill = "Propuesta Cliente + Cierre de Tarea"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Propuesta de automatización"
}
elseif ($esWeb -and $esComercial) {
    $Tipo = "comercial + web"
    $Agente = "Agente Comercial + Agente Web/Dev"
    $Skill = "Propuesta Cliente + QA Preproducción"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Propuesta web / desarrollo"
}
elseif ($esOdoo) {
    $Tipo = "Odoo"
    $Agente = "Agente Odoo"
    $Skill = "Auditoría Odoo"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Proyecto Odoo"
}
elseif ($esComercial) {
    $Tipo = "comercial"
    $Agente = "Agente Comercial"
    $Skill = "Propuesta Cliente"
    $NivelPermiso = 1
    $Riesgo = "bajo"
    $Objeto = "Proceso comercial"
}
elseif ($esAutomatizacion) {
    $Tipo = "automatización"
    $Agente = "Agente Automatizaciones"
    $Skill = "Cierre de Tarea"
    $NivelPermiso = 3
    $Riesgo = "medio"
    $Objeto = "Workflow / automatización"
}
elseif ($esWeb) {
    $Tipo = "web / desarrollo"
    $Agente = "Agente Web/Dev"
    $Skill = "QA Preproducción"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Desarrollo web / repositorio"
}
elseif ($esDocumentacion) {
    $Tipo = "documentación"
    $Agente = "Agente Documentador"
    $Skill = "Cierre de Tarea"
    $NivelPermiso = 1
    $Riesgo = "bajo"
    $Objeto = "Brain / documentación"
}
elseif ($esQA) {
    $Tipo = "QA"
    $Agente = "Agente QA"
    $Skill = "QA Preproducción"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Validación / control de calidad"
}

Write-Host ""
Write-Host "Clasificación propuesta:" -ForegroundColor Cyan
Write-Host "ID: $Id"
Write-Host "Descripción: $Descripcion"
Write-Host "Tipo: $Tipo"
Write-Host "Objeto: $Objeto"
Write-Host "Agente: $Agente"
Write-Host "Skill: $Skill"
Write-Host "Nivel de permiso: $NivelPermiso"
Write-Host "Riesgo: $Riesgo"
Write-Host ""

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $Id `
  -Descripcion $Descripcion `
  -Tipo $Tipo `
  -Objeto $Objeto `
  -Agente $Agente `
  -Skill $Skill `
  -NivelPermiso $NivelPermiso `
  -Riesgo $Riesgo `
  -Resultado "Tarea clasificada y registrada por el router operativo" `
  -Aprendizaje "El router clasifica tareas según palabras clave y detecta casos mixtos."

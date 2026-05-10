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

if ($desc -match "odoo|afip|factura|facturación|suscripcion|suscripción|nota de credito|nota de crédito|contabilidad|producto|precio") {
    $Tipo = "Odoo"
    $Agente = "Agente Odoo"
    $Skill = "Auditoría Odoo"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Proyecto Odoo"
}
elseif ($desc -match "lead|cliente|propuesta|presupuesto|venta|comercial|seguimiento") {
    $Tipo = "comercial"
    $Agente = "Agente Comercial"
    $Skill = "Propuesta Cliente"
    $NivelPermiso = 1
    $Riesgo = "bajo"
    $Objeto = "Proceso comercial"
}
elseif ($desc -match "n8n|automatizacion|automatización|webhook|workflow|hook|mcp") {
    $Tipo = "automatización"
    $Agente = "Agente Automatizaciones"
    $Skill = "Cierre de Tarea"
    $NivelPermiso = 3
    $Riesgo = "medio"
    $Objeto = "Workflow / automatización"
}
elseif ($desc -match "web|pagina|página|html|css|javascript|app|dashboard|panel|github") {
    $Tipo = "web / desarrollo"
    $Agente = "Agente Web/Dev"
    $Skill = "QA Preproducción"
    $NivelPermiso = 2
    $Riesgo = "medio"
    $Objeto = "Desarrollo web / repositorio"
}
elseif ($desc -match "documento|manual|informe|resumen|memoria|brain|aprendizaje") {
    $Tipo = "documentación"
    $Agente = "Agente Documentador"
    $Skill = "Cierre de Tarea"
    $NivelPermiso = 1
    $Riesgo = "bajo"
    $Objeto = "Brain / documentación"
}
elseif ($desc -match "qa|test|prueba|validar|revisar|error|riesgo") {
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
  -Aprendizaje "El router permite clasificar tareas sin completar todos los campos manualmente."

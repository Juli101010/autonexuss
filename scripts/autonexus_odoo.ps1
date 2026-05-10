param(
    [Parameter(Mandatory=$true)]
    [string]$Nombre,

    [Parameter(Mandatory=$true)]
    [string]$TipoEmpresa,

    [Parameter(Mandatory=$true)]
    [string]$Necesidad,

    [string]$Problemas = "",
    [string]$Objetivo = "",
    [string]$ModulosIniciales = "",
    [string]$ModulosFuturos = "",
    [string]$Riesgos = "",
    [string]$CommitMessage = ""
)

function Convert-ToSafeName {
    param([string]$Text)

    $safe = $Text.ToLower()
    $safe = $safe -replace "á","a"
    $safe = $safe -replace "é","e"
    $safe = $safe -replace "í","i"
    $safe = $safe -replace "ó","o"
    $safe = $safe -replace "ú","u"
    $safe = $safe -replace "ñ","n"
    $safe = $safe -replace "[^a-z0-9]+","_"
    $safe = $safe.Trim("_")
    return $safe
}

if (-not (Test-Path ".\scripts\pipeline_odoo.ps1")) {
    Write-Host "ERROR: Falta scripts\pipeline_odoo.ps1" -ForegroundColor Red
    exit
}

$safeNombre = Convert-ToSafeName $Nombre

Write-Host ""
Write-Host "AUTONEXUS ODOO: Ejecutando flujo completo" -ForegroundColor Cyan
Write-Host "Cliente: $Nombre"
Write-Host ""

$pipelineArgs = @{
    Nombre = $Nombre
    TipoEmpresa = $TipoEmpresa
    Necesidad = $Necesidad
}

if (-not [string]::IsNullOrWhiteSpace($Problemas)) {
    $pipelineArgs["Problemas"] = $Problemas
}

if (-not [string]::IsNullOrWhiteSpace($Objetivo)) {
    $pipelineArgs["Objetivo"] = $Objetivo
}

if (-not [string]::IsNullOrWhiteSpace($ModulosIniciales)) {
    $pipelineArgs["ModulosIniciales"] = $ModulosIniciales
}

if (-not [string]::IsNullOrWhiteSpace($ModulosFuturos)) {
    $pipelineArgs["ModulosFuturos"] = $ModulosFuturos
}

if (-not [string]::IsNullOrWhiteSpace($Riesgos)) {
    $pipelineArgs["Riesgos"] = $Riesgos
}

& powershell -ExecutionPolicy Bypass -File ".\scripts\pipeline_odoo.ps1" @pipelineArgs

Write-Host ""
Write-Host "Preparando commit automático..." -ForegroundColor Cyan

git add .\scripts\autonexus_odoo.ps1 `
        .\brain\clientes `
        .\output\propuestas `
        .\output\reportes `
        .\TASKS.md `
        .\graph\events.json

$changes = git status --porcelain

if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Host "No hay cambios nuevos para commitear." -ForegroundColor Yellow
    git status
    exit
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Ejecutar pipeline Odoo para $Nombre"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Flujo completo finalizado y subido a GitHub." -ForegroundColor Green
Write-Host "Cliente: .\brain\clientes\cliente_${safeNombre}.md"
Write-Host "Propuesta: .\output\propuestas\propuesta_odoo_${safeNombre}_generada.md"
Write-Host "QA: .\output\reportes\qa_propuesta_odoo_${safeNombre}_generada.md"
Write-Host ""

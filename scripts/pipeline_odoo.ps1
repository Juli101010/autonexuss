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

    [string]$IdCliente = "",
    [string]$IdPropuesta = "",
    [string]$IdQA = ""
)

function Get-NextTaskId {
    $tasksPath = ".\TASKS.md"

    if (-not (Test-Path $tasksPath)) {
        return "TASK-001"
    }

    $tasksText = Get-Content $tasksPath -Raw
    $matches = [regex]::Matches($tasksText, "TASK-(\d+)")

    $max = 0

    foreach ($m in $matches) {
        $num = [int]$m.Groups[1].Value
        if ($num -gt $max) {
            $max = $num
        }
    }

    return ("TASK-{0:D3}" -f ($max + 1))
}

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

if (-not (Test-Path ".\scripts\crear_cliente.ps1")) {
    Write-Host "ERROR: Falta scripts\crear_cliente.ps1" -ForegroundColor Red
    exit
}

if (-not (Test-Path ".\scripts\generar_propuesta_odoo.ps1")) {
    Write-Host "ERROR: Falta scripts\generar_propuesta_odoo.ps1" -ForegroundColor Red
    exit
}

if (-not (Test-Path ".\scripts\qa_propuesta_odoo.ps1")) {
    Write-Host "ERROR: Falta scripts\qa_propuesta_odoo.ps1" -ForegroundColor Red
    exit
}

if ([string]::IsNullOrWhiteSpace($IdCliente)) {
    $IdCliente = Get-NextTaskId
}

Write-Host ""
Write-Host "PASO 1/3: Crear cliente en Brain" -ForegroundColor Cyan

$clienteArgs = @{
    Id = $IdCliente
    Nombre = $Nombre
    Tipo = $TipoEmpresa
    Necesidad = $Necesidad
}

if (-not [string]::IsNullOrWhiteSpace($Problemas)) {
    $clienteArgs["Problemas"] = $Problemas
}

if (-not [string]::IsNullOrWhiteSpace($Objetivo)) {
    $clienteArgs["Objetivo"] = $Objetivo
}

if (-not [string]::IsNullOrWhiteSpace($ModulosIniciales)) {
    $clienteArgs["ModulosIniciales"] = $ModulosIniciales
}

if (-not [string]::IsNullOrWhiteSpace($ModulosFuturos)) {
    $clienteArgs["ModulosFuturos"] = $ModulosFuturos
}

if (-not [string]::IsNullOrWhiteSpace($Riesgos)) {
    $clienteArgs["Riesgos"] = $Riesgos
}

& powershell -ExecutionPolicy Bypass -File ".\scripts\crear_cliente.ps1" @clienteArgs

if ([string]::IsNullOrWhiteSpace($IdPropuesta)) {
    $IdPropuesta = Get-NextTaskId
}

Write-Host ""
Write-Host "PASO 2/3: Generar propuesta Odoo" -ForegroundColor Cyan

& powershell -ExecutionPolicy Bypass -File ".\scripts\generar_propuesta_odoo.ps1" `
  -Cliente $Nombre `
  -Id $IdPropuesta

$safeNombre = Convert-ToSafeName $Nombre
$propuestaPath = ".\output\propuestas\propuesta_odoo_${safeNombre}_generada.md"

if (-not (Test-Path $propuestaPath)) {
    Write-Host "ERROR: No se generó la propuesta esperada:" -ForegroundColor Red
    Write-Host $propuestaPath
    exit
}

if ([string]::IsNullOrWhiteSpace($IdQA)) {
    $IdQA = Get-NextTaskId
}

Write-Host ""
Write-Host "PASO 3/3: Ejecutar QA automático" -ForegroundColor Cyan

& powershell -ExecutionPolicy Bypass -File ".\scripts\qa_propuesta_odoo.ps1" `
  -Propuesta $propuestaPath `
  -Id $IdQA

$qaPath = ".\output\reportes\qa_propuesta_odoo_${safeNombre}_generada.md"

Write-Host ""
Write-Host "Pipeline Odoo finalizado correctamente." -ForegroundColor Green
Write-Host "Cliente: .\brain\clientes\cliente_${safeNombre}.md"
Write-Host "Propuesta: $propuestaPath"
Write-Host "QA: $qaPath"
Write-Host ""

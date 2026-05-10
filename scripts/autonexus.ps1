param(
    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Nombre = "",
    [string]$TipoEmpresa = "",
    [string]$Necesidad = "",
    [string]$Problemas = "",
    [string]$Objetivo = "",
    [string]$ModulosIniciales = "",
    [string]$ModulosFuturos = "",
    [string]$Riesgos = "",
    [string]$CommitMessage = ""
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
        if ($num -gt $max) { $max = $num }
    }

    return ("TASK-{0:D3}" -f ($max + 1))
}

New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$pedidoLower = $Pedido.ToLower()

$isOdoo = $pedidoLower -match "odoo|crm|ventas|presupuesto|propuesta comercial|cliente|facturacion|facturación|productos|listas de precios"

Write-Host ""
Write-Host "AUTONEXUS OS · ORQUESTADOR MAESTRO" -ForegroundColor Cyan
Write-Host "Pedido: $Pedido"
Write-Host ""

if ($isOdoo -and -not [string]::IsNullOrWhiteSpace($Nombre) -and -not [string]::IsNullOrWhiteSpace($TipoEmpresa) -and -not [string]::IsNullOrWhiteSpace($Necesidad)) {

    Write-Host "Ruta elegida: pipeline Odoo completo" -ForegroundColor Green

    $args = @{
        Nombre = $Nombre
        TipoEmpresa = $TipoEmpresa
        Necesidad = $Necesidad
    }

    if (-not [string]::IsNullOrWhiteSpace($Problemas)) { $args["Problemas"] = $Problemas }
    if (-not [string]::IsNullOrWhiteSpace($Objetivo)) { $args["Objetivo"] = $Objetivo }
    if (-not [string]::IsNullOrWhiteSpace($ModulosIniciales)) { $args["ModulosIniciales"] = $ModulosIniciales }
    if (-not [string]::IsNullOrWhiteSpace($ModulosFuturos)) { $args["ModulosFuturos"] = $ModulosFuturos }
    if (-not [string]::IsNullOrWhiteSpace($Riesgos)) { $args["Riesgos"] = $Riesgos }

    if (-not [string]::IsNullOrWhiteSpace($CommitMessage)) {
        $args["CommitMessage"] = $CommitMessage
    }

    & powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_odoo.ps1" @args

    $rutaElegida = "Pipeline Odoo completo"
    $resultado = "Cliente, propuesta, QA, tareas, eventos y push a GitHub ejecutados por autonexus_odoo.ps1"
}
else {
    Write-Host "Ruta elegida: registro y clasificación general" -ForegroundColor Yellow

    $taskId = Get-NextTaskId

    & powershell -ExecutionPolicy Bypass -File ".\scripts\router_tarea.ps1" `
      -Id $taskId `
      -Descripcion $Pedido

    $rutaElegida = "Router general de tareas"
    $resultado = "Pedido registrado y clasificado. Requiere desarrollo de pipeline específico si se repite o si necesita ejecución automática."
}

$reporte = @"
# Última Ejecución Autonexus OS

## Fecha

$fecha

## Pedido recibido

$Pedido

## Ruta elegida

$rutaElegida

## Resultado

$resultado

---

## Conversación operativa simulada

### Dirección

Solicita ejecutar o clasificar el pedido.

### Agente PM

Interpreta la intención, define ruta y nivel de trabajo.

### Router / Pipeline

Ejecuta la ruta disponible según el tipo de pedido.

### Agente QA

Debe revisar entregables antes de uso externo.

### Brain

Guarda clientes, propuestas, reportes, tareas y eventos.

---

## Estado

Ejecución registrada.

Si el pedido corresponde a un flujo no automatizado todavía, debe convertirse en proceso, script o skill.
"@

Set-Content -Path ".\output\reportes\ultima_ejecucion_autonexus.md" -Value $reporte -Encoding UTF8

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    & powershell -ExecutionPolicy Bypass -File ".\scripts\panel_autonexus.ps1"
}

git add .\scripts\autonexus.ps1 `
        .\output\reportes\ultima_ejecucion_autonexus.md `
        .\TASKS.md `
        .\graph\events.json `
        .\ui\panel_autonexus.html `
        .\output\reportes\estado_autonexus_os.md 2>$null

$changes = git status --porcelain

if (-not [string]::IsNullOrWhiteSpace($changes)) {
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "Ejecutar orquestador maestro Autonexus"
    }

    git commit -m $CommitMessage
    git push
}

git status

Write-Host ""
Write-Host "Orquestador finalizado." -ForegroundColor Green
Write-Host "Reporte: .\output\reportes\ultima_ejecucion_autonexus.md"
Write-Host "Panel: .\ui\panel_autonexus.html"
Write-Host ""

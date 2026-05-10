param(
    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Id = "",
    [string]$Nombre = "",
    [string]$TipoEmpresa = "",
    [string]$Necesidad = "",
    [string]$Problemas = "",
    [string]$Objetivo = "",
    [string]$ModulosIniciales = "",
    [string]$ModulosFuturos = "",
    [string]$Riesgos = ""
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

function HtmlEncode {
    param([string]$Text)
    return [System.Net.WebUtility]::HtmlEncode($Text)
}

if ([string]::IsNullOrWhiteSpace($Id)) {
    $Id = Get-NextTaskId
}

New-Item -ItemType Directory -Force -Path ".\brain\conversaciones" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null
New-Item -ItemType Directory -Force -Path ".\ui" | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$pedidoLower = $Pedido.ToLower()
$safeId = Convert-ToSafeName $Id

$isOdoo = $pedidoLower -match "odoo|crm|ventas|presupuesto|propuesta|cliente|facturacion|facturación|productos|listas de precios"
$isPanel = $pedidoLower -match "panel|html|interfaz|visual|grafo|dashboard|ui|ux"
$isAutomatizacion = $pedidoLower -match "n8n|automatizacion|automatización|workflow|webhook|hook|mcp"

$ruta = "router general"
$agentes = "Agente PM + Agente Documentador"
$skill = "Orquestación de Agentes + Cierre de Tarea"
$riesgo = "bajo"
$nivel = 1
$resultado = "Pedido clasificado y conversación de agentes registrada."

$conversacion = New-Object System.Collections.Generic.List[string]

$conversacion.Add("# Conversación de Agentes — $Id")
$conversacion.Add("")
$conversacion.Add("## Fecha")
$conversacion.Add("")
$conversacion.Add($fecha)
$conversacion.Add("")
$conversacion.Add("## Pedido de Dirección")
$conversacion.Add("")
$conversacion.Add($Pedido)
$conversacion.Add("")
$conversacion.Add("---")
$conversacion.Add("")
$conversacion.Add("## Conversación operativa")
$conversacion.Add("")
$conversacion.Add("### Dirección")
$conversacion.Add("Necesito que el sistema interprete este pedido, elija una ruta de trabajo y deje trazabilidad.")
$conversacion.Add("")
$conversacion.Add("### Agente PM")
$conversacion.Add("Analizo intención, riesgo, agentes necesarios y ruta disponible.")

if ($isOdoo -and -not [string]::IsNullOrWhiteSpace($Nombre) -and -not [string]::IsNullOrWhiteSpace($TipoEmpresa) -and -not [string]::IsNullOrWhiteSpace($Necesidad)) {
    $ruta = "pipeline Odoo completo"
    $agentes = "Agente PM + Agente Comercial + Agente Odoo + Agente QA"
    $skill = "Propuesta Cliente + Auditoría Odoo + QA Preproducción + Orquestación de Agentes"
    $riesgo = "medio"
    $nivel = 2
    $resultado = "Se ejecutó pipeline Odoo completo desde conversación de agentes."

    $conversacion.Add("")
    $conversacion.Add("### Agente Comercial")
    $conversacion.Add("Detecto oportunidad comercial. Corresponde crear cliente, propuesta y dejarla como borrador interno.")
    $conversacion.Add("")
    $conversacion.Add("### Agente Odoo")
    $conversacion.Add("Detecto necesidad Odoo. Corresponde trabajar por fases y evitar producción, credenciales o facturación real sin aprobación.")
    $conversacion.Add("")
    $conversacion.Add("### Agente QA")
    $conversacion.Add("Se requiere QA automático y aprobación de Dirección antes de uso externo.")
    $conversacion.Add("")
    $conversacion.Add("### Decisión de ruta")
    $conversacion.Add("Ruta elegida: pipeline Odoo completo.")

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

    & powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_odoo.ps1" @args
}
else {
    if ($isOdoo) {
        $ruta = "router general: intención Odoo sin datos completos de cliente"
        $agentes = "Agente PM + Agente Odoo + Agente QA"
        $skill = "Auditoría Odoo + Orquestación de Agentes"
        $riesgo = "medio"
        $nivel = 2
        $conversacion.Add("")
        $conversacion.Add("### Agente Odoo")
        $conversacion.Add("Hay intención Odoo, pero faltan datos mínimos para ejecutar pipeline completo.")
    }
    elseif ($isPanel) {
        $ruta = "router general: panel / visualización"
        $agentes = "Agente PM + Agente Web/Dev + Agente QA"
        $skill = "QA Preproducción + Orquestación de Agentes"
        $riesgo = "medio"
        $nivel = 2
        $conversacion.Add("")
        $conversacion.Add("### Agente Web/Dev")
        $conversacion.Add("El pedido apunta a visualización, panel, interfaz o grafo. Se debe crear pipeline visual específico.")
    }
    elseif ($isAutomatizacion) {
        $ruta = "router general: automatización"
        $agentes = "Agente PM + Agente Automatizaciones + Agente QA"
        $skill = "Cierre de Tarea + Orquestación de Agentes"
        $riesgo = "medio"
        $nivel = 3
        $conversacion.Add("")
        $conversacion.Add("### Agente Automatizaciones")
        $conversacion.Add("El pedido apunta a workflow, n8n, hooks o automatización. Requiere pipeline específico y revisión de permisos.")
    }
    else {
        $conversacion.Add("")
        $conversacion.Add("### Agente Documentador")
        $conversacion.Add("Pedido general. Se registra, clasifica y queda como base para futuro proceso o skill.")
    }

    $conversacion.Add("")
    $conversacion.Add("### Agente QA")
    $conversacion.Add("No se ejecutan acciones sensibles. Se registra el pedido y se deja trazabilidad.")
    $conversacion.Add("")
    $conversacion.Add("### Decisión de ruta")
    $conversacion.Add("Ruta elegida: $ruta")

    & powershell -ExecutionPolicy Bypass -File ".\scripts\registrar_tarea.ps1" `
      -Id $Id `
      -Descripcion $Pedido `
      -Tipo "orquestación + clasificación" `
      -Objeto "brain/conversaciones/conversacion_${safeId}.md" `
      -Agente $agentes `
      -Skill $skill `
      -NivelPermiso $nivel `
      -Riesgo $riesgo `
      -Resultado $resultado `
      -Aprendizaje "El orquestador maestro registra conversaciones entre agentes y define rutas de trabajo."
}

$conversacion.Add("")
$conversacion.Add("---")
$conversacion.Add("")
$conversacion.Add("## Resultado")
$conversacion.Add("")
$conversacion.Add("- Ruta: $ruta")
$conversacion.Add("- Agentes: $agentes")
$conversacion.Add("- Skill: $skill")
$conversacion.Add("- Riesgo: $riesgo")
$conversacion.Add("- Permiso: $nivel")
$conversacion.Add("")
$conversacion.Add("## Próxima mejora")
$conversacion.Add("")
$conversacion.Add("Convertir esta conversación en panel vivo con nodos, agentes y relaciones dinámicas.")

$convPath = ".\brain\conversaciones\conversacion_${safeId}.md"
Set-Content -Path $convPath -Value ($conversacion -join "`r`n") -Encoding UTF8

$encoded = HtmlEncode (($conversacion -join "`r`n"))

$html = @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Autonexus OS · Conversación de Agentes</title>
<style>
body{margin:0;background:#0b1020;color:#edf3ff;font-family:Segoe UI,Arial,sans-serif}
main{max-width:1100px;margin:0 auto;padding:28px}
.card{background:#121a2f;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:22px}
h1{margin-top:0}
pre{white-space:pre-wrap;line-height:1.55;background:#060913;border:1px solid rgba(255,255,255,.12);padding:18px;border-radius:18px;color:#d7ecff}
.muted{color:#95a3b8}
</style>
</head>
<body>
<main>
<div class="card">
<h1>Autonexus OS · Conversación de Agentes</h1>
<p class="muted">Vista generada desde $convPath</p>
<pre>$encoded</pre>
</div>
</main>
</body>
</html>
"@

Set-Content -Path ".\ui\conversacion_agentes.html" -Value $html -Encoding UTF8

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    & powershell -ExecutionPolicy Bypass -File ".\scripts\panel_autonexus.ps1"
}

Write-Host ""
Write-Host "Conversación de agentes creada:" -ForegroundColor Green
Write-Host $convPath
Write-Host "Vista HTML: .\ui\conversacion_agentes.html"
Write-Host ""

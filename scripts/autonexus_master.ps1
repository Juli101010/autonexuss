param(
    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Nombre = "",
    [string]$TipoEmpresa = "",
    [string]$Necesidad = "",
    [string]$Titulo = "",
    [string]$TipoDocumento = "documento interno",
    [string]$TipoWeb = "prototipo HTML interno",
    [string]$Objetivo = "",
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

function Build-Title {
    param(
        [string]$Prefix,
        [string]$Text
    )

    $t = $Text.Trim()
    if ($t.Length -gt 70) {
        $t = $t.Substring(0,70)
    }

    return "$Prefix - $t"
}

function Register-MasterTask {
    param(
        [string]$Ruta,
        [string]$Resultado
    )

    $taskId = Get-NextTaskId

    powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
      -Id $taskId `
      -Descripcion "Ejecutar orquestador maestro modular: $Pedido" `
      -Tipo "orquestador maestro + $Ruta" `
      -Objeto "output/reportes/master_ultima_ruta.md" `
      -Agente "Agente PM + Agente QA + Agente Automatizaciones" `
      -Skill "Orquestación de Agentes + QA Preproducción + Cierre de Tarea" `
      -NivelPermiso 3 `
      -Riesgo "medio" `
      -Resultado $Resultado `
      -Aprendizaje "El orquestador maestro decide rutas entre Odoo, documentos, WebDev, automatizaciones, investigación, auto-mejora y Dev."
}

New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$pedidoLower = $Pedido.ToLower()

$isSelf = $pedidoLower -match "auto.mejor|auto mejora|mejorarse|mejorar sistema|mejore a si mismo|mejore a sí mismo|cambiar politica|cambiar política|cambiar permisos|restricciones internas|crear agente|crear skill"
$isDev = $pedidoLower -match "github|issue|changelog|release|release notes|rama|branch|commit|rollback|dev|codigo|código|repositorio"
$isResearch = $pedidoLower -match "investigar|investigacion|investigación|scraping|prospectar|prospeccion|prospección|leads|oportunidades|buscar empresas|buscar clientes|fuentes"
$isAutomation = $pedidoLower -match "automatizacion|automatización|n8n|webhook|workflow|hook|mcp|integracion|integración|api"
$isWeb = $pedidoLower -match "web|html|landing|panel|dashboard|interfaz|ui|ux|prototipo visual|pagina|página"
$isOdoo = $pedidoLower -match "odoo|crm|ventas|presupuesto|propuesta comercial|facturacion|facturación|productos|listas de precios|erp"
$isDoc = $pedidoLower -match "documento|informe|manual|resumen|checklist|mapa|plan|estrategia|reporte|procedimiento"

$ruta = "documentos"
$resultado = "Pedido convertido en documento interno por ruta general."
$archivoPrincipal = ""

Write-Host ""
Write-Host "AUTONEXUS MASTER · ORQUESTADOR MODULAR" -ForegroundColor Cyan
Write-Host "Pedido: $Pedido"
Write-Host ""

if ($isSelf -and (Test-Path ".\scripts\autonexus_self_improve.ps1")) {
    $ruta = "auto-mejora"
    $resultado = "Propuesta de auto-mejora creada para aprobación de Dirección."

    Write-Host "Ruta elegida: AUTO-MEJORA CONTROLADA" -ForegroundColor Green

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_self_improve.ps1 `
      -Modo "PROPOSE" `
      -Pedido $Pedido

    $archivoPrincipal = "output/mejoras/"
}
elseif ($isOdoo -and -not [string]::IsNullOrWhiteSpace($Nombre) -and -not [string]::IsNullOrWhiteSpace($TipoEmpresa) -and -not [string]::IsNullOrWhiteSpace($Necesidad) -and (Test-Path ".\scripts\autonexus_odoo.ps1")) {
    $ruta = "Odoo"
    $resultado = "Pipeline Odoo ejecutado: cliente, propuesta, QA, tareas, eventos y GitHub."

    Write-Host "Ruta elegida: ODOO COMPLETO" -ForegroundColor Green

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_odoo.ps1 `
      -Nombre $Nombre `
      -TipoEmpresa $TipoEmpresa `
      -Necesidad $Necesidad

    $safeNombre = Convert-ToSafeName $Nombre
    $archivoPrincipal = "output/propuestas/propuesta_odoo_${safeNombre}_generada.md"
}
elseif ($isDev -and (Test-Path ".\scripts\autonexus_dev.ps1")) {
    $ruta = "GitHub/Dev"
    $resultado = "Paquete GitHub/Dev generado: issue, plan, changelog, release notes y QA."

    Write-Host "Ruta elegida: GITHUB / DEV" -ForegroundColor Green

    if ([string]::IsNullOrWhiteSpace($Titulo)) {
        $Titulo = Build-Title "Cambio Dev" $Pedido
    }

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_dev.ps1 `
      -Titulo $Titulo `
      -Pedido $Pedido `
      -TipoCambio "mejora interna" `
      -Impacto "medio"

    $safeTitulo = Convert-ToSafeName $Titulo
    $archivoPrincipal = "output/dev/issue_${safeTitulo}.md"
}
elseif ($isResearch -and (Test-Path ".\scripts\autonexus_research.ps1")) {
    $ruta = "investigación / prospección"
    $resultado = "Diseño de investigación generado con fuentes, queries, scoring, CSV base y QA."

    Write-Host "Ruta elegida: INVESTIGACIÓN / PROSPECCIÓN" -ForegroundColor Green

    if ([string]::IsNullOrWhiteSpace($Titulo)) {
        $Titulo = Build-Title "Investigación" $Pedido
    }

    if ([string]::IsNullOrWhiteSpace($Objetivo)) {
        $Objetivo = $Pedido
    }

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_research.ps1 `
      -Nombre $Titulo `
      -Objetivo $Objetivo

    $safeTitulo = Convert-ToSafeName $Titulo
    $archivoPrincipal = "output/investigacion/investigacion_${safeTitulo}.md"
}
elseif ($isAutomation -and (Test-Path ".\scripts\autonexus_auto.ps1")) {
    $ruta = "automatizaciones / n8n / hooks"
    $resultado = "Blueprint de automatización generado con diseño, n8n JSON, hook spec y QA."

    Write-Host "Ruta elegida: AUTOMATIZACIONES / N8N / HOOKS" -ForegroundColor Green

    if ([string]::IsNullOrWhiteSpace($Titulo)) {
        $Titulo = Build-Title "Automatización" $Pedido
    }

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_auto.ps1 `
      -Nombre $Titulo `
      -Pedido $Pedido

    $safeTitulo = Convert-ToSafeName $Titulo
    $archivoPrincipal = "output/automatizaciones/automatizacion_${safeTitulo}.md"
}
elseif ($isWeb -and (Test-Path ".\scripts\autonexus_web.ps1")) {
    $ruta = "Web/Dev"
    $resultado = "Prototipo HTML generado con QA Web/Dev."

    Write-Host "Ruta elegida: WEB / DEV VISUAL" -ForegroundColor Green

    if ([string]::IsNullOrWhiteSpace($Titulo)) {
        $Titulo = Build-Title "Prototipo Web" $Pedido
    }

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_web.ps1 `
      -Titulo $Titulo `
      -TipoWeb $TipoWeb `
      -Pedido $Pedido

    $safeTitulo = Convert-ToSafeName $Titulo
    $archivoPrincipal = "output/web/web_${safeTitulo}.html"
}
else {
    $ruta = "documentos"
    $resultado = "Documento interno generado desde ruta general."

    Write-Host "Ruta elegida: DOCUMENTOS / GENERAL" -ForegroundColor Yellow

    if ([string]::IsNullOrWhiteSpace($Titulo)) {
        $Titulo = Build-Title "Documento" $Pedido
    }

    powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_doc.ps1 `
      -Titulo $Titulo `
      -TipoDocumento $TipoDocumento `
      -Pedido $Pedido

    $safeTitulo = Convert-ToSafeName $Titulo
    $archivoPrincipal = "output/documentos/documento_${safeTitulo}.md"
}

$masterReport = @"
# Última Ruta del Orquestador Maestro

## Fecha

$fecha

## Pedido

$Pedido

## Ruta elegida

$ruta

## Resultado

$resultado

## Archivo principal estimado

$archivoPrincipal

---

# Lectura operativa

Dirección ingresa un pedido.  
Autonexus Master detecta intención, elige pipeline y delega en el módulo correspondiente.

Módulos disponibles:

- Odoo
- Documentos
- Web/Dev
- Automatizaciones / n8n / hooks
- Investigación / prospección
- Auto-mejora controlada
- GitHub/Dev

---

# Próximo salto

Convertir este orquestador en una interfaz visual donde Dirección escriba un pedido y vea:

- ruta elegida
- agentes involucrados
- archivos generados
- QA
- eventos
- grafo
"@

Set-Content -Path ".\output\reportes\master_ultima_ruta.md" -Value $masterReport -Encoding UTF8

Register-MasterTask -Ruta $ruta -Resultado $resultado

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_master.ps1 `
        .\output\reportes\master_ultima_ruta.md `
        .\TASKS.md `
        .\graph\events.json `
        .\ui\panel_autonexus.html `
        .\output `
        .\brain `
        .\workflows `
        .\releases 2>$null

$changes = git status --porcelain

if (-not [string]::IsNullOrWhiteSpace($changes)) {
    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "Ejecutar orquestador maestro modular"
    }

    git commit -m $CommitMessage
    git push
}

git status

Write-Host ""
Write-Host "Orquestador maestro finalizado." -ForegroundColor Green
Write-Host "Ruta elegida: $ruta"
Write-Host "Reporte: .\output\reportes\master_ultima_ruta.md"
Write-Host ""

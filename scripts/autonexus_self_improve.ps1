param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("PROPOSE","APPROVE","APPLY")]
    [string]$Modo,

    [string]$Pedido = "",
    [string]$MejoraId = "",
    [string]$CommitMessage = ""
)

function Set-JsonProperty {
    param(
        [Parameter(Mandatory=$true)]
        [object]$Object,

        [Parameter(Mandatory=$true)]
        [string]$Name,

        [Parameter(Mandatory=$true)]
        [object]$Value
    )

    if ($Object.PSObject.Properties.Name -contains $Name) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -MemberType NoteProperty -Name $Name -Value $Value
    }
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

function Get-NextTaskId {
    $tasksPath = ".\TASKS.md"
    if (-not (Test-Path $tasksPath)) { return "TASK-001" }

    $tasksText = Get-Content $tasksPath -Raw
    $matches = [regex]::Matches($tasksText, "TASK-(\d+)")
    $max = 0

    foreach ($m in $matches) {
        $num = [int]$m.Groups[1].Value
        if ($num -gt $max) { $max = $num }
    }

    return ("TASK-{0:D3}" -f ($max + 1))
}

function Get-NextImprovementId {
    New-Item -ItemType Directory -Force -Path ".\output\mejoras" | Out-Null
    $files = @(Get-ChildItem ".\output\mejoras" -Filter "mejora_*.json" -ErrorAction SilentlyContinue)
    $max = 0

    foreach ($f in $files) {
        $m = [regex]::Match($f.BaseName, "mejora_(\d+)")
        if ($m.Success) {
            $n = [int]$m.Groups[1].Value
            if ($n -gt $max) { $max = $n }
        }
    }

    return ("MEJORA-{0:D3}" -f ($max + 1))
}

function Register-AutonexusTask {
    param(
        [string]$Descripcion,
        [string]$Tipo,
        [string]$Objeto,
        [string]$Resultado,
        [string]$Aprendizaje
    )

    $taskId = Get-NextTaskId

    powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
      -Id $taskId `
      -Descripcion $Descripcion `
      -Tipo $Tipo `
      -Objeto $Objeto `
      -Agente "Agente PM + Agente QA + Agente Automatizaciones" `
      -Skill "Orquestación de Agentes + QA Preproducción + Cierre de Tarea" `
      -NivelPermiso 3 `
      -Riesgo "medio" `
      -Resultado $Resultado `
      -Aprendizaje $Aprendizaje
}

New-Item -ItemType Directory -Force -Path ".\output\mejoras" | Out-Null
New-Item -ItemType Directory -Force -Path ".\brain\governance" | Out-Null

if ($Modo -eq "PROPOSE") {
    if ([string]::IsNullOrWhiteSpace($Pedido)) {
        Write-Host "ERROR: Para PROPOSE tenés que pasar -Pedido." -ForegroundColor Red
        exit
    }

    if ([string]::IsNullOrWhiteSpace($MejoraId)) {
        $MejoraId = Get-NextImprovementId
    }

    $safeId = Convert-ToSafeName $MejoraId
    $jsonPath = ".\output\mejoras\mejora_${safeId}.json"
    $mdPath = ".\output\mejoras\mejora_${safeId}.md"
    $fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $pedidoLower = $Pedido.ToLower()

    $categoria = "mejora_general"
    if ($pedidoLower -match "agente|agentes") { $categoria = "agentes" }
    elseif ($pedidoLower -match "skill|skills") { $categoria = "skills" }
    elseif ($pedidoLower -match "panel|visual|html|dashboard|grafo") { $categoria = "visualizacion" }
    elseif ($pedidoLower -match "permiso|politica|política|restriccion|restricción|limite|límite") { $categoria = "politicas_internas" }
    elseif ($pedidoLower -match "pipeline|flujo|automatizacion|automatización|n8n|hook") { $categoria = "pipelines_automatizacion" }

    $proposal = [PSCustomObject]@{
        id = $MejoraId
        status = "proposed"
        created_at = $fecha
        requested_by = "Direccion"
        category = $categoria
        request = $Pedido
        requires_direction_approval = $true
        risk = "medio"
        can_apply_automatically = $true
        affected_areas = @("brain/governance", "scripts", "TASKS.md", "graph/events.json")
        rollback = "usar git revert del commit aplicado"
    }

    $proposal | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonPath -Encoding UTF8

    $md = @"
# Propuesta de Auto-Mejora: $MejoraId

## Estado

Propuesta.  
No aplicada todavía.

## Fecha

$fecha

## Pedido de Dirección

$Pedido

## Categoría

$categoria

---

# 1. Impacto esperado

Esta mejora busca permitir que Autonexus OS evolucione su propia estructura interna sin perder control humano.

Puede afectar:

- agentes
- skills
- pipelines
- políticas internas
- paneles
- QA
- documentación
- rutas de trabajo

---

# 2. Riesgo

Riesgo medio.

Toda aplicación requiere aprobación explícita de Dirección.

---

# 3. Condición de aplicación

Solo aplicar si Dirección aprueba la mejora.

---

# 4. Rollback

Si el cambio no funciona, revertir con Git.
"@

    Set-Content -Path $mdPath -Value $md -Encoding UTF8

    Register-AutonexusTask `
      -Descripcion "Proponer auto-mejora: $MejoraId" `
      -Tipo "auto-mejora + propuesta" `
      -Objeto $mdPath `
      -Resultado "Propuesta de auto-mejora creada" `
      -Aprendizaje "Autonexus OS puede proponer mejoras internas sin aplicarlas automáticamente."

    Write-Host ""
    Write-Host "Propuesta creada:" -ForegroundColor Green
    Write-Host $mdPath
    Write-Host $jsonPath
    Write-Host ""
    exit
}

if ([string]::IsNullOrWhiteSpace($MejoraId)) {
    Write-Host "ERROR: Para APPROVE o APPLY tenés que pasar -MejoraId." -ForegroundColor Red
    exit
}

$safeApplyId = Convert-ToSafeName $MejoraId
$jsonApplyPath = ".\output\mejoras\mejora_${safeApplyId}.json"

if (-not (Test-Path $jsonApplyPath)) {
    Write-Host "ERROR: No existe la mejora:" -ForegroundColor Red
    Write-Host $jsonApplyPath
    exit
}

$mejora = Get-Content $jsonApplyPath -Raw | ConvertFrom-Json

if ($Modo -eq "APPROVE") {
    $mejora.status = "approved_by_direction"
    Set-JsonProperty -Object $mejora -Name "approved_at" -Value (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    $mejora | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonApplyPath -Encoding UTF8

    Register-AutonexusTask `
      -Descripcion "Aprobar auto-mejora: $MejoraId" `
      -Tipo "auto-mejora + aprobación" `
      -Objeto $jsonApplyPath `
      -Resultado "Auto-mejora aprobada por Dirección" `
      -Aprendizaje "Las mejoras internas requieren aprobación antes de aplicarse."

    Write-Host ""
    Write-Host "Mejora aprobada por Dirección:" -ForegroundColor Green
    Write-Host $MejoraId
    Write-Host ""
    exit
}

if ($Modo -eq "APPLY") {
    if ($mejora.status -ne "approved_by_direction") {
        Write-Host "ERROR: La mejora no está aprobada por Dirección." -ForegroundColor Red
        Write-Host "Estado actual: $($mejora.status)"
        exit
    }

    $appliedPath = ".\brain\governance\applied_improvements.md"
    $fechaApply = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $entry = @"

---

## $MejoraId

- Fecha: $fechaApply
- Pedido: $($mejora.request)
- Categoría: $($mejora.category)
- Estado: aplicado
- Responsable final: Dirección
- Rollback: usar git revert del commit correspondiente
"@

    Add-Content -Path $appliedPath -Value $entry -Encoding UTF8

    $policyPath = ".\brain\governance\policy.json"
    if (Test-Path $policyPath) {
        $policy = Get-Content $policyPath -Raw | ConvertFrom-Json
        Set-JsonProperty -Object $policy -Name "last_internal_improvement" -Value $MejoraId
        Set-JsonProperty -Object $policy -Name "last_internal_improvement_at" -Value $fechaApply
        Set-JsonProperty -Object $policy -Name "internal_self_improvement_enabled" -Value $true
        Set-JsonProperty -Object $policy -Name "direction_keeps_final_control" -Value $true
        $policy | ConvertTo-Json -Depth 10 | Set-Content -Path $policyPath -Encoding UTF8
    }

    $mejora.status = "applied"
    Set-JsonProperty -Object $mejora -Name "applied_at" -Value $fechaApply
    $mejora | ConvertTo-Json -Depth 10 | Set-Content -Path $jsonApplyPath -Encoding UTF8

    Register-AutonexusTask `
      -Descripcion "Aplicar auto-mejora: $MejoraId" `
      -Tipo "auto-mejora + aplicación controlada" `
      -Objeto $appliedPath `
      -Resultado "Auto-mejora aplicada con control de Dirección" `
      -Aprendizaje "Autonexus OS puede aplicar mejoras internas aprobadas y dejar trazabilidad."

    if (Test-Path ".\scripts\panel_autonexus.ps1") {
        powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
    }

    git add .\brain\governance `
            .\output\mejoras `
            .\TASKS.md `
            .\graph\events.json `
            .\ui\panel_autonexus.html 2>$null

    if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
        $CommitMessage = "Aplicar auto-mejora $MejoraId"
    }

    git commit -m $CommitMessage
    git push
    git status

    Write-Host ""
    Write-Host "Mejora aplicada y subida a GitHub:" -ForegroundColor Green
    Write-Host $MejoraId
    Write-Host ""
}


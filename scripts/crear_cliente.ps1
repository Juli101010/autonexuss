param(
    [Parameter(Mandatory=$true)]
    [string]$Nombre,

    [Parameter(Mandatory=$true)]
    [string]$Tipo,

    [Parameter(Mandatory=$true)]
    [string]$Necesidad,

    [string]$Problemas = "",
    [string]$Objetivo = "",
    [string]$ModulosIniciales = "",
    [string]$ModulosFuturos = "",
    [string]$Riesgos = "",
    [string]$Id = ""
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
        if ($num -gt $max) {
            $max = $num
        }
    }

    return ("TASK-{0:D3}" -f ($max + 1))
}

function Format-List {
    param(
        [string]$Text,
        [string]$DefaultText
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $DefaultText
    }

    $items = $Text -split ";|\r?\n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    if ($items.Count -eq 0) {
        return $DefaultText
    }

    return (($items | ForEach-Object { "- " + $_.Trim() }) -join "`r`n")
}

if ([string]::IsNullOrWhiteSpace($Id)) {
    $Id = Get-NextTaskId
}

$safeNombre = Convert-ToSafeName $Nombre
$clientesDir = ".\brain\clientes"
New-Item -ItemType Directory -Force -Path $clientesDir | Out-Null

$outFile = ".\brain\clientes\cliente_${safeNombre}.md"

$problemasTxt = Format-List $Problemas "- información dispersa`r`n- procesos poco documentados`r`n- seguimiento manual`r`n- necesidad de ordenar datos"
$modulosInicialesTxt = Format-List $ModulosIniciales "- CRM`r`n- Ventas`r`n- Contactos`r`n- Productos o servicios`r`n- Reportes básicos"
$modulosFuturosTxt = Format-List $ModulosFuturos "- Facturación`r`n- Inventario`r`n- Automatizaciones`r`n- Dashboards"
$riesgosTxt = Format-List $Riesgos "- datos incompletos`r`n- procesos no definidos`r`n- falta de responsable interno`r`n- avanzar sobre producción sin validación"

if ([string]::IsNullOrWhiteSpace($Objetivo)) {
    $Objetivo = "Implementar una solución progresiva que permita ordenar la operación, mejorar el seguimiento y preparar una segunda etapa de automatización o integración."
}

$contenido = @"
# Cliente: $Nombre

## Estado

Cliente registrado en Autonexus OS.

## Tipo de empresa

$Tipo

## Necesidad principal

$Necesidad

## Problemas actuales

$problemasTxt

## Objetivo buscado

$Objetivo

## Módulos iniciales sugeridos

$modulosInicialesTxt

## Módulos o mejoras para segunda etapa

$modulosFuturosTxt

## Riesgos detectados

$riesgosTxt

## Recomendación inicial

Comenzar con una fase de relevamiento, diagnóstico y normalización antes de avanzar sobre procesos sensibles, producción, credenciales, facturación real o integraciones críticas.

## Gobierno Autonexus

Este cliente queda registrado en Brain para uso interno.

Toda propuesta, presupuesto, compromiso comercial o envío externo requiere aprobación de Dirección.
"@

Set-Content -Path $outFile -Value $contenido -Encoding UTF8

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $Id `
  -Descripcion "Crear ficha de cliente para $Nombre" `
  -Tipo "cliente + documentación" `
  -Objeto $outFile `
  -Agente "Agente Comercial + Agente Documentador" `
  -Skill "Propuesta Cliente + Cierre de Tarea" `
  -NivelPermiso 1 `
  -Riesgo "bajo" `
  -Resultado "Ficha de cliente creada en Brain" `
  -Aprendizaje "El sistema ya puede crear clientes desde consola y dejarlos listos para generar propuestas."

Write-Host ""
Write-Host "Cliente creado correctamente:" -ForegroundColor Green
Write-Host $outFile
Write-Host ""

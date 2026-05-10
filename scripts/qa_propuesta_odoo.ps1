param(
    [Parameter(Mandatory=$true)]
    [string]$Propuesta,

    [string]$Id = ""
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

if ([string]::IsNullOrWhiteSpace($Id)) {
    $Id = Get-NextTaskId
}

if (-not (Test-Path $Propuesta)) {
    Write-Host "ERROR: No existe la propuesta indicada:" -ForegroundColor Red
    Write-Host $Propuesta
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$contenido = Get-Content $Propuesta -Raw
$nombreBase = [System.IO.Path]::GetFileNameWithoutExtension($Propuesta)
$safeName = Convert-ToSafeName $nombreBase
$outFile = ".\output\reportes\qa_${safeName}.md"

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]
$riesgos = New-Object System.Collections.Generic.List[string]

# Evaluaciones simples
if ($contenido -match "Diagnóstico|Diagnostico") { $puntaje += 15 } else { $observaciones.Add("Falta o es débil la sección de diagnóstico.") }
if ($contenido -match "Alcance|Fase") { $puntaje += 15 } else { $observaciones.Add("Falta alcance por fases o etapas.") }
if ($contenido -match "Supuestos") { $puntaje += 10 } else { $observaciones.Add("Falta sección de supuestos.") }
if ($contenido -match "Exclusiones") { $puntaje += 10 } else { $observaciones.Add("Falta sección de exclusiones.") }
if ($contenido -match "Riesgos|cuidados") { $puntaje += 15 } else { $observaciones.Add("Falta sección de riesgos.") }
if ($contenido -match "Próximos pasos|Proximos pasos") { $puntaje += 10 } else { $observaciones.Add("Falta sección de próximos pasos.") }
if ($contenido -match "Dirección|aprobación|aprobacion") { $puntaje += 15 } else { $observaciones.Add("Falta referencia a aprobación de Dirección.") }
if ($contenido -match "precio|precios|plazo|plazos") {
    $riesgos.Add("La propuesta menciona precios o plazos. Revisar si están aprobados por Dirección.")
} else {
    $puntaje += 10
}

if ($contenido -match "producción|credenciales|facturación real|inventario productivo") {
    $riesgos.Add("La propuesta menciona procesos sensibles. Verificar que estén tratados como exclusiones, riesgos o fases futuras.")
}

if ($puntaje -ge 85) {
    $estado = "Aprobado como borrador interno"
}
elseif ($puntaje -ge 65) {
    $estado = "Aprobado con observaciones"
}
else {
    $estado = "Bloqueado para envío"
}

if ($observaciones.Count -eq 0) {
    $observacionesTxt = "- Sin observaciones críticas."
} else {
    $observacionesTxt = ($observaciones | ForEach-Object { "- " + $_ }) -join "`r`n"
}

if ($riesgos.Count -eq 0) {
    $riesgosTxt = "- No se detectaron riesgos críticos adicionales."
} else {
    $riesgosTxt = ($riesgos | ForEach-Object { "- " + $_ }) -join "`r`n"
}

$reporte = @"
# Reporte QA Automático de Propuesta Odoo

## Propuesta revisada

$Propuesta

## Estado QA

$estado

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$observacionesTxt

---

# 2. Riesgos detectados

$riesgosTxt

---

# 3. Decisión

Esta propuesta puede seguir avanzando solo como borrador interno.

No debe enviarse a un cliente real sin:

1. revisión humana,
2. revisión comercial,
3. revisión técnica,
4. aprobación explícita de Dirección.

---

# 4. Próxima acción sugerida

Ajustar las observaciones detectadas y preparar una versión final solamente si Dirección aprueba el avance.

---

# 5. Aprendizaje

Toda propuesta generada automáticamente debe pasar por QA antes de considerarse utilizable.
"@

Set-Content -Path $outFile -Value $reporte -Encoding UTF8

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $Id `
  -Descripcion "Realizar QA automático de propuesta Odoo" `
  -Tipo "QA + comercial + Odoo" `
  -Objeto $Propuesta `
  -Agente "Agente QA + Agente Comercial + Agente Odoo" `
  -Skill "QA Preproducción + Propuesta Cliente + Auditoría Odoo" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Reporte QA automático creado" `
  -Aprendizaje "Las propuestas generadas por script deben revisarse antes de cualquier envío real."

Write-Host ""
Write-Host "QA generado correctamente:" -ForegroundColor Green
Write-Host $outFile
Write-Host ""

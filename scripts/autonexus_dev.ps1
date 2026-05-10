param(
    [Parameter(Mandatory=$true)]
    [string]$Titulo,

    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$TipoCambio = "mejora interna",
    [string]$Impacto = "medio",
    [string]$ArchivosAfectados = "scripts; brain; output; ui; TASKS.md; graph/events.json",
    [string]$RamaSugerida = "",
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

$placeholders = @("Titulo", "Título", "Pedido", "Nombre del cambio")
if ($placeholders -contains $Titulo -or $placeholders -contains $Pedido) {
    Write-Host "ERROR: Estás usando valores de ejemplo. Reemplazalos por datos reales o demo específicos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\dev" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null
New-Item -ItemType Directory -Force -Path ".\releases" | Out-Null

$safeTitulo = Convert-ToSafeName $Titulo
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

if ([string]::IsNullOrWhiteSpace($RamaSugerida)) {
    $RamaSugerida = "feature/$safeTitulo"
}

$issuePath = ".\output\dev\issue_${safeTitulo}.md"
$planPath = ".\output\dev\plan_dev_${safeTitulo}.md"
$changelogPath = ".\releases\changelog_${safeTitulo}.md"
$releasePath = ".\releases\release_notes_${safeTitulo}.md"
$qaPath = ".\output\reportes\qa_dev_${safeTitulo}.md"

$issue = @"
# Issue Dev: $Titulo

## Estado

Borrador interno de issue.  
No crea issue real en GitHub todavía.

## Fecha

$fecha

## Tipo de cambio

$TipoCambio

## Impacto estimado

$Impacto

---

# 1. Pedido recibido

$Pedido

---

# 2. Objetivo técnico

Convertir el pedido en una mejora controlada del sistema, con trazabilidad, QA, changelog y posibilidad de rollback.

---

# 3. Archivos o áreas posiblemente afectadas

$ArchivosAfectados

---

# 4. Criterios de aceptación

- El cambio debe quedar documentado.
- El cambio debe registrar tarea y evento.
- El cambio debe poder revisarse antes de publicarse.
- El cambio debe tener QA técnico.
- El cambio debe quedar versionado en Git.
- Si rompe algo, debe poder revertirse con Git.

---

# 5. Riesgos

- Modificar scripts sin prueba.
- Romper rutas ya funcionales.
- Duplicar tareas o eventos.
- Subir archivos temporales.
- Cambiar comportamiento sin documentarlo.
- No dejar rollback claro.

---

# 6. Decisión

Este issue queda como especificación interna para trabajo GitHub/Dev.
"@

Set-Content -Path $issuePath -Value $issue -Encoding UTF8

$plan = @"
# Plan Técnico Dev: $Titulo

## Rama sugerida

$RamaSugerida

## Commit sugerido

$CommitMessage

## Secuencia recomendada

1. Revisar pedido.
2. Definir alcance mínimo.
3. Identificar archivos afectados.
4. Crear o modificar scripts.
5. Ejecutar prueba local.
6. Generar QA técnico.
7. Actualizar changelog.
8. Commit.
9. Push.
10. Revisar panel.

---

# Checklist técnico

- [ ] No hay secretos en el repo.
- [ ] No hay credenciales.
- [ ] No hay archivos temporales innecesarios.
- [ ] El script corre sin errores.
- [ ] Se registran tareas.
- [ ] Se registran eventos.
- [ ] El panel se actualiza.
- [ ] Hay rollback posible.
"@

Set-Content -Path $planPath -Value $plan -Encoding UTF8

$changelog = @"
# Changelog: $Titulo

## Fecha

$fecha

## Tipo

$TipoCambio

## Cambios previstos

- Se documenta el issue técnico.
- Se genera plan de desarrollo.
- Se crea QA técnico.
- Se preparan release notes.
- Se deja trazabilidad del cambio.

## Impacto

$Impacto

## Rollback

Usar git revert del commit asociado si el cambio no funciona.
"@

Set-Content -Path $changelogPath -Value $changelog -Encoding UTF8

$release = @"
# Release Notes: $Titulo

## Estado

Borrador interno.

## Resumen

Se prepara una mejora de Autonexus OS orientada a:

$Pedido

## Valor esperado

- mayor trazabilidad
- mejor control técnico
- mejor gestión de cambios
- documentación de release
- QA antes de consolidar cambios

## Advertencia

No publicar como release externa sin revisión de Dirección.
"@

Set-Content -Path $releasePath -Value $release -Encoding UTF8

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]

if ($issue -match "Criterios de aceptación") { $puntaje += 20 } else { $observaciones.Add("Faltan criterios de aceptación.") }
if ($issue -match "Riesgos") { $puntaje += 15 } else { $observaciones.Add("Faltan riesgos.") }
if ($plan -match "Rollback") { $puntaje += 15 } else { $observaciones.Add("Falta rollback.") }
if ($plan -match "Checklist") { $puntaje += 15 } else { $observaciones.Add("Falta checklist técnico.") }
if ($changelog -match "Changelog") { $puntaje += 15 } else { $observaciones.Add("Falta changelog.") }
if ($release -match "Release Notes") { $puntaje += 10 } else { $observaciones.Add("Faltan release notes.") }
if ($issue -match "Git") { $puntaje += 10 } else { $observaciones.Add("Falta referencia a Git.") }

if ($puntaje -ge 85) {
    $estadoQA = "Aprobado como paquete Dev interno"
}
elseif ($puntaje -ge 65) {
    $estadoQA = "Aprobado con observaciones"
}
else {
    $estadoQA = "Bloqueado"
}

if ($observaciones.Count -eq 0) {
    $obsTxt = "- Sin observaciones críticas."
} else {
    $obsTxt = ($observaciones | ForEach-Object { "- " + $_ }) -join "`r`n"
}

$qa = @"
# QA Técnico GitHub/Dev

## Issue

$issuePath

## Plan

$planPath

## Changelog

$changelogPath

## Release notes

$releasePath

## Estado QA

$estadoQA

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$obsTxt

---

# 2. Decisión

Este paquete puede usarse como base interna para ordenar cambios técnicos.

No debe considerarse release externa sin:

1. revisión técnica,
2. prueba local,
3. revisión de Dirección,
4. control de archivos versionados,
5. rollback claro.

---

# 3. Aprendizaje

Todo cambio técnico de Autonexus OS debe tener issue, plan, changelog, QA y release notes internas.
"@

Set-Content -Path $qaPath -Value $qa -Encoding UTF8

$taskIssue = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskIssue `
  -Descripcion "Crear paquete GitHub/Dev: $Titulo" `
  -Tipo "GitHub + desarrollo + release" `
  -Objeto $issuePath `
  -Agente "Agente Web/Dev + Agente PM" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Issue, plan técnico, changelog y release notes generados" `
  -Aprendizaje "Autonexus OS puede ordenar cambios técnicos con trazabilidad Dev."

$taskQA = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskQA `
  -Descripcion "Realizar QA técnico GitHub/Dev: $Titulo" `
  -Tipo "QA + GitHub + desarrollo" `
  -Objeto $qaPath `
  -Agente "Agente QA + Agente Web/Dev" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "QA técnico GitHub/Dev generado" `
  -Aprendizaje "Los cambios técnicos necesitan QA y rollback."

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_dev.ps1 `
        .\output\dev `
        .\output\reportes `
        .\releases `
        .\TASKS.md `
        .\graph\events.json `
        .\ui\panel_autonexus.html 2>$null

$changes = git status --porcelain

if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Host "No hay cambios para subir." -ForegroundColor Yellow
    git status
    exit
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Crear paquete GitHub Dev Autonexus: $Titulo"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Paquete GitHub/Dev generado y subido a GitHub." -ForegroundColor Green
Write-Host "Issue: $issuePath"
Write-Host "Plan: $planPath"
Write-Host "Changelog: $changelogPath"
Write-Host "Release: $releasePath"
Write-Host "QA: $qaPath"
Write-Host ""

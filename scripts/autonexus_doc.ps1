param(
    [Parameter(Mandatory=$true)]
    [string]$Titulo,

    [Parameter(Mandatory=$true)]
    [string]$TipoDocumento,

    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Audiencia = "uso interno de Autonexus",
    [string]$Uso = "borrador interno",
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
        if ($num -gt $max) {
            $max = $num
        }
    }

    return ("TASK-{0:D3}" -f ($max + 1))
}

$placeholders = @("Titulo", "Título", "TipoDocumento", "Pedido", "Nombre del Documento")
if ($placeholders -contains $Titulo -or $placeholders -contains $TipoDocumento -or $placeholders -contains $Pedido) {
    Write-Host "ERROR: Estás usando valores de ejemplo. Reemplazalos por datos reales o demo específicos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\documentos" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$safeTitulo = Convert-ToSafeName $Titulo
$docPath = ".\output\documentos\documento_${safeTitulo}.md"
$qaPath = ".\output\reportes\qa_documento_${safeTitulo}.md"
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$documento = @"
# $Titulo

## Estado

Borrador generado por Autonexus OS.  
No usar como versión final sin revisión humana y aprobación de Dirección si corresponde.

## Tipo de documento

$TipoDocumento

## Fecha

$fecha

## Audiencia

$Audiencia

## Uso previsto

$Uso

---

# 1. Pedido recibido

$Pedido

---

# 2. Interpretación del pedido

Autonexus OS interpreta que este documento debe transformar el pedido recibido en una pieza organizada, clara y utilizable.

El documento se genera como primera versión de trabajo, con estructura base, criterios de revisión y advertencias de uso.

---

# 3. Objetivo del documento

El objetivo es producir un material que permita:

- ordenar la información principal
- separar ideas centrales de detalles secundarios
- dejar una base editable
- facilitar revisión posterior
- evitar pérdida de contexto
- preparar una posible versión final

---

# 4. Desarrollo inicial

## 4.1 Contexto

Este documento surge a partir de una solicitud realizada a Autonexus OS.  
La información debe ser revisada, ampliada o ajustada según el caso real.

## 4.2 Ideas centrales

- El pedido debe convertirse en una estructura clara.
- La salida debe poder revisarse y mejorarse.
- Toda versión final requiere control humano.
- Si el documento se usará con clientes, debe pasar por QA.
- Si incluye compromisos, precios, plazos o decisiones sensibles, requiere aprobación de Dirección.

## 4.3 Estructura sugerida

- presentación
- contexto
- objetivo
- desarrollo
- acciones propuestas
- riesgos
- próximos pasos
- estado de revisión

---

# 5. Riesgos y cuidados

Antes de usar este documento como versión final, revisar:

- si falta información importante
- si el tono es adecuado para la audiencia
- si hay promesas no aprobadas
- si hay datos privados o sensibles
- si requiere adaptación al cliente o proyecto real
- si debe transformarse a Word, PDF, presentación o propuesta comercial

---

# 6. Próximos pasos

1. Revisar contenido.
2. Ajustar al caso real.
3. Completar información faltante.
4. Pasar por QA.
5. Definir si queda como documento interno o entregable externo.
6. Solicitar aprobación de Dirección si corresponde.

---

# 7. Estado final

Documento generado como borrador interno por Autonexus OS.
"@

Set-Content -Path $docPath -Value $documento -Encoding UTF8

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]

if ($documento -match "Objetivo") { $puntaje += 20 } else { $observaciones.Add("Falta objetivo claro.") }
if ($documento -match "Pedido recibido") { $puntaje += 15 } else { $observaciones.Add("Falta pedido original.") }
if ($documento -match "Riesgos") { $puntaje += 15 } else { $observaciones.Add("Falta sección de riesgos.") }
if ($documento -match "Próximos pasos") { $puntaje += 15 } else { $observaciones.Add("Falta sección de próximos pasos.") }
if ($documento -match "Dirección|aprobación") { $puntaje += 20 } else { $observaciones.Add("Falta control de Dirección.") }
if ($documento -match "Estado") { $puntaje += 15 } else { $observaciones.Add("Falta estado del documento.") }

if ($puntaje -ge 85) {
    $estadoQA = "Aprobado como borrador interno"
}
elseif ($puntaje -ge 65) {
    $estadoQA = "Aprobado con observaciones"
}
else {
    $estadoQA = "Bloqueado para uso externo"
}

if ($observaciones.Count -eq 0) {
    $obsTxt = "- Sin observaciones críticas."
} else {
    $obsTxt = ($observaciones | ForEach-Object { "- " + $_ }) -join "`r`n"
}

$qa = @"
# QA Automático de Documento

## Documento revisado

$docPath

## Estado QA

$estadoQA

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$obsTxt

---

# 2. Decisión

Este documento puede avanzar como borrador interno.

No debe usarse como documento final externo sin:

1. revisión humana,
2. ajuste de contenido,
3. revisión de tono,
4. aprobación de Dirección si corresponde.

---

# 3. Aprendizaje

Todo documento generado por Autonexus OS debe pasar por revisión antes de ser usado como entregable.
"@

Set-Content -Path $qaPath -Value $qa -Encoding UTF8

$taskDoc = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskDoc `
  -Descripcion "Generar documento: $Titulo" `
  -Tipo "documentación + producción interna" `
  -Objeto $docPath `
  -Agente "Agente Documentador + Agente PM" `
  -Skill "Cierre de Tarea + Orquestación de Agentes" `
  -NivelPermiso 1 `
  -Riesgo "bajo" `
  -Resultado "Documento generado como borrador interno" `
  -Aprendizaje "Autonexus OS puede generar documentos internos desde un pedido estructurado."

$taskQA = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskQA `
  -Descripcion "Realizar QA automático del documento: $Titulo" `
  -Tipo "QA + documentación" `
  -Objeto $qaPath `
  -Agente "Agente QA + Agente Documentador" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 1 `
  -Riesgo "bajo" `
  -Resultado "QA automático de documento generado" `
  -Aprendizaje "Los documentos generados también deben tener revisión automática mínima."

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_doc.ps1 `
        .\output\documentos `
        .\output\reportes `
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
    $CommitMessage = "Generar documento Autonexus: $Titulo"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Documento generado y subido a GitHub." -ForegroundColor Green
Write-Host "Documento: $docPath"
Write-Host "QA: $qaPath"
Write-Host ""

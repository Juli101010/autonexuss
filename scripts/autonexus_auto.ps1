param(
    [Parameter(Mandatory=$true)]
    [string]$Nombre,

    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Trigger = "manual",
    [string]$Sistemas = "Autonexus OS",
    [string]$Accion = "diseñar flujo automatizado seguro",
    [string]$Riesgos = "no ejecutar acciones reales sin aprobación",
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

$placeholders = @("Nombre", "Pedido", "Nombre de automatizacion", "Nombre de automatización")
if ($placeholders -contains $Nombre -or $placeholders -contains $Pedido) {
    Write-Host "ERROR: Estás usando valores de ejemplo. Reemplazalos por datos reales o demo específicos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\automatizaciones" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null
New-Item -ItemType Directory -Force -Path ".\workflows\n8n" | Out-Null
New-Item -ItemType Directory -Force -Path ".\workflows\hooks" | Out-Null

$safeNombre = Convert-ToSafeName $Nombre
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$docPath = ".\output\automatizaciones\automatizacion_${safeNombre}.md"
$n8nPath = ".\workflows\n8n\n8n_blueprint_${safeNombre}.json"
$hookPath = ".\workflows\hooks\hook_spec_${safeNombre}.md"
$qaPath = ".\output\reportes\qa_automatizacion_${safeNombre}.md"

$doc = @"
# Automatización: $Nombre

## Estado

Diseño interno seguro.  
No ejecuta acciones reales.  
No contiene credenciales.  
No conectar a producción sin aprobación de Dirección.

## Fecha

$fecha

---

# 1. Pedido recibido

$Pedido

---

# 2. Trigger previsto

$Trigger

---

# 3. Sistemas involucrados

$Sistemas

---

# 4. Acción esperada

$Accion

---

# 5. Diseño del flujo

## Paso 1 — Entrada

El flujo recibe un evento, pedido, formulario, webhook, archivo o acción manual.

## Paso 2 — Clasificación

Autonexus OS clasifica el tipo de pedido, riesgo y agente responsable.

## Paso 3 — Validación

Antes de ejecutar cualquier acción externa se valida:

- permiso
- riesgo
- datos requeridos
- si hay credenciales involucradas
- si afecta producción
- si requiere aprobación de Dirección

## Paso 4 — Ejecución segura

En esta etapa solo se diseña el flujo.  
La ejecución real queda bloqueada hasta aprobación.

## Paso 5 — Registro

Toda ejecución debe registrar:

- tarea
- evento
- resultado
- aprendizaje
- responsable final

## Paso 6 — QA

Toda automatización debe tener un reporte QA antes de activarse.

---

# 6. Riesgos declarados

$Riesgos

---

# 7. Reglas de seguridad

No se permite:

- guardar tokens en el repo
- subir credenciales
- ejecutar webhooks productivos sin aprobación
- modificar bases reales
- enviar mensajes a clientes reales sin validación
- activar tareas automáticas sin control de Dirección

---

# 8. Próximos pasos

1. Revisar diseño.
2. Validar si se implementará en n8n, script local o hook.
3. Definir datos de entrada y salida.
4. Crear entorno de prueba.
5. Ejecutar QA.
6. Pedir aprobación de Dirección antes de activar.
"@

Set-Content -Path $docPath -Value $doc -Encoding UTF8

$blueprint = [PSCustomObject]@{
    name = $Nombre
    status = "draft_internal_safe"
    generated_by = "Autonexus OS"
    created_at = $fecha
    trigger = $Trigger
    systems = $Sistemas
    request = $Pedido
    action = $Accion
    security = @{
        credentials_in_repo = $false
        production_enabled = $false
        requires_direction_approval = $true
        requires_qa = $true
    }
    nodes = @(
        @{
            id = "trigger"
            type = "manual_or_webhook"
            description = "Recibe el pedido o evento inicial"
        },
        @{
            id = "classify"
            type = "autonexus_classifier"
            description = "Clasifica tipo, riesgo y agente responsable"
        },
        @{
            id = "permission_gate"
            type = "approval_gate"
            description = "Bloquea acciones sensibles hasta aprobación de Dirección"
        },
        @{
            id = "execute_draft"
            type = "safe_draft_execution"
            description = "Diseña o simula ejecución sin tocar producción"
        },
        @{
            id = "log"
            type = "task_event_logger"
            description = "Registra tarea, evento, resultado y aprendizaje"
        },
        @{
            id = "qa"
            type = "qa_review"
            description = "Genera o exige QA antes de activación real"
        }
    )
}

$blueprint | ConvertTo-Json -Depth 10 | Set-Content -Path $n8nPath -Encoding UTF8

$hookSpec = @"
# Hook Spec: $Nombre

## Estado

Diseño interno.  
No activo.  
No contiene URL real ni secreto.

---

## Endpoint sugerido

POST /autonexus/hooks/$safeNombre

---

## Payload sugerido

{
  "source": "sistema_origen",
  "event": "evento_detectado",
  "request": "pedido o dato recibido",
  "risk_level": "bajo|medio|alto",
  "requires_approval": true
}

---

## Respuesta esperada

{
  "status": "received",
  "route": "classified",
  "requires_direction_approval": true
}

---

## Seguridad

- No exponer públicamente sin autenticación.
- No guardar tokens en GitHub.
- No activar producción sin QA.
- No ejecutar acciones sensibles sin aprobación de Dirección.
"@

Set-Content -Path $hookPath -Value $hookSpec -Encoding UTF8

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]

if ($doc -match "Trigger") { $puntaje += 15 } else { $observaciones.Add("Falta trigger.") }
if ($doc -match "Sistemas") { $puntaje += 15 } else { $observaciones.Add("Faltan sistemas involucrados.") }
if ($doc -match "Riesgos") { $puntaje += 15 } else { $observaciones.Add("Faltan riesgos.") }
if ($doc -match "Dirección|aprobación") { $puntaje += 20 } else { $observaciones.Add("Falta aprobación de Dirección.") }
if ($doc -match "credenciales|tokens") { $puntaje += 15 } else { $observaciones.Add("Falta advertencia sobre credenciales.") }
if ($doc -match "QA") { $puntaje += 20 } else { $observaciones.Add("Falta QA.") }

if ($puntaje -ge 85) {
    $estadoQA = "Aprobado como diseño interno seguro"
}
elseif ($puntaje -ge 65) {
    $estadoQA = "Aprobado con observaciones"
}
else {
    $estadoQA = "Bloqueado para activación"
}

if ($observaciones.Count -eq 0) {
    $obsTxt = "- Sin observaciones críticas."
} else {
    $obsTxt = ($observaciones | ForEach-Object { "- " + $_ }) -join "`r`n"
}

$qa = @"
# QA Automatización / n8n / hooks

## Automatización revisada

$docPath

## Blueprint n8n

$n8nPath

## Hook spec

$hookPath

## Estado QA

$estadoQA

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$obsTxt

---

# 2. Decisión

Esta automatización puede avanzar como diseño interno.

No debe activarse en producción sin:

1. revisión humana,
2. revisión de seguridad,
3. entorno de prueba,
4. aprobación de Dirección,
5. gestión segura de credenciales.

---

# 3. Aprendizaje

Las automatizaciones deben diseñarse primero como blueprint seguro antes de conectarse a herramientas reales como n8n, webhooks o APIs.
"@

Set-Content -Path $qaPath -Value $qa -Encoding UTF8

$taskAuto = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskAuto `
  -Descripcion "Diseñar automatización: $Nombre" `
  -Tipo "automatización + n8n + hooks" `
  -Objeto $docPath `
  -Agente "Agente Automatizaciones + Agente PM" `
  -Skill "Cierre de Tarea + QA Preproducción" `
  -NivelPermiso 3 `
  -Riesgo "medio" `
  -Resultado "Diseño de automatización creado como blueprint seguro" `
  -Aprendizaje "Autonexus OS puede diseñar automatizaciones sin activar producción ni exponer credenciales."

$taskQA = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskQA `
  -Descripcion "Realizar QA de automatización: $Nombre" `
  -Tipo "QA + automatización" `
  -Objeto $qaPath `
  -Agente "Agente QA + Agente Automatizaciones" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "QA de automatización generado" `
  -Aprendizaje "Ninguna automatización debe activarse sin QA y aprobación."

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_auto.ps1 `
        .\output\automatizaciones `
        .\output\reportes `
        .\workflows\n8n `
        .\workflows\hooks `
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
    $CommitMessage = "Crear automatizacion segura Autonexus: $Nombre"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Automatización diseñada y subida a GitHub." -ForegroundColor Green
Write-Host "Diseño: $docPath"
Write-Host "Blueprint n8n: $n8nPath"
Write-Host "Hook spec: $hookPath"
Write-Host "QA: $qaPath"
Write-Host ""

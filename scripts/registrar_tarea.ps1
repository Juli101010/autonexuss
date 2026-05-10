param(
    [Parameter(Mandatory=$true)]
    [string]$Id,

    [Parameter(Mandatory=$true)]
    [string]$Descripcion,

    [Parameter(Mandatory=$true)]
    [string]$Tipo,

    [Parameter(Mandatory=$true)]
    [string]$Agente,

    [Parameter(Mandatory=$true)]
    [string]$Skill,

    [string]$Solicitante = "Dirección",
    [string]$Objeto = "Autonexus OS",
    [int]$NivelPermiso = 1,
    [string]$Riesgo = "bajo",
    [string]$Estado = "registrado",
    [string]$Resultado = "Tarea registrada en Autonexus OS",
    [string]$Aprendizaje = "La tarea queda documentada para seguimiento operativo.",
    [string]$ActualizacionGrafo = "Registrar evento asociado a la tarea."
)

$tasksPath = ".\TASKS.md"
$eventsPath = ".\graph\events.json"

if (-not (Test-Path $tasksPath)) {
    Write-Host "ERROR: No existe TASKS.md" -ForegroundColor Red
    exit
}

if (-not (Test-Path $eventsPath)) {
    Write-Host "ERROR: No existe graph/events.json" -ForegroundColor Red
    exit
}

# Registrar tarea en TASKS.md
$tasksText = Get-Content $tasksPath -Raw

if ($tasksText -match $Id) {
    Write-Host "La tarea $Id ya existe en TASKS.md. No se duplica." -ForegroundColor Yellow
} else {
@"

---

## $Id

- ID: $Id
- Fecha: $(Get-Date -Format "yyyy-MM-dd")
- Solicitante: $Solicitante
- Descripción: $Descripcion
- Tipo: $Tipo
- Objeto de trabajo: $Objeto
- Agente sugerido: $Agente
- Skill sugerido: $Skill
- Nivel de permiso: $NivelPermiso
- Riesgo: $Riesgo
- Estado: $Estado
- Resultado esperado: $Resultado
- Requiere aprobación de Dirección: según nivel de permiso y riesgo
- Aprendizaje a guardar: $Aprendizaje
- Actualización de grafo: $ActualizacionGrafo
"@ | Add-Content -Path $tasksPath -Encoding UTF8

    Write-Host "Tarea $Id agregada a TASKS.md" -ForegroundColor Green
}

# Registrar evento en graph/events.json
$events = Get-Content $eventsPath -Raw | ConvertFrom-Json
$events = @($events)

$safeTaskId = ($Id.ToLower() -replace "[^a-z0-9]+", "_").Trim("_")
$eventId = "event_" + $safeTaskId

$exists = $events | Where-Object { $_.id -eq $eventId }

if ($exists) {
    Write-Host "El evento $eventId ya existe en graph/events.json. No se duplica." -ForegroundColor Yellow
} else {
    $newEvent = [PSCustomObject]@{
        id = $eventId
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
        actor = $Solicitante.ToLower()
        action = "registrar_tarea"
        object = $Id
        permission_level = $NivelPermiso
        risk_level = 1
        status = $Estado
        result = $Resultado
        consequence = "La tarea queda disponible para seguimiento operativo"
        learning = $Aprendizaje
        final_responsible = "direccion"
    }

    $events += $newEvent
    $events | ConvertTo-Json -Depth 10 | Set-Content -Path $eventsPath -Encoding UTF8

    Write-Host "Evento $eventId agregado a graph/events.json" -ForegroundColor Green
}

Write-Host "Registro completado." -ForegroundColor Cyan

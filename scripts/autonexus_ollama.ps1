param(
    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Modelo = "deepseek-coder:latest",

    [int]$TimeoutSegundos = 90,

    [switch]$EjecutarMaster
)

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

    if ($safe.Length -gt 70) {
        $safe = $safe.Substring(0,70)
    }

    return $safe
}

$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaCmd) {
    Write-Host "ERROR: Ollama no está disponible en PATH." -ForegroundColor Red
    exit
}

$promptPath = ".\brain\llm\ollama_system_prompt.md"

if (-not (Test-Path $promptPath)) {
    Write-Host "ERROR: Falta brain\llm\ollama_system_prompt.md" -ForegroundColor Red
    exit
}

$systemPrompt = Get-Content $promptPath -Raw

$fullPrompt = @"
$systemPrompt

PEDIDO DE DIRECCIÓN:
$Pedido
"@

Write-Host ""
Write-Host "AUTONEXUS OLLAMA CLI" -ForegroundColor Cyan
Write-Host "Modelo: $Modelo"
Write-Host "Timeout: $TimeoutSegundos segundos"
Write-Host "Pedido: $Pedido"
Write-Host ""

$job = Start-Job -ScriptBlock {
    param($M, $P)
    & ollama run $M $P
} -ArgumentList $Modelo, $fullPrompt

$finished = Wait-Job $job -Timeout $TimeoutSegundos

if (-not $finished) {
    Stop-Job $job -Force
    Remove-Job $job -Force
    Write-Host "ERROR: Ollama no respondió dentro del timeout." -ForegroundColor Red
    Write-Host "Probá con un modelo más liviano o aumentá -TimeoutSegundos." -ForegroundColor Yellow
    exit
}

$respuesta = Receive-Job $job | Out-String
Remove-Job $job -Force

if ([string]::IsNullOrWhiteSpace($respuesta)) {
    Write-Host "ERROR: Ollama respondió vacío." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\llm" | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$safe = Convert-ToSafeName $Pedido
$outPath = ".\output\llm\ollama_${safe}.md"

$contenido = @"
# Respuesta Ollama — Autonexus OS

## Fecha

$fecha

## Modelo

$Modelo

## Pedido

$Pedido

---

# Respuesta operativa

$respuesta

---

# Uso

Esta respuesta sirve para decidir ruta.  
La ejecución real la hace Autonexus Master o el script correspondiente.
"@

Set-Content -Path $outPath -Value $contenido -Encoding UTF8

$taskId = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskId `
  -Descripcion "Consultar Ollama CLI para clasificar pedido" `
  -Tipo "LLM local + Ollama CLI" `
  -Objeto $outPath `
  -Agente "Agente PM + Motor Local Ollama" `
  -Skill "Orquestación de Agentes + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Respuesta local de Ollama CLI generada" `
  -Aprendizaje "Autonexus OS usa Ollama por CLI cuando la API local no responde correctamente."

if ($EjecutarMaster) {
    if (Test-Path ".\scripts\autonexus_master.ps1") {
        powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_master.ps1" `
          -Pedido $Pedido `
          -CommitMessage "Ejecutar master desde Ollama CLI"
    }
}

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File ".\scripts\panel_autonexus.ps1"
}

Write-Host ""
Write-Host "Respuesta Ollama guardada:" -ForegroundColor Green
Write-Host $outPath
Write-Host ""

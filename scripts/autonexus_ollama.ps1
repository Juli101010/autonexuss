param(
    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Modelo = "deepseek-coder:latest",

    [int]$TimeoutSegundos = 60,

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

$configPath = ".\brain\llm\ollama_config.json"
$promptPath = ".\brain\llm\ollama_system_prompt.md"

if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: Falta brain\llm\ollama_config.json" -ForegroundColor Red
    exit
}

if (-not (Test-Path $promptPath)) {
    Write-Host "ERROR: Falta brain\llm\ollama_system_prompt.md" -ForegroundColor Red
    exit
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$systemPrompt = Get-Content $promptPath -Raw
$apiUrl = $config.api_url

$fullPrompt = @"
$systemPrompt

PEDIDO DE DIRECCIÓN:
$Pedido
"@

Write-Host ""
Write-Host "AUTONEXUS DEEPSEEK LOCAL" -ForegroundColor Cyan
Write-Host "Modelo: $Modelo"
Write-Host "Timeout: $TimeoutSegundos segundos"
Write-Host "Pedido: $Pedido"
Write-Host ""

New-Item -ItemType Directory -Force -Path ".\output\llm" | Out-Null

$payloadObj = @{
    model = $Modelo
    prompt = $fullPrompt
    stream = $false
    keep_alive = "1m"
    options = @{
        temperature = 0.1
        num_predict = 160
        num_ctx = 1024
    }
}

$payloadJson = $payloadObj | ConvertTo-Json -Depth 10
$tmpPayload = Join-Path (Resolve-Path ".\output\llm").Path "_ollama_payload_tmp.json"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tmpPayload, $payloadJson, $utf8NoBom)

$raw = & curl.exe --silent --show-error --max-time $TimeoutSegundos `
  -H "Content-Type: application/json" `
  --data-binary "@$tmpPayload" `
  $apiUrl 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) {
    Write-Host "ERROR: Ollama API no respondió correctamente." -ForegroundColor Red
    Write-Host "Código curl: $LASTEXITCODE"
    Write-Host $raw
    exit
}

try {
    $obj = $raw | ConvertFrom-Json
}
catch {
    Write-Host "ERROR: La respuesta de Ollama no fue JSON válido." -ForegroundColor Red
    Write-Host $raw
    exit
}

$respuesta = $obj.response

if ([string]::IsNullOrWhiteSpace($respuesta)) {
    Write-Host "ERROR: Ollama respondió vacío." -ForegroundColor Red
    Write-Host $raw
    exit
}

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$safe = Convert-ToSafeName $Pedido
$outPath = ".\output\llm\ollama_${safe}.md"

$contenido = @"
# Respuesta DeepSeek Local — Autonexus OS

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
  -Descripcion "Consultar DeepSeek local para clasificar pedido" `
  -Tipo "LLM local + DeepSeek + Ollama API" `
  -Objeto $outPath `
  -Agente "Agente PM + Motor Local DeepSeek" `
  -Skill "Orquestación de Agentes + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Respuesta local de DeepSeek generada por API Ollama" `
  -Aprendizaje "Autonexus OS usa DeepSeek local para tareas simples y clasificación sin depender de API paga."

if ($EjecutarMaster) {
    if (Test-Path ".\scripts\autonexus_master.ps1") {
        powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_master.ps1" `
          -Pedido $Pedido `
          -CommitMessage "Ejecutar master desde DeepSeek local"
    }
}

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File ".\scripts\panel_autonexus.ps1"
}

Write-Host ""
Write-Host "Respuesta DeepSeek guardada:" -ForegroundColor Green
Write-Host $outPath
Write-Host ""

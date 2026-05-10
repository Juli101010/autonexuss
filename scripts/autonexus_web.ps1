param(
    [Parameter(Mandatory=$true)]
    [string]$Titulo,

    [Parameter(Mandatory=$true)]
    [string]$TipoWeb,

    [Parameter(Mandatory=$true)]
    [string]$Pedido,

    [string]$Audiencia = "uso interno de Autonexus",
    [string]$Objetivo = "crear una pieza web inicial clara, visual y editable",
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

function HtmlEncode {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode($Text)
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

$placeholders = @("Titulo", "Título", "TipoWeb", "Pedido", "Nombre de la pagina", "Nombre de la página")
if ($placeholders -contains $Titulo -or $placeholders -contains $TipoWeb -or $placeholders -contains $Pedido) {
    Write-Host "ERROR: Estás usando valores de ejemplo. Reemplazalos por datos reales o demo específicos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\web" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$safeTitulo = Convert-ToSafeName $Titulo
$webPath = ".\output\web\web_${safeTitulo}.html"
$qaPath = ".\output\reportes\qa_web_${safeTitulo}.md"
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$titleHtml = HtmlEncode $Titulo
$tipoHtml = HtmlEncode $TipoWeb
$pedidoHtml = HtmlEncode $Pedido
$audienciaHtml = HtmlEncode $Audiencia
$objetivoHtml = HtmlEncode $Objetivo

$html = @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$titleHtml</title>
<style>
:root {
  --bg: #080d1c;
  --panel: #121a2f;
  --panel2: #17213b;
  --text: #edf3ff;
  --muted: #95a3b8;
  --line: rgba(255,255,255,.14);
  --accent: #66e4ff;
  --ok: #8ef0a5;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Segoe UI, Arial, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(102,228,255,.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(141,111,255,.16), transparent 30%),
    var(--bg);
  color: var(--text);
}
main {
  max-width: 1180px;
  margin: 0 auto;
  padding: 34px;
}
.hero {
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
  border-radius: 28px;
  padding: 34px;
  margin-bottom: 20px;
}
.badge {
  display: inline-block;
  border: 1px solid var(--line);
  background: rgba(102,228,255,.10);
  color: var(--accent);
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  margin-bottom: 16px;
}
h1 {
  font-size: clamp(34px, 5vw, 64px);
  letter-spacing: -0.05em;
  margin: 0 0 14px;
  line-height: 1;
}
h2 { margin: 0 0 12px; font-size: 22px; }
p { color: var(--muted); line-height: 1.6; font-size: 16px; }
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 20px 0;
}
.card {
  border: 1px solid var(--line);
  background: rgba(18,26,47,.92);
  border-radius: 22px;
  padding: 20px;
}
.card b {
  display: block;
  color: var(--ok);
  margin-bottom: 8px;
}
.command {
  background: #060913;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px;
  overflow-x: auto;
  color: #d7ecff;
}
.footer {
  color: var(--muted);
  font-size: 13px;
  margin-top: 24px;
}
@media(max-width: 900px) {
  main { padding: 18px; }
  .grid { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<main>
  <section class="hero">
    <div class="badge">$tipoHtml · generado por Autonexus OS</div>
    <h1>$titleHtml</h1>
    <p>$objetivoHtml</p>
  </section>

  <section class="grid">
    <div class="card">
      <b>Pedido recibido</b>
      <p>$pedidoHtml</p>
    </div>
    <div class="card">
      <b>Audiencia</b>
      <p>$audienciaHtml</p>
    </div>
    <div class="card">
      <b>Estado</b>
      <p>Borrador visual interno. No publicar sin revisión humana, QA y aprobación de Dirección si corresponde.</p>
    </div>
  </section>

  <section class="card">
    <h2>Estructura sugerida</h2>
    <p>Esta pieza puede evolucionar hacia landing, panel, prototipo de interfaz, sección web, dashboard o componente visual.</p>
    <div class="command">
      Dirección → Pedido → Agente Web/Dev → Prototipo HTML → QA → GitHub → Panel
    </div>
  </section>

  <section class="grid">
    <div class="card">
      <b>1. Claridad</b>
      <p>Debe explicar qué se quiere mostrar y para quién.</p>
    </div>
    <div class="card">
      <b>2. Uso</b>
      <p>Debe servir como base editable, no como versión final automática.</p>
    </div>
    <div class="card">
      <b>3. Control</b>
      <p>Todo uso externo requiere validación de Dirección.</p>
    </div>
  </section>

  <div class="footer">
    Generado el $fecha · Archivo: $webPath
  </div>
</main>
</body>
</html>
"@

Set-Content -Path $webPath -Value $html -Encoding UTF8

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]

if ($html -match "<title>") { $puntaje += 15 } else { $observaciones.Add("Falta title.") }
if ($html -match "viewport") { $puntaje += 15 } else { $observaciones.Add("Falta viewport responsive.") }
if ($html -match "Pedido recibido") { $puntaje += 15 } else { $observaciones.Add("Falta pedido recibido.") }
if ($html -match "Dirección|aprobación|validación") { $puntaje += 20 } else { $observaciones.Add("Falta control de Dirección o validación.") }
if ($html -match "@media") { $puntaje += 15 } else { $observaciones.Add("Falta regla responsive.") }
if ($html -match "Estado") { $puntaje += 10 } else { $observaciones.Add("Falta estado.") }
if ($html -match "Autonexus OS") { $puntaje += 10 } else { $observaciones.Add("Falta marca del sistema.") }

if ($puntaje -ge 85) {
    $estadoQA = "Aprobado como prototipo interno"
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
# QA Automático Web/Dev

## Archivo revisado

$webPath

## Estado QA

$estadoQA

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$obsTxt

---

# 2. Decisión

Este archivo puede usarse como prototipo interno.

No debe publicarse ni enviarse como pieza final sin:

1. revisión humana,
2. revisión visual,
3. prueba responsive,
4. aprobación de Dirección si corresponde.

---

# 3. Aprendizaje

Todo prototipo Web/Dev generado por Autonexus OS debe quedar versionado y pasar por QA antes de su uso externo.
"@

Set-Content -Path $qaPath -Value $qa -Encoding UTF8

$taskWeb = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskWeb `
  -Descripcion "Generar prototipo Web/Dev: $Titulo" `
  -Tipo "web + desarrollo + prototipo" `
  -Objeto $webPath `
  -Agente "Agente Web/Dev + Agente PM" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Prototipo HTML generado como borrador interno" `
  -Aprendizaje "Autonexus OS puede generar prototipos HTML desde pedidos estructurados."

$taskQA = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskQA `
  -Descripcion "Realizar QA automático Web/Dev: $Titulo" `
  -Tipo "QA + web + desarrollo" `
  -Objeto $qaPath `
  -Agente "Agente QA + Agente Web/Dev" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "QA automático Web/Dev generado" `
  -Aprendizaje "Los prototipos HTML generados deben revisarse antes de publicarse."

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_web.ps1 `
        .\output\web `
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
    $CommitMessage = "Generar prototipo Web Autonexus: $Titulo"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Prototipo Web/Dev generado y subido a GitHub." -ForegroundColor Green
Write-Host "HTML: $webPath"
Write-Host "QA: $qaPath"
Write-Host ""

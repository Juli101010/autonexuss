param()

function Count-Files {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return 0
    }

    return (Get-ChildItem $Path -File -Recurse | Measure-Object).Count
}

function HtmlEncode {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode($Text)
}

function Get-FileRows {
    param(
        [string]$Path,
        [string]$Label,
        [int]$Limit = 10
    )

    if (-not (Test-Path $Path)) {
        return "<tr><td colspan='4'>Sin archivos en $Label.</td></tr>"
    }

    $root = (Get-Location).Path
    $files = @(Get-ChildItem $Path -File -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First $Limit)

    if ($files.Count -eq 0) {
        return "<tr><td colspan='4'>Sin archivos en $Label.</td></tr>"
    }

    return (($files | ForEach-Object {
        $name = HtmlEncode $_.Name
        $date = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        $rel = $_.FullName.Replace($root + "\", "")
        $href = "../" + ($rel -replace "\\","/")
        $relClean = HtmlEncode $rel
        "<tr><td><a href='$href' target='_blank'>$name</a></td><td>$date</td><td>$Label</td><td class='muted'>$relClean</td></tr>"
    }) -join "`r`n")
}

function Get-EventRows {
    $eventsPath = ".\graph\events.json"

    if (-not (Test-Path $eventsPath)) {
        return "<tr><td colspan='5'>No existe graph/events.json.</td></tr>"
    }

    $events = @(Get-Content $eventsPath -Raw | ConvertFrom-Json)
    $events = @($events | Select-Object -Last 14)

    if ($events.Count -eq 0) {
        return "<tr><td colspan='5'>Sin eventos.</td></tr>"
    }

    return (($events | ForEach-Object {
        $id = HtmlEncode $_.id
        $action = HtmlEncode $_.action
        $object = HtmlEncode $_.object
        $status = HtmlEncode $_.status
        $risk = HtmlEncode ([string]$_.risk_level)
        "<tr><td>$id</td><td>$action</td><td>$object</td><td>$status</td><td>$risk</td></tr>"
    }) -join "`r`n")
}

function Get-RegistryCount {
    param(
        [string]$Path,
        [string]$Property
    )

    if (-not (Test-Path $Path)) {
        return 0
    }

    try {
        $json = Get-Content $Path -Raw | ConvertFrom-Json
        return @($json.$Property).Count
    }
    catch {
        return 0
    }
}

New-Item -ItemType Directory -Force -Path ".\ui" | Out-Null

$fecha = "estado actual del sistema"

$clientesCount = Count-Files ".\brain\clientes"
$proyectosCount = Count-Files ".\brain\proyectos"
$procesosCount = Count-Files ".\brain\procesos"
$conversacionesCount = Count-Files ".\brain\conversaciones"
$propuestasCount = Count-Files ".\output\propuestas"
$reportesCount = Count-Files ".\output\reportes"
$scriptsCount = Count-Files ".\scripts"

$agentesCount = Get-RegistryCount ".\brain\agentes\registry.json" "agentes"
$skillsCount = Get-RegistryCount ".\brain\skills\registry.json" "skills"

$clientesRows = Get-FileRows ".\brain\clientes" "Clientes"
$conversacionesRows = Get-FileRows ".\brain\conversaciones" "Conversaciones"
$propuestasRows = Get-FileRows ".\output\propuestas" "Propuestas"
$reportesRows = Get-FileRows ".\output\reportes" "Reportes"
$eventRows = Get-EventRows

$html = @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Autonexus OS · Panel Maestro</title>
<style>
:root {
  --bg: #080d1c;
  --panel: #121a2f;
  --panel2: #17213b;
  --text: #edf3ff;
  --muted: #95a3b8;
  --line: rgba(255,255,255,.12);
  --accent: #66e4ff;
  --ok: #8ef0a5;
  --warn: #ffd166;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Segoe UI, Arial, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(102,228,255,.15), transparent 32%),
    radial-gradient(circle at bottom right, rgba(141,111,255,.12), transparent 30%),
    var(--bg);
  color: var(--text);
}
main { max-width: 1280px; margin: 0 auto; padding: 28px; }
header {
  padding: 26px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
  border-radius: 26px;
  margin-bottom: 18px;
}
h1 { margin: 0 0 8px; font-size: 32px; letter-spacing: -0.03em; }
h2 { margin: 0 0 14px; font-size: 19px; }
p { color: var(--muted); margin: 0; line-height: 1.5; }
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin: 18px 0;
}
.card {
  border: 1px solid var(--line);
  background: rgba(18,26,47,.92);
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.metric b { font-size: 28px; display: block; margin-bottom: 4px; color: var(--accent); }
.metric span { color: var(--muted); font-size: 13px; }
section { margin: 18px 0; }
table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 16px;
}
th, td {
  text-align: left;
  border-bottom: 1px solid var(--line);
  padding: 10px;
  font-size: 13px;
  vertical-align: top;
}
th { color: var(--accent); background: var(--panel2); }
a { color: var(--ok); text-decoration: none; }
a:hover { text-decoration: underline; }
.muted { color: var(--muted); font-size: 12px; }
.command {
  background: #060913;
  border: 1px solid var(--line);
  padding: 14px;
  border-radius: 16px;
  color: #d7ecff;
  overflow-x: auto;
}
.flow {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.step {
  background: #060913;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 14px;
}
.step b { color: var(--warn); display: block; margin-bottom: 6px; }
@media(max-width: 950px) {
  .grid, .flow { grid-template-columns: repeat(2, 1fr); }
  main { padding: 16px; }
}
</style>
</head>
<body>
<main>
<header>
  <h1>Autonexus OS · Panel Maestro</h1>
  <p>Estado generado el $fecha. Panel local para ver clientes, propuestas, QA, conversaciones, agentes, skills y eventos.</p>
</header>

<div class="grid">
  <div class="card metric"><b>$clientesCount</b><span>Clientes</span></div>
  <div class="card metric"><b>$propuestasCount</b><span>Propuestas</span></div>
  <div class="card metric"><b>$reportesCount</b><span>Reportes QA / Estado</span></div>
  <div class="card metric"><b>$conversacionesCount</b><span>Conversaciones agentes</span></div>
  <div class="card metric"><b>$scriptsCount</b><span>Scripts operativos</span></div>
  <div class="card metric"><b>$agentesCount</b><span>Agentes registrados</span></div>
  <div class="card metric"><b>$skillsCount</b><span>Skills registrados</span></div>
  <div class="card metric"><b>$procesosCount</b><span>Procesos Brain</span></div>
  <div class="card metric"><b>$proyectosCount</b><span>Proyectos Brain</span></div>
  <div class="card metric"><b>v0.2</b><span>Panel Maestro</span></div>
</div>

<section class="card">
  <h2>Flujo operativo actual</h2>
  <div class="flow">
    <div class="step"><b>1. Dirección</b><span>Ingresa pedido o cliente.</span></div>
    <div class="step"><b>2. Orquestador</b><span>Elige ruta disponible.</span></div>
    <div class="step"><b>3. Agentes</b><span>Comercial, Odoo, QA, Documentador.</span></div>
    <div class="step"><b>4. Entregables</b><span>Cliente, propuesta y QA.</span></div>
    <div class="step"><b>5. GitHub</b><span>Commit, push y trazabilidad.</span></div>
  </div>
</section>

<section class="card">
  <h2>Comando principal Odoo</h2>
  <div class="command">powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_odoo.ps1 -Nombre "Cliente Demo" -TipoEmpresa "Empresa de servicios" -Necesidad "Ordenar CRM, ventas y propuestas"</div>
</section>

<section class="card">
  <h2>Comando de orquesta de agentes</h2>
  <div class="command">powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_orquesta.ps1 -Pedido "Quiero analizar este pedido y decidir ruta de trabajo"</div>
</section>

<section class="card">
  <h2>Últimos clientes</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Tipo</th><th>Ubicación</th></tr></thead>
    <tbody>$clientesRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimas conversaciones de agentes</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Tipo</th><th>Ubicación</th></tr></thead>
    <tbody>$conversacionesRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimas propuestas</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Tipo</th><th>Ubicación</th></tr></thead>
    <tbody>$propuestasRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimos reportes</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Tipo</th><th>Ubicación</th></tr></thead>
    <tbody>$reportesRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimos eventos del grafo</h2>
  <table>
    <thead><tr><th>ID</th><th>Acción</th><th>Objeto</th><th>Estado</th><th>Riesgo</th></tr></thead>
    <tbody>$eventRows</tbody>
  </table>
</section>

</main>
</body>
</html>
"@

Set-Content -Path ".\ui\panel_autonexus.html" -Value $html -Encoding UTF8

Write-Host "Panel maestro creado: .\ui\panel_autonexus.html" -ForegroundColor Green


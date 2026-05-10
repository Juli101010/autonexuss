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
        [int]$Limit = 8
    )

    if (-not (Test-Path $Path)) {
        return "<tr><td colspan='3'>Sin archivos.</td></tr>"
    }

    $files = Get-ChildItem $Path -File -Recurse | Sort-Object LastWriteTime -Descending | Select-Object -First $Limit

    if ($files.Count -eq 0) {
        return "<tr><td colspan='3'>Sin archivos.</td></tr>"
    }

    return (($files | ForEach-Object {
        $name = HtmlEncode $_.Name
        $dir = HtmlEncode $_.DirectoryName
        $date = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        "<tr><td>$name</td><td>$date</td><td class='muted'>$dir</td></tr>"
    }) -join "`r`n")
}

function Get-EventRows {
    $eventsPath = ".\graph\events.json"

    if (-not (Test-Path $eventsPath)) {
        return "<tr><td colspan='5'>No existe graph/events.json.</td></tr>"
    }

    $events = Get-Content $eventsPath -Raw | ConvertFrom-Json
    $events = @($events) | Select-Object -Last 12

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

New-Item -ItemType Directory -Force -Path ".\ui" | Out-Null

$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$clientesCount = Count-Files ".\brain\clientes"
$proyectosCount = Count-Files ".\brain\proyectos"
$procesosCount = Count-Files ".\brain\procesos"
$propuestasCount = Count-Files ".\output\propuestas"
$reportesCount = Count-Files ".\output\reportes"
$scriptsCount = Count-Files ".\scripts"

$clientesRows = Get-FileRows ".\brain\clientes"
$propuestasRows = Get-FileRows ".\output\propuestas"
$reportesRows = Get-FileRows ".\output\reportes"
$eventRows = Get-EventRows

$html = @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Autonexus OS · Panel Local</title>
<style>
:root {
  --bg: #0b1020;
  --panel: #121a2f;
  --panel2: #17213b;
  --text: #edf3ff;
  --muted: #95a3b8;
  --line: rgba(255,255,255,.12);
  --accent: #66e4ff;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Segoe UI, Arial, sans-serif;
  background: radial-gradient(circle at top left, rgba(102,228,255,.16), transparent 35%), var(--bg);
  color: var(--text);
}
main { max-width: 1220px; margin: 0 auto; padding: 28px; }
header {
  padding: 24px;
  border: 1px solid var(--line);
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
  border-radius: 24px;
  margin-bottom: 18px;
}
h1 { margin: 0 0 8px; font-size: 30px; }
h2 { margin: 0 0 14px; font-size: 19px; }
p { color: var(--muted); margin: 0; line-height: 1.5; }
.grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin: 18px 0;
}
.card {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 20px;
  padding: 16px;
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
.muted { color: var(--muted); font-size: 12px; }
.command {
  background: #060913;
  border: 1px solid var(--line);
  padding: 14px;
  border-radius: 16px;
  color: #d7ecff;
  overflow-x: auto;
}
@media(max-width: 900px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  main { padding: 16px; }
}
</style>
</head>
<body>
<main>
<header>
  <h1>Autonexus OS · Panel Local</h1>
  <p>Estado generado el $fecha. Este panel resume clientes, propuestas, reportes, scripts y eventos del sistema.</p>
</header>

<div class="grid">
  <div class="card metric"><b>$clientesCount</b><span>Clientes</span></div>
  <div class="card metric"><b>$proyectosCount</b><span>Proyectos</span></div>
  <div class="card metric"><b>$procesosCount</b><span>Procesos</span></div>
  <div class="card metric"><b>$propuestasCount</b><span>Propuestas</span></div>
  <div class="card metric"><b>$reportesCount</b><span>Reportes</span></div>
  <div class="card metric"><b>$scriptsCount</b><span>Scripts</span></div>
</div>

<section class="card">
  <h2>Comando principal</h2>
  <div class="command">powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_odoo.ps1 -Nombre "Cliente Demo" -TipoEmpresa "Empresa de servicios" -Necesidad "Ordenar CRM, ventas y propuestas"</div>
</section>

<section class="card">
  <h2>Últimos clientes</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Ubicación</th></tr></thead>
    <tbody>$clientesRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimas propuestas</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Ubicación</th></tr></thead>
    <tbody>$propuestasRows</tbody>
  </table>
</section>

<section class="card">
  <h2>Últimos reportes</h2>
  <table>
    <thead><tr><th>Archivo</th><th>Fecha</th><th>Ubicación</th></tr></thead>
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

Write-Host "Panel creado: .\ui\panel_autonexus.html" -ForegroundColor Green

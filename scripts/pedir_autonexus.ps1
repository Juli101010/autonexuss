param(
    [string]$Pedido = "",
    [string]$Modelo = "deepseek-coder:latest",
    [int]$TimeoutSegundos = 60,
    [switch]$NoAbrir
)

if (-not (Test-Path ".\CLAUDE.md")) {
    Write-Host "ERROR: No estás en la raíz del proyecto AutonexusOS." -ForegroundColor Red
    exit
}

if ([string]::IsNullOrWhiteSpace($Pedido)) {
    Write-Host ""
    Write-Host "AUTONEXUS OS · PEDIDO DE DIRECCIÓN" -ForegroundColor Cyan
    $Pedido = Read-Host "Escribí el pedido"
}

powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_ollama.ps1" `
  -Modelo $Modelo `
  -TimeoutSegundos $TimeoutSegundos `
  -Pedido $Pedido `
  -EjecutarMaster

Write-Host ""
Write-Host "Verificando estado del repo..." -ForegroundColor Cyan
git status

if (-not $NoAbrir) {
    if (Test-Path ".\ui\panel_autonexus.html") {
        ii ".\ui\panel_autonexus.html"
    }

    if (Test-Path ".\output\reportes\master_ultima_ruta.md") {
        ii ".\output\reportes\master_ultima_ruta.md"
    }
}

Write-Host ""
Write-Host "Pedido finalizado." -ForegroundColor Green

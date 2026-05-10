param(
    [string]$Pedido = "",
    [string]$Nombre = "",
    [string]$TipoEmpresa = "",
    [string]$Necesidad = "",
    [string]$Titulo = "",
    [string]$CommitMessage = ""
)

if ([string]::IsNullOrWhiteSpace($Pedido)) {
    Write-Host ""
    Write-Host "AUTONEXUS OS · COMANDO DIRECTOR" -ForegroundColor Cyan
    Write-Host "Escribí el pedido que querés darle al sistema:" -ForegroundColor Yellow
    $Pedido = Read-Host "Pedido"
}

$args = @{
    Pedido = $Pedido
}

if (-not [string]::IsNullOrWhiteSpace($Nombre)) { $args["Nombre"] = $Nombre }
if (-not [string]::IsNullOrWhiteSpace($TipoEmpresa)) { $args["TipoEmpresa"] = $TipoEmpresa }
if (-not [string]::IsNullOrWhiteSpace($Necesidad)) { $args["Necesidad"] = $Necesidad }
if (-not [string]::IsNullOrWhiteSpace($Titulo)) { $args["Titulo"] = $Titulo }
if (-not [string]::IsNullOrWhiteSpace($CommitMessage)) { $args["CommitMessage"] = $CommitMessage }

powershell -ExecutionPolicy Bypass -File ".\scripts\autonexus_master.ps1" @args

if (Test-Path ".\output\reportes\master_ultima_ruta.md") {
    ii ".\output\reportes\master_ultima_ruta.md"
}

if (Test-Path ".\ui\panel_autonexus.html") {
    ii ".\ui\panel_autonexus.html"
}

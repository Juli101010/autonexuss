param(
  [string]$Source = "C:\Users\Julian\OneDrive\Documentos\New project\labonita-step53-agencia",
  [string]$OutputRoot = "C:\Users\Julian\OneDrive\Documentos\Labonita-Deploy-Cliente"
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stage = Join-Path $OutputRoot "stage-$stamp"
$zip = Join-Path $OutputRoot "labonita-cliente-$stamp.zip"

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
New-Item -ItemType Directory -Force -Path $stage | Out-Null

robocopy $Source $stage /E /R:1 /W:1 `
  /XD ".git" ".github" ".vscode" ".idea" "node_modules" "agency-control" "entrega-labonita-agencia" "_tmp_step57" "dist-labonita" `
  /XF ".env" ".env.local" ".env.production" ".env.development" "*.log" "*.err.log" "*.out.log" "*.sqlite" "*.sqlite-*" "*.db" "*.zip"

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal

Write-Host "Release creada:"
Write-Host " - Stage: $stage"
Write-Host " - Zip:   $zip"

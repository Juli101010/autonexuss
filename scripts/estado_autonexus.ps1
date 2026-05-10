param()

function Count-Files {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return 0
    }

    return (Get-ChildItem $Path -File -Recurse | Measure-Object).Count
}

New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null

$clientesCount = Count-Files ".\brain\clientes"
$proyectosCount = Count-Files ".\brain\proyectos"
$procesosCount = Count-Files ".\brain\procesos"
$propuestasCount = Count-Files ".\output\propuestas"
$reportesCount = Count-Files ".\output\reportes"
$scriptsCount = Count-Files ".\scripts"
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$reporte = @"
# Estado General de Autonexus OS

## Fecha

$fecha

---

## Resumen operativo

Autonexus OS ya tiene funcionando:

- creación de clientes desde consola
- generación de propuestas Odoo
- QA automático de propuestas
- registro de tareas
- registro de eventos
- commit y push a GitHub
- comando único Autonexus Odoo

---

## Conteo de componentes

| Componente | Cantidad |
|---|---:|
| Clientes en Brain | $clientesCount |
| Proyectos en Brain | $proyectosCount |
| Procesos documentados | $procesosCount |
| Propuestas generadas | $propuestasCount |
| Reportes generados | $reportesCount |
| Scripts operativos | $scriptsCount |

---

## Scripts principales

- scripts/registrar_tarea.ps1
- scripts/router_tarea.ps1
- scripts/crear_cliente.ps1
- scripts/generar_propuesta_odoo.ps1
- scripts/qa_propuesta_odoo.ps1
- scripts/pipeline_odoo.ps1
- scripts/autonexus_odoo.ps1
- scripts/estado_autonexus.ps1

---

## Comando principal actual

Para ejecutar el flujo completo Odoo, usar:

powershell -ExecutionPolicy Bypass -File .\scripts\autonexus_odoo.ps1 -Nombre "Cliente Demo" -TipoEmpresa "Empresa de servicios" -Necesidad "Ordenar CRM, ventas y propuestas"

---

## Próxima mejora recomendada

Crear un panel HTML local que lea reportes, propuestas, clientes y eventos para ver el estado del sistema sin abrir archivos manualmente.
"@

Set-Content -Path ".\output\reportes\estado_autonexus_os.md" -Value $reporte -Encoding UTF8

Write-Host "Reporte creado: .\output\reportes\estado_autonexus_os.md" -ForegroundColor Green

param(
    [Parameter(Mandatory=$true)]
    [string]$Cliente,

    [string]$Id = ""
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

if ([string]::IsNullOrWhiteSpace($Id)) {
    $Id = Get-NextTaskId
}

$safeCliente = Convert-ToSafeName $Cliente

$clientesDir = ".\brain\clientes"
$outputDir = ".\output\propuestas"

New-Item -ItemType Directory -Force -Path $clientesDir | Out-Null
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$clienteFile = Get-ChildItem $clientesDir -Filter "*.md" | Where-Object {
    $_.BaseName -match $safeCliente -or ((Get-Content $_.FullName -Raw) -match [regex]::Escape($Cliente))
} | Select-Object -First 1

if (-not $clienteFile) {
    Write-Host "ERROR: No encontré un archivo de cliente para '$Cliente' en brain/clientes." -ForegroundColor Red
    Write-Host "Primero creá el cliente dentro de brain/clientes." -ForegroundColor Yellow
    exit
}

$clienteInfo = Get-Content $clienteFile.FullName -Raw
$outFile = ".\output\propuestas\propuesta_odoo_${safeCliente}_generada.md"
$clientePath = $clienteFile.FullName

$contenido = @"
# Propuesta Odoo Generada
## Cliente: $Cliente

## Estado

Borrador interno generado por Autonexus OS.  
No enviar a cliente real sin QA y aprobación de Dirección.

---

# 1. Perfil del cliente leído desde Brain

$clienteInfo

---

# 2. Diagnóstico interpretado

A partir del perfil del cliente, se observa una necesidad de ordenamiento comercial, centralización de información, mejora del seguimiento de clientes y preparación de procesos para una futura implementación progresiva en Odoo.

El sistema recomienda no avanzar directamente sobre producción, facturación real, inventario productivo o integraciones sensibles sin una fase previa de relevamiento, limpieza y validación de datos.

---

# 3. Objetivo de la propuesta

Implementar Odoo de forma gradual, comenzando por los procesos de menor riesgo y mayor impacto operativo.

Objetivos iniciales:

- ordenar clientes
- ordenar productos o servicios
- mejorar seguimiento comercial
- estructurar presupuestos
- preparar reportes básicos
- reducir trabajo manual
- dejar preparada una segunda etapa para procesos más sensibles

---

# 4. Alcance sugerido

## Fase 1 — Relevamiento

- entrevistas iniciales
- análisis de procesos actuales
- revisión de datos disponibles
- identificación de módulos necesarios
- detección de riesgos
- definición de responsables internos

## Fase 2 — Configuración base

- empresa
- usuarios
- permisos
- contactos
- productos o servicios
- CRM
- ventas
- presupuestos
- reportes iniciales

## Fase 3 — Validación

- pruebas funcionales
- revisión de datos cargados
- validación de circuitos
- ajustes iniciales
- checklist QA

## Fase 4 — Capacitación

- capacitación de usuarios
- guía básica de operación
- buenas prácticas
- registro de dudas frecuentes

## Fase 5 — Segunda etapa

- inventario
- facturación
- compras
- automatizaciones
- dashboards
- integraciones

---

# 5. Riesgos

- datos desordenados
- productos duplicados
- procesos no definidos
- usuarios sin capacitación
- falta de responsable interno
- avance prematuro hacia facturación o producción
- expectativas comerciales no alineadas

---

# 6. Exclusiones iniciales

Salvo aprobación expresa, no se incluye:

- facturación real
- inventario productivo
- desarrollos a medida complejos
- integraciones externas
- migraciones históricas no relevadas
- limpieza manual masiva de datos
- soporte ilimitado
- decisiones fiscales o contables

---

# 7. Gobierno Autonexus

Toda propuesta generada por este sistema es un borrador interno.

Requiere aprobación de Dirección antes de:

- enviarse a cliente
- incluir precios
- prometer plazos
- comprometer alcance
- pedir credenciales
- tocar sistemas reales
- operar sobre producción

---

# 8. Próximos pasos

1. Revisar el perfil del cliente.
2. Validar diagnóstico.
3. Ajustar alcance.
4. Completar condiciones comerciales.
5. Pasar por QA.
6. Solicitar aprobación de Dirección.
7. Preparar versión final para cliente.

---

# 9. Resultado

Esta propuesta fue generada automáticamente desde el archivo de cliente:

$clientePath

Debe revisarse antes de cualquier uso comercial real.
"@

Set-Content -Path $outFile -Value $contenido -Encoding UTF8

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $Id `
  -Descripcion "Generar propuesta Odoo automática para $Cliente" `
  -Tipo "comercial + Odoo" `
  -Objeto $outFile `
  -Agente "Agente Comercial + Agente Odoo + Agente QA" `
  -Skill "Propuesta Cliente + Auditoría Odoo + QA Preproducción" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "Propuesta Odoo generada automáticamente desde archivo de cliente" `
  -Aprendizaje "El sistema ya puede generar propuestas Odoo a partir de un cliente registrado en Brain."

Write-Host ""
Write-Host "Propuesta generada correctamente:" -ForegroundColor Green
Write-Host $outFile
Write-Host ""

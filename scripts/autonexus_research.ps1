param(
    [Parameter(Mandatory=$true)]
    [string]$Nombre,

    [Parameter(Mandatory=$true)]
    [string]$Objetivo,

    [string]$Fuentes = "Google; GitHub; LinkedIn público; sitios empresariales; directorios públicos; marketplaces; foros públicos",
    [string]$Mercado = "habla hispana",
    [string]$Criterios = "necesidad activa; empresa real; contacto público verificable; oportunidad comercial razonable",
    [string]$DatosABuscar = "empresa; sitio web; país; necesidad detectada; fuente; contacto público; nivel de oportunidad",
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

$placeholders = @("Nombre", "Objetivo", "Nombre de investigacion", "Nombre de investigación")
if ($placeholders -contains $Nombre -or $placeholders -contains $Objetivo) {
    Write-Host "ERROR: Estás usando valores de ejemplo. Reemplazalos por datos reales o demo específicos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path ".\output\investigacion" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\reportes" | Out-Null
New-Item -ItemType Directory -Force -Path ".\output\data" | Out-Null

$safeNombre = Convert-ToSafeName $Nombre
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$researchPath = ".\output\investigacion\investigacion_${safeNombre}.md"
$qaPath = ".\output\reportes\qa_investigacion_${safeNombre}.md"
$csvPath = ".\output\data\leads_${safeNombre}.csv"

$doc = @"
# Investigación / Prospección: $Nombre

## Estado

Diseño interno de investigación profunda.  
No ejecuta scraping real todavía.  
No usa credenciales.  
No evade accesos.  
No envía mensajes automáticos.  
No publica resultados sin revisión.

## Fecha

$fecha

---

# 1. Objetivo

$Objetivo

---

# 2. Mercado objetivo

$Mercado

---

# 3. Fuentes a investigar

$Fuentes

---

# 4. Criterios de oportunidad

$Criterios

---

# 5. Datos a buscar

$DatosABuscar

---

# 6. Estrategia de búsqueda profunda

## 6.1 Búsquedas en Google / buscadores

Queries sugeridas:

- "necesito implementar Odoo" empresa
- "busco consultor Odoo" español
- "implementación Odoo" "contacto"
- "Odoo CRM ventas facturación empresa"
- "migración Odoo" "empresa"
- "consultoría Odoo" "necesitamos"
- "Odoo presupuesto implementación"
- "ERP para empresa" "Odoo"
- "problemas con Odoo" "empresa"
- "partner Odoo" "necesito"

## 6.2 GitHub

Buscar:

- repositorios Odoo activos
- issues con errores de implementación
- empresas que publican módulos propios
- integraciones Odoo incompletas
- forks abandonados
- proyectos con README comercial o contacto público

## 6.3 Directorios y sitios empresariales

Buscar:

- empresas con procesos comerciales complejos
- distribuidores
- ecommerce B2B
- empresas con catálogo grande
- empresas con formularios de contacto públicos
- empresas que mencionan CRM, ERP, facturación, inventario o automatización

## 6.4 Foros y comunidades públicas

Buscar señales como:

- pedidos de ayuda
- consultas de implementación
- problemas técnicos
- necesidad de migración
- falta de soporte
- búsqueda de automatización

---

# 7. Campos mínimos para registrar un lead

- empresa
- país / mercado
- sitio web
- fuente
- evidencia pública encontrada
- necesidad detectada
- contacto corporativo público
- tipo de oportunidad
- urgencia estimada
- ajuste con servicios Autonexus
- riesgo
- próximo paso recomendado

---

# 8. Scoring sugerido

## Alta oportunidad

- necesidad explícita
- empresa real
- contacto público
- problema actual
- urgencia reciente
- encaja con Odoo, automatización, CRM o desarrollo

## Media oportunidad

- señales parciales
- empresa real
- problema probable
- contacto público general

## Baja oportunidad

- información vieja
- sin contacto claro
- necesidad no explícita
- baja relación con servicios Autonexus

---

# 9. Reglas operativas

Permitido:

- investigar fuentes públicas
- registrar información empresarial pública
- crear reportes internos
- preparar listas de oportunidades
- clasificar leads
- proponer contacto manual
- generar borradores de mensajes para revisión

No permitido dentro de este sistema:

- evadir login o paywalls
- usar credenciales ajenas
- extraer datos privados
- hacer spam
- enviar mensajes automáticos sin aprobación
- violar restricciones técnicas de sitios
- publicar datos sensibles
- guardar tokens o secretos en GitHub

---

# 10. Próximos pasos

1. Validar fuentes.
2. Definir palabras clave.
3. Crear una planilla CSV inicial.
4. Ejecutar búsquedas manuales o asistidas.
5. Registrar oportunidades.
6. Pasar por QA.
7. Preparar contacto manual aprobado por Dirección.
"@

Set-Content -Path $researchPath -Value $doc -Encoding UTF8

$csv = @"
empresa,pais,sitio_web,fuente,evidencia_publica,necesidad_detectada,contacto_publico,tipo_oportunidad,urgencia,score,proximo_paso
Empresa Demo Investigación,Argentina,https://example.com,Fuente pública demo,""Consulta pública sobre Odoo"",""Implementación Odoo / CRM"",contacto@example.com,comercial + Odoo,media,70,""validar manualmente antes de contactar""
"@

Set-Content -Path $csvPath -Value $csv -Encoding UTF8

$puntaje = 0
$observaciones = New-Object System.Collections.Generic.List[string]

if ($doc -match "Objetivo") { $puntaje += 15 } else { $observaciones.Add("Falta objetivo.") }
if ($doc -match "Fuentes") { $puntaje += 15 } else { $observaciones.Add("Faltan fuentes.") }
if ($doc -match "Queries") { $puntaje += 15 } else { $observaciones.Add("Faltan queries.") }
if ($doc -match "Scoring") { $puntaje += 15 } else { $observaciones.Add("Falta scoring.") }
if ($doc -match "Campos mínimos") { $puntaje += 15 } else { $observaciones.Add("Faltan campos mínimos.") }
if ($doc -match "No permitido") { $puntaje += 15 } else { $observaciones.Add("Faltan límites operativos.") }
if ($doc -match "Dirección") { $puntaje += 10 } else { $observaciones.Add("Falta control de Dirección.") }

if ($puntaje -ge 85) {
    $estadoQA = "Aprobado como diseño de investigación interna"
}
elseif ($puntaje -ge 65) {
    $estadoQA = "Aprobado con observaciones"
}
else {
    $estadoQA = "Bloqueado"
}

if ($observaciones.Count -eq 0) {
    $obsTxt = "- Sin observaciones críticas."
} else {
    $obsTxt = ($observaciones | ForEach-Object { "- " + $_ }) -join "`r`n"
}

$qa = @"
# QA Investigación / Prospección

## Investigación revisada

$researchPath

## CSV base

$csvPath

## Estado QA

$estadoQA

## Puntaje

$puntaje / 100

---

# 1. Observaciones

$obsTxt

---

# 2. Decisión

Este diseño puede usarse como base de investigación interna.

Antes de ejecutar recolección masiva o contacto externo se requiere:

1. revisión humana,
2. validación de fuente,
3. validación de datos,
4. aprobación de Dirección,
5. control de contacto no invasivo.

---

# 3. Aprendizaje

Autonexus OS puede diseñar investigaciones profundas, pero debe separar diseño, recolección, validación, contacto y cierre.
"@

Set-Content -Path $qaPath -Value $qa -Encoding UTF8

$taskResearch = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskResearch `
  -Descripcion "Diseñar investigación/prospección: $Nombre" `
  -Tipo "investigación + prospección + scraping" `
  -Objeto $researchPath `
  -Agente "Agente PM + Agente Comercial + Agente Automatizaciones" `
  -Skill "Orquestación de Agentes + Cierre de Tarea" `
  -NivelPermiso 3 `
  -Riesgo "medio" `
  -Resultado "Diseño de investigación profunda creado" `
  -Aprendizaje "Autonexus OS puede preparar investigaciones y prospección con fuentes, queries, scoring y CSV base."

$taskQA = Get-NextTaskId

powershell -ExecutionPolicy Bypass -File .\scripts\registrar_tarea.ps1 `
  -Id $taskQA `
  -Descripcion "Realizar QA de investigación/prospección: $Nombre" `
  -Tipo "QA + investigación + prospección" `
  -Objeto $qaPath `
  -Agente "Agente QA + Agente PM" `
  -Skill "QA Preproducción + Cierre de Tarea" `
  -NivelPermiso 2 `
  -Riesgo "medio" `
  -Resultado "QA de investigación generado" `
  -Aprendizaje "Toda investigación de oportunidades debe pasar por QA antes de contacto externo."

if (Test-Path ".\scripts\panel_autonexus.ps1") {
    powershell -ExecutionPolicy Bypass -File .\scripts\panel_autonexus.ps1
}

git add .\scripts\autonexus_research.ps1 `
        .\output\investigacion `
        .\output\data `
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
    $CommitMessage = "Crear investigacion Autonexus: $Nombre"
}

git commit -m $CommitMessage
git push
git status

Write-Host ""
Write-Host "Investigación diseñada y subida a GitHub." -ForegroundColor Green
Write-Host "Diseño: $researchPath"
Write-Host "CSV: $csvPath"
Write-Host "QA: $qaPath"
Write-Host ""

# Instalación local en Windows

## Opción rápida

1. Descomprimir el ZIP.
2. Renombrar la carpeta como `AutonexusOS` si querés.
3. Moverla a `C:\AutonexusOS`.
4. Abrir `ui/grafo_3d_demo.html`.

## Opción con VS Code

1. Abrir VS Code.
2. File > Open Folder.
3. Elegir `C:\AutonexusOS`.
4. Leer `CLAUDE.md`.

## Opción con PowerShell

```powershell
cd C:\AutonexusOS
powershell -ExecutionPolicy Bypass -File scripts\abrir_demo.ps1
```

## Para subir a GitHub

```powershell
cd C:\AutonexusOS
git init
git add .
git commit -m "Inicializar Autonexus OS v0.1"
```

## Próximo paso

Cuando tengas Claude Code, abrir esta carpeta como proyecto y pedirle:

> Leé CLAUDE.md, GOVERNANCE.md, PERMISSIONS.md y TASK_PROTOCOL.md. Quiero trabajar dentro de Autonexus OS respetando el gobierno humano y el sistema de permisos.

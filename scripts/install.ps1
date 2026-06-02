# Expense Tracker - Installer / Launcher
# Click derecho -> "Ejecutar con PowerShell" o desde terminal: powershell -ExecutionPolicy Bypass -File install.ps1

$AppName = "ExpenseTracker"
$InstallDir = "$env:LOCALAPPDATA\$AppName"
$Port = 3000

Write-Host ""
Write-Host "=== Expense Tracker ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Check Node.js ---
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "Node.js no encontrado. Intentando instalar con winget..." -ForegroundColor Yellow
    $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $wingetPath) {
        Write-Host "ERROR: No se encontro ni Node.js ni winget." -ForegroundColor Red
        Write-Host "Instala Node.js manualmente desde https://nodejs.org (version LTS)" -ForegroundColor Red
        Write-Host "Presiona Enter para salir..."
        Read-Host
        exit 1
    }
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    $nodePath = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePath) {
        Write-Host "ERROR: Node.js se instalo pero necesitas reiniciar la terminal." -ForegroundColor Red
        Write-Host "Cierra esta ventana, abre una nueva y vuelve a ejecutar el script." -ForegroundColor Yellow
        Write-Host "Presiona Enter para salir..."
        Read-Host
        exit 1
    }
}

$nodeVersion = node --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# --- 2. Copy standalone build to install dir ---
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StandaloneDir = Join-Path $ScriptDir "standalone"

if (-not (Test-Path $StandaloneDir)) {
    Write-Host "ERROR: No se encontro la carpeta 'standalone' junto al script." -ForegroundColor Red
    Write-Host "Asegurate de que el ZIP se extrajo correctamente." -ForegroundColor Red
    Write-Host "Presiona Enter para salir..."
    Read-Host
    exit 1
}

# Kill existing process on port if running
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingProcess) {
    $pid = $existingProcess.OwningProcess
    Write-Host "Cerrando instancia anterior (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "Instalando en $InstallDir ..." -ForegroundColor Cyan

# Remove old installation but preserve nothing (data is in browser localStorage)
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
}
New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null

# Copy standalone build
Copy-Item -Path "$StandaloneDir\*" -Destination $InstallDir -Recurse -Force

# Copy static and public if present
$StaticDir = Join-Path $ScriptDir "static"
$PublicDir = Join-Path $ScriptDir "public"

if (Test-Path $StaticDir) {
    $destStatic = Join-Path $InstallDir ".next\static"
    New-Item -Path $destStatic -ItemType Directory -Force | Out-Null
    Copy-Item -Path "$StaticDir\*" -Destination $destStatic -Recurse -Force
}

if (Test-Path $PublicDir) {
    $destPublic = Join-Path $InstallDir "public"
    New-Item -Path $destPublic -ItemType Directory -Force | Out-Null
    Copy-Item -Path "$PublicDir\*" -Destination $destPublic -Recurse -Force
}

Write-Host "Instalacion completa." -ForegroundColor Green

# --- 3. Launch ---
Write-Host ""
Write-Host "Iniciando servidor en http://localhost:$Port ..." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$Port"

Set-Location $InstallDir
$env:PORT = $Port
$env:HOSTNAME = "localhost"
node server.js

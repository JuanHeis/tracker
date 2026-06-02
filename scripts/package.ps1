# Expense Tracker - Packager
# Builds the app and creates a distributable ZIP
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts/package.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DistDir = Join-Path $ProjectRoot "dist"
$ZipName = "ExpenseTracker.zip"

Write-Host ""
Write-Host "=== Empaquetando Expense Tracker ===" -ForegroundColor Cyan
Write-Host ""

# --- 1. Build ---
Write-Host "Paso 1/3: Construyendo la app..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: El build fallo." -ForegroundColor Red
    exit 1
}
Write-Host "Build completado." -ForegroundColor Green

# --- 2. Assemble dist folder ---
Write-Host "Paso 2/3: Armando paquete distribuible..." -ForegroundColor Yellow

if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force
}
New-Item -Path $DistDir -ItemType Directory -Force | Out-Null

# Copy standalone build
$StandaloneSrc = Join-Path $ProjectRoot ".next\standalone"
if (-not (Test-Path $StandaloneSrc)) {
    Write-Host "ERROR: No se encontro .next/standalone. Verifica que next.config tiene output: 'standalone'" -ForegroundColor Red
    exit 1
}
Copy-Item -Path $StandaloneSrc -Destination (Join-Path $DistDir "standalone") -Recurse

# Copy static assets (required by standalone)
$StaticSrc = Join-Path $ProjectRoot ".next\static"
if (Test-Path $StaticSrc) {
    Copy-Item -Path $StaticSrc -Destination (Join-Path $DistDir "static") -Recurse
}

# Copy public folder
$PublicSrc = Join-Path $ProjectRoot "public"
if (Test-Path $PublicSrc) {
    Copy-Item -Path $PublicSrc -Destination (Join-Path $DistDir "public") -Recurse
}

# Copy install script
Copy-Item -Path (Join-Path $ProjectRoot "scripts\install.ps1") -Destination $DistDir

Write-Host "Paquete armado." -ForegroundColor Green

# --- 3. Create ZIP ---
Write-Host "Paso 3/3: Creando ZIP..." -ForegroundColor Yellow

$ZipPath = Join-Path $ProjectRoot $ZipName
if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
}

Compress-Archive -Path "$DistDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal

$zipSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "=== Listo! ===" -ForegroundColor Green
Write-Host "Archivo: $ZipPath ($zipSize MB)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para tu amigo:" -ForegroundColor White
Write-Host "  1. Extraer el ZIP" -ForegroundColor Gray
Write-Host "  2. Click derecho en install.ps1 -> Ejecutar con PowerShell" -ForegroundColor Gray
Write-Host "  3. Se abre en http://localhost:3000" -ForegroundColor Gray
Write-Host ""

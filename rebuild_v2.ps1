# =============================================================
# Gestione_Ricorsi v2.0 - Rebuild Script
# Optimized for Vite + Python 3.12
# =============================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  GESTIONE RICORSI v2.0 - FULL REBUILD" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# --- Configurazione Percorsi ---
$VenvPython     = "$ProjectRoot\venv\Scripts\python.exe"
$VenvPyInstaller= "$ProjectRoot\venv\Scripts\pyinstaller.exe"
$DistDir        = "$ProjectRoot\dist"
$DbBackup       = "$ProjectRoot\legal_app.db"     # copia di sviluppo / backup
$DistDb         = "$DistDir\legal_app.db"

# --- PROTEZIONE DATABASE ---
# Prima di cancellare dist\, salviamo il DB se esiste
if (Test-Path $DistDb) {
    Write-Host ""
    Write-Host "--- Backup database da dist\ ---" -ForegroundColor Yellow
    Copy-Item -Path $DistDb -Destination $DbBackup -Force
    Write-Host "  Backup salvato in: $DbBackup" -ForegroundColor Green
}

# --- STEP 1: Build Frontend (Vite) ---
Write-Host ""
Write-Host "--- STEP 1: Build Frontend (Vite) ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE: Build frontend fallito!" -ForegroundColor Red
    exit 1
}
Set-Location $ProjectRoot

# --- STEP 2: Build Executable (PyInstaller) ---
Write-Host ""
Write-Host "--- STEP 2: Build Executable ---" -ForegroundColor Yellow

$pyinstallerArgs = @(
    "--onefile",
    "--noconsole",
    "--add-data=frontend/dist;frontend/dist",
    "--hidden-import=uvicorn.protocols.http.h11_impl",
    "--hidden-import=uvicorn.protocols.http.httptools_impl",
    "--hidden-import=uvicorn.protocols.websockets.websockets_impl",
    "--hidden-import=uvicorn.protocols.websockets.wsproto_impl",
    "--hidden-import=uvicorn.lifespan.on",
    "--hidden-import=uvicorn.logging",
    "--hidden-import=uvicorn.main",
    "--hidden-import=fastapi",
    "--hidden-import=sqlmodel",
    "--hidden-import=webview",
    "--hidden-import=clr",
    "--hidden-import=tkinter",
    "--hidden-import=tkinter.filedialog",
    "--collect-all=uvicorn",
    "--collect-all=fastapi",
    "--name=LegalAppealTracker",
    "--icon=app_icon.ico",
    "--clean",
    "--noconfirm",
    "backend/main.py"
)

& $VenvPyInstaller @pyinstallerArgs

# --- STEP 3: RIPRISTINO DATABASE ---
# Dopo la build, ripristiniamo il DB con i dati reali
Write-Host ""
Write-Host "--- STEP 3: Ripristino database in dist\ ---" -ForegroundColor Yellow

if (Test-Path $DbBackup) {
    Copy-Item -Path $DbBackup -Destination $DistDb -Force
    Write-Host "  Database ripristinato in: $DistDb" -ForegroundColor Green
} else {
    Write-Host "  Nessun backup trovato, dist\ avra' un DB vuoto." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "BUILD v2.0 COMPLETATO!" -ForegroundColor Green
Write-Host "Eseguibile pronto in: dist\LegalAppealTracker.exe" -ForegroundColor White

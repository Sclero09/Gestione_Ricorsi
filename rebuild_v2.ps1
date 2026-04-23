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
$PythonExe = "C:\Users\franc\AppData\Local\Programs\Python\Python312\python.exe"
$VenvPython = "$ProjectRoot\venv\Scripts\python.exe"
$VenvPyInstaller = "$ProjectRoot\venv\Scripts\pyinstaller.exe"

# --- STEP 1: Build Frontend (Vite) ---
Write-Host ""
Write-Host "--- STEP 1: Build Frontend (Vite) ---" -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm run build
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

Write-Host ""
Write-Host "BUILD v2.0 COMPLETATO!" -ForegroundColor Green
Write-Host "Eseguibile pronto in: dist\LegalAppealTracker.exe" -ForegroundColor White

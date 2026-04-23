from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
# pywebview requires pythonnet on Windows, which does not yet support Python 3.14.
# We guard the import so the app still works (opening the system browser as fallback).
try:
    import webview
    WEBVIEW_AVAILABLE = True
except Exception:
    webview = None
    WEBVIEW_AVAILABLE = False
import threading
import uvicorn
import subprocess
import sys
import time
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from database import engine, create_db_and_tables, get_session, AppConfig, Recurrent, Appeal, Document
from scanner import DirectoryScanner

# Request/Response Models
class RecurrentRequest(BaseModel):
    folder_name: str

class AppealUpdate(BaseModel):
    status: Optional[str] = None
    rg_number: Optional[str] = None
    court: Optional[str] = None
    hearing_date: Optional[str] = None
    presentation_date: Optional[str] = None
    outcome: Optional[str] = None
    is_liquidated: Optional[bool] = None
    is_billed: Optional[bool] = None
    is_paid: Optional[bool] = None

app = FastAPI(title="Legal Appeal Tracker API")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/api/settings")
def get_settings(session: Session = Depends(get_session)):
    config = session.exec(select(AppConfig)).first()
    return config or {"base_path": ""}

@app.post("/api/settings")
def update_settings(config_data: dict, session: Session = Depends(get_session)):
    config = session.exec(select(AppConfig)).first()
    if not config:
        config = AppConfig(
            base_path=config_data.get("base_path", ""),
            lawyer_name=config_data.get("lawyer_name", "Avv. Rossi"),
            studio_name=config_data.get("studio_name", "Studio Legale")
        )
    else:
        if "base_path" in config_data: config.base_path = config_data["base_path"]
        if "lawyer_name" in config_data: config.lawyer_name = config_data["lawyer_name"]
        if "studio_name" in config_data: config.studio_name = config_data["studio_name"]
    
    session.add(config)
    session.commit()
    session.refresh(config)
    return config

@app.get("/api/appeals")
def list_appeals(session: Session = Depends(get_session)):
    # Join Appeal with Recurrent
    statement = select(Appeal, Recurrent).join(Recurrent)
    results = session.exec(statement).all()
    
    appeals_list = []
    for appeal, recurrent in results:
        appeals_list.append({
            "id": appeal.id,
            "recurrent_id": recurrent.id,
            "name": f"{recurrent.surname} {recurrent.name}",
            "rg_number": appeal.rg_number,
            "court": appeal.court,
            "status": appeal.status,
            "is_liquidated": appeal.is_liquidated,
            "is_billed": appeal.is_billed,
            "is_paid": appeal.is_paid,
            "hearing_date": appeal.hearing_date.strftime("%d/%m/%Y") if appeal.hearing_date else None,
            "presentation_date": appeal.presentation_date.strftime("%d/%m/%Y") if appeal.presentation_date else None,
            "outcome": appeal.outcome,
            "folder_path": recurrent.folder_path
        })
    return appeals_list

@app.get("/api/recurrents")
def list_recurrents(session: Session = Depends(get_session)):
    statement = select(Recurrent)
    return session.exec(statement).all()

@app.get("/api/recurrents/{recurrent_id}/files")
def list_files(recurrent_id: int, session: Session = Depends(get_session)):
    statement = select(Document).where(Document.recurrent_id == recurrent_id)
    files = session.exec(statement).all()
    return files

@app.post("/api/scan")
def trigger_scan(session: Session = Depends(get_session)):
    try:
        config = session.exec(select(AppConfig)).first()
        if not config or not config.base_path:
            raise HTTPException(status_code=400, detail="Base path not set")
        
        scanner = DirectoryScanner(config.base_path)
        scanner.scan()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error scanning: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/refresh_folder/{recurrent_id}")
def refresh_folder(recurrent_id: int, session: Session = Depends(get_session)):
    try:
        config = session.exec(select(AppConfig)).first()
        if not config or not config.base_path:
            raise HTTPException(status_code=400, detail="Base path not configured")
        recurrent = session.get(Recurrent, recurrent_id)
        if not recurrent:
            raise HTTPException(status_code=404, detail="Recurrent not found")
        
        scanner = DirectoryScanner(config.base_path)
        scanner._scan_folder_files(recurrent, session)
        session.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error refreshing folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recurrents")
def create_recurrent(data: RecurrentRequest, session: Session = Depends(get_session)):
    config = session.exec(select(AppConfig)).first()
    if not config or not config.base_path:
        raise HTTPException(status_code=400, detail="Base path not set")
    
    folder_name = data.folder_name
    full_path = os.path.join(config.base_path, folder_name)
    
    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="Folder already exists")
    
    try:
        os.makedirs(full_path)
        scanner = DirectoryScanner(config.base_path)
        name, surname = scanner.parse_folder_name(folder_name)
        
        recurrent = Recurrent(
            name=name,
            surname=surname,
            folder_name=folder_name,
            folder_path=full_path
        )
        session.add(recurrent)
        session.commit()
        session.refresh(recurrent)
        
        # Create empty appeal
        appeal = Appeal(recurrent_id=recurrent.id)
        session.add(appeal)
        session.commit()
        
        return recurrent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/recurrents/{recurrent_id}/rename")
def rename_folder(recurrent_id: int, new_name: str, session: Session = Depends(get_session)):
    config = session.exec(select(AppConfig)).first()
    if not config or not config.base_path:
        raise HTTPException(status_code=400, detail="Base path not configured")
    scanner = DirectoryScanner(config.base_path)
    success = scanner.rename_recurrent_folder(recurrent_id, new_name)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to rename folder")
    return {"status": "success"}

@app.put("/api/appeals/{appeal_id}")
def update_appeal(appeal_id: int, data: AppealUpdate, session: Session = Depends(get_session)):
    appeal = session.get(Appeal, appeal_id)
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if hasattr(appeal, key):
            # Try to handle date conversion if field ends with _date
            if "_date" in key and value and isinstance(value, str):
                try:
                    setattr(appeal, key, datetime.strptime(value, "%d/%m/%Y"))
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Formato data non valido per {key}: usa GG/MM/AAAA")
            else:
                setattr(appeal, key, value)
    
    session.add(appeal)
    session.commit()
    session.refresh(appeal)
    return appeal

def _open_path(path: str, session: Session):
    # Security: Verify that the path is inside the configured base_path
    config = session.exec(select(AppConfig)).first()
    if not config or not config.base_path:
        return {"status": "error", "message": "Base path not configured"}
    
    abs_path = os.path.abspath(path)
    abs_base = os.path.abspath(config.base_path)
    
    if not abs_path.startswith(abs_base):
        return {"status": "error", "message": "Access denied: outside of base path"}

    if abs_path and os.path.exists(abs_path):
        if os.name == 'nt': # Windows
            os.startfile(abs_path)
        elif sys.platform == 'darwin': # macOS
            subprocess.run(['open', abs_path])
        else: # Linux
            subprocess.run(['xdg-open', abs_path])
        return {"status": "success"}
    return {"status": "error", "message": "Path not found"}

@app.post("/api/open_folder")
def open_folder(data: dict, session: Session = Depends(get_session)):
    return _open_path(data.get("path"), session)

@app.post("/api/open_file")
def open_file(data: dict, session: Session = Depends(get_session)):
    return _open_path(data.get("path"), session)

@app.get("/api/documents/view")
def view_document(path: str, session: Session = Depends(get_session)):
    # Security check for view as well
    config = session.exec(select(AppConfig)).first()
    if not config or not config.base_path:
         raise HTTPException(status_code=400, detail="Base path not configured")
    
    abs_path = os.path.abspath(path)
    abs_base = os.path.abspath(config.base_path)
    
    if not abs_path.startswith(abs_base):
         raise HTTPException(status_code=403, detail="Access denied")

    if os.path.exists(abs_path):
        return FileResponse(abs_path)
    raise HTTPException(status_code=404, detail="File not found")



# Determine if we are running in a bundle or dev
FRONTEND_DIR = None

if hasattr(sys, '_MEIPASS'):
    # In PyInstaller bundle
    FRONTEND_DIR = os.path.join(sys._MEIPASS, "frontend", "dist")
    if not os.path.exists(FRONTEND_DIR):
        print(f"Warning: Frontend directory not found at {FRONTEND_DIR}")
        FRONTEND_DIR = None
else:
    # In development
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")
    if not os.path.exists(FRONTEND_DIR):
        print(f"Warning: Frontend directory not found at {FRONTEND_DIR}")
        FRONTEND_DIR = None

if FRONTEND_DIR and os.path.exists(FRONTEND_DIR):
    # Vite uses 'assets' folder for static files
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="vite_assets")
    
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_frontend(full_path: str):
        # Important: Don't intercept API routes
        if full_path.startswith("api/"):
             raise HTTPException(status_code=404, detail="API route not found")

        # Serve static files if they exist
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html (SPA routing)
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        # Fallback to a simple HTML response
        return HTMLResponse("<h1>Legal Appeal Tracker - Backend API</h1><p>Frontend not available. API is running at this address.</p>")
else:
    # Fallback: serve a basic page if frontend is not available
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_fallback(full_path: str):
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Legal Appeal Tracker</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI'; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 50px auto; text-align: center; }
                h1 { color: #333; }
                p { color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Legal Appeal Tracker</h1>
                <p>Frontend files are not available.</p>
                <p>The backend API is running. Try accessing the API at /settings or /appeals</p>
            </div>
        </body>
        </html>
        """)

active_window = None

@app.post("/api/select_folder")
def select_folder():
    global active_window
    if WEBVIEW_AVAILABLE and active_window:
        # If running in PyWebView, use its native folder dialog
        try:
            result = active_window.create_file_dialog(webview.FOLDER_DIALOG)
            if result and len(result) > 0:
                return {"path": result[0]}
        except Exception as e:
            print(f"PyWebView dialog error: {e}")
    
    # Fallback to tkinter (works in dev mode and when pywebview is unavailable)
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        folder_selected = filedialog.askdirectory()
        root.destroy()
        if folder_selected:
            return {"path": folder_selected}
        return {"path": None}
    except Exception as e:
        print(f"Dialog error: {e}")
        return {"path": None, "error": str(e)}

class UvicornServer(uvicorn.Server):
    """Custom server to avoid signal issues in threads."""
    def install_signal_handlers(self):
        pass

def run_server():
    try:
        print("Starting Uvicorn server on http://127.0.0.1:8000", flush=True)
        config = uvicorn.Config(
            app=app, 
            host="127.0.0.1", 
            port=8000, 
            log_level="info"
        )
        server = UvicornServer(config=config)
        server.run()
    except Exception as e:
        print(f"Error starting server: {e}", flush=True)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Start FastAPI in a separate thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Give the server a moment to start
    time.sleep(3)
    
    url = "http://127.0.0.1:8000"

    if WEBVIEW_AVAILABLE:
        # Attempt to open a native desktop window via pywebview
        print(f"Opening webview at {url}", flush=True)
        try:
            active_window = webview.create_window('Legal Appeal Tracker', url, maximized=True)
            webview.start()
        except Exception as e:
            print(f"PyWebView failed ({e}), falling back to system browser.", flush=True)
            import webbrowser
            webbrowser.open(url)
            # Keep the server alive until the user closes the console window
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
    else:
        # pywebview not available – open the system browser and keep the server running
        print(f"PyWebView not available. Opening system browser at {url}", flush=True)
        import webbrowser
        webbrowser.open(url)
        print("Server running. Press Ctrl+C to quit.", flush=True)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

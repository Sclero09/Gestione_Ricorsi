from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select
from typing import Optional, List
from datetime import datetime
import os
import sys

def get_db_path():
    if hasattr(sys, '_MEIPASS'):
        # Running as a bundled executable
        base_dir = os.path.dirname(sys.executable)
    else:
        # Running in development mode
        # Path is relative to backend/database.py
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # The user requested the database in the same folder as the executable
    return os.path.join(base_dir, "legal_app.db")

sqlite_file_name = get_db_path()

class AppConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    base_path: str = Field(index=True)
    lawyer_name: str = Field(default="Avv. Rossi")
    studio_name: str = Field(default="Studio Legale")

class Recurrent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    surname: str = Field(index=True)
    folder_name: str
    folder_path: str
    created_at: datetime = Field(default_factory=datetime.now)
    
    appeals: List["Appeal"] = Relationship(back_populates="recurrent")

class Appeal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recurrent_id: int = Field(foreign_key="recurrent.id")
    rg_number: Optional[str] = None
    court: Optional[str] = None
    section: Optional[str] = None
    judge: Optional[str] = None
    hearing_date: Optional[datetime] = None
    presentation_date: Optional[datetime] = None
    status: str = Field(default="Nuovo")  # Nuovo, In Corso, Udienza Fissata, Concluso
    outcome: Optional[str] = None  # Accolto, Rigettato
    is_liquidated: bool = Field(default=False)
    is_billed: bool = Field(default=False)
    is_paid: bool = Field(default=False)
    vestanet_code: Optional[str] = None
    
    recurrent: Recurrent = Relationship(back_populates="appeals")
    documents: List["Document"] = Relationship(back_populates="appeal")

class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    appeal_id: Optional[int] = Field(default=None, foreign_key="appeal.id")
    recurrent_id: Optional[int] = Field(default=None, foreign_key="recurrent.id")
    file_name: str
    file_path: str
    file_type: str  # PDF, DOCX, etc.
    doc_category: Optional[str] = None  # Diniego, Fissazione Udienza, Liquidazione, Altro
    content_snippet: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    appeal: Optional[Appeal] = Relationship(back_populates="documents")

sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})

def create_db_and_tables():
    # Ensure directory exists if we decide to use a subfolder in the future,
    # but currently it's in the same folder as the EXE.
    parent_dir = os.path.dirname(sqlite_file_name)
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

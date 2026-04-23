import os
from typing import List, Tuple
from database import Recurrent, Appeal, Document, Session, engine, AppConfig
from analyzer import PDFAnalyzer
from sqlmodel import select

class DirectoryScanner:
    def __init__(self, base_path: str):
        self.base_path = base_path
        self.analyzer = PDFAnalyzer()

    def parse_folder_name(self, folder_name: str) -> Tuple[str, str]:
        # Basic heuristic: split by space, first word is surname, rest is name
        # Better: check for common patterns or just take the whole thing
        parts = folder_name.strip().split(' ')
        if len(parts) >= 2:
            # Often it's SURNAME FIRSTNAME
            surname = parts[0].upper()
            name = " ".join(parts[1:]).title()
            return name, surname
        return folder_name, ""

    def scan(self):
        try:
            with Session(engine) as session:
                # Get existing recurrents to avoid duplicates
                existing_recurrents = {r.folder_name: r for r in session.exec(select(Recurrent)).all()}
                
                for item in os.listdir(self.base_path):
                    full_path = os.path.join(self.base_path, item)
                    if os.path.isdir(full_path):
                        if item not in existing_recurrents:
                            name, surname = self.parse_folder_name(item)
                            recurrent = Recurrent(
                                name=name,
                                surname=surname,
                                folder_name=item,
                                folder_path=full_path
                            )
                            session.add(recurrent)
                            session.commit()
                            session.refresh(recurrent)
                            self._scan_folder_files(recurrent, session)
                        else:
                            # Maybe check for new files in existing folders
                            self._scan_folder_files(existing_recurrents[item], session)
        except Exception as e:
            print(f"Error during directory scan: {e}")
            import traceback
            traceback.print_exc()

    def _scan_folder_files(self, recurrent: Recurrent, session: Session):
        try:
            # Scan files inside a recurrent's folder
            existing_files = {d.file_path for d in session.exec(select(Document).where(Document.recurrent_id == recurrent.id)).all()}
            
            # Check if an appeal already exists for this recurrent
            appeal = session.exec(select(Appeal).where(Appeal.recurrent_id == recurrent.id)).first()
            if not appeal:
                appeal = Appeal(recurrent_id=recurrent.id)
                session.add(appeal)
                session.commit()
                session.refresh(appeal)

            for root, dirs, files in os.walk(recurrent.folder_path):
                for file in files:
                    try:
                        file_path = os.path.join(root, file)
                        if file_path not in existing_files:
                            extension = os.path.splitext(file)[1].lower()
                            
                            doc = Document(
                                recurrent_id=recurrent.id,
                                appeal_id=appeal.id,
                                file_name=file,
                                file_path=file_path,
                                file_type=extension[1:] if extension else "unknown"
                            )
                            
                            if extension == ".pdf":
                                try:
                                    analysis = self.analyzer.analyze_document(file_path)
                                    doc.doc_category = analysis["category"]
                                    doc.content_snippet = analysis["snippet"]
                                    
                                    # Update appeal info if it's a hearing decree
                                    if analysis["category"] == "Fissazione Udienza":
                                        data = analysis["data"]
                                        if "rg_number" in data: appeal.rg_number = data["rg_number"]
                                        if "court" in data: appeal.court = data["court"]
                                        if "judge" in data: appeal.judge = data["judge"]
                                        if "hearing_date" in data: 
                                            appeal.hearing_date = data["hearing_date"]
                                            appeal.status = "Udienza Fissata"
                                    
                                    elif analysis["category"] == "Esito Ricorso":
                                        data = analysis["data"]
                                        if "outcome" in data:
                                            appeal.outcome = data["outcome"]
                                            appeal.status = f"Concluso ({data['outcome']})"
                                        if "rg_number" in data and not appeal.rg_number:
                                            appeal.rg_number = data["rg_number"]
                                        if "court" in data and not appeal.court:
                                            appeal.court = data["court"]
                                            
                                    elif analysis["category"] == "Diniego":
                                        data = analysis["data"]
                                        if "vestanet_code" in data: appeal.vestanet_code = data["vestanet_code"]
                                except Exception as pdf_error:
                                    print(f"Error analyzing PDF {file_path}: {pdf_error}")
                                    doc.doc_category = "Errore"
                                    doc.content_snippet = f"Errore durante l'analisi: {str(pdf_error)[:100]}"

                            session.add(doc)
                    except Exception as file_error:
                        print(f"Error processing file {file}: {file_error}")
                        continue
                
                session.commit()
        except Exception as e:
            print(f"Error scanning folder {recurrent.folder_path}: {e}")
            import traceback
            traceback.print_exc()

    def rename_recurrent_folder(self, recurrent_id: int, new_name: str):
        with Session(engine) as session:
            recurrent = session.get(Recurrent, recurrent_id)
            if not recurrent: return False
            
            old_path = recurrent.folder_path
            parent_dir = os.path.dirname(old_path)
            new_path = os.path.join(parent_dir, new_name)
            
            try:
                os.rename(old_path, new_path)
                recurrent.folder_name = new_name
                recurrent.folder_path = new_path
                # Parse new name/surname
                recurrent.name, recurrent.surname = self.parse_folder_name(new_name)
                session.add(recurrent)
                session.commit()
                return True
            except Exception as e:
                print(f"Error renaming folder: {e}")
                return False

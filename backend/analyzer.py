import pdfplumber
import re
from datetime import datetime
from typing import Optional, Dict, Any

class PDFAnalyzer:
    def __init__(self):
        # Regex patterns
        self.patterns = {
            "rg_number": r"(?:R\.G\.|N\.\s*R\.G\.|Reg\.\s*Gen\.)\s*(\d+\s*[\/\-]\s*\d+)",
            "court": r"TRIBUNALE\s+(?:ORDINARIO\s+DI\s+|DI\s+)?([A-Z\s]+)",
            "section": r"SEZIONE\s+([A-Z\s,]+)",
            "judge": r"(?:Il\s+Giudice\s+designato\s*,\s*|Giudice\s+relatore\s*|G\.O\.T\.\s+|Dott\.\s+|Dott\.ssa\s+)([A-Z][a-z]+\s+[A-Z][a-z]+)",
            "recurrent": r"(?:proposto\s+da\s*:\s*|proposto\s+da\s+)([A-Z\s]+)(?:,)?",
            "hearing_date": r"(?:udienza\s+del\s+)(\d{2}/\d{2}/\d{4})",
            "presentation_date": r"(?:depositato\s+il\s+|presentato\s+il\s+|ricevuta\s+di\s+deposito\s+del\s+)(\d{2}/\d{2}/\d{4})",
            "vestanet": r"(?:vestanet|VestaNet|CUI)\s*[:\s]*([A-Z0-9]+)",
        }

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    try:
                        text += page.extract_text() or ""
                    except Exception as page_error:
                        print(f"Error extracting text from page: {page_error}")
                        continue
        except Exception as e:
            print(f"Error reading PDF {pdf_path}: {e}")
        return text

    def analyze_hearing_decree(self, text: str) -> Dict[str, Any]:
        results = {}
        
        # RG Number
        rg_match = re.search(self.patterns["rg_number"], text)
        if rg_match:
            results["rg_number"] = rg_match.group(1).replace(" ", "")

        # Court - Extract only the city
        court_match = re.search(self.patterns["court"], text)
        if court_match:
            full_court = court_match.group(1).strip()
            # Heuristic: find the last capitalized word(s) after "DI"
            parts = re.split(r'\s+DI\s+', full_court, flags=re.IGNORECASE)
            if len(parts) > 1:
                # Take the first word of the last part as the city
                results["court"] = parts[-1].split(' ')[0].strip()
            else:
                results["court"] = full_court.split(' ')[0].strip()

        # Judge
        judge_match = re.search(self.patterns["judge"], text)
        if judge_match:
            results["judge"] = judge_match.group(1).strip()

        # Recurrent
        recurrent_match = re.search(self.patterns["recurrent"], text)
        if recurrent_match:
            # We take the first line of the recurrent name
            results["recurrent_name"] = recurrent_match.group(1).strip().split('\n')[0]

        # Hearing Date
        date_match = re.search(self.patterns["hearing_date"], text)
        if date_match:
            try:
                results["hearing_date"] = datetime.strptime(date_match.group(1), "%d/%m/%Y")
            except ValueError:
                pass

        # Presentation Date
        pres_date_match = re.search(self.patterns["presentation_date"], text, re.IGNORECASE)
        if pres_date_match:
            try:
                results["presentation_date"] = datetime.strptime(pres_date_match.group(1), "%d/%m/%Y")
            except ValueError:
                pass

        return results

    def analyze_document(self, pdf_path: str) -> Dict[str, Any]:
        try:
            text = self.extract_text_from_pdf(pdf_path)
            
            if not text or not text.strip():
                return {
                    "category": "Scansione/Immagine",
                    "data": {"info": "Nessun testo estratto (probabile scansione o PDF protetto)"},
                    "snippet": ""
                }

            # Determine category based on content
            category = "Altro"
            data = {}
            
            if "FISSAZIONE UDIENZA" in text.upper():
                category = "Fissazione Udienza"
                data = self.analyze_hearing_decree(text)
            elif "ACCOGLIE" in text.upper() or "ACCOGLIMENTO" in text.upper() or ("DECRETO" in text.upper() and "RICONOSCIMENTO PROTEZIONE" in text.upper()):
                category = "Esito Ricorso"
                data = self.analyze_hearing_decree(text)  # Reusing the extractor as patterns are similar
                data["outcome"] = "Accolto"
            elif "RIGETTA" in text.upper():
                category = "Esito Ricorso"
                data = self.analyze_hearing_decree(text)
                data["outcome"] = "Rigettato"
            elif "DINIEGO" in text.upper() or "COMMISSIONE TERRITORIALE" in text.upper():
                category = "Diniego"
                data = {"type": "Diniego"}
                vestanet_match = re.search(self.patterns["vestanet"], text)
                if vestanet_match:
                    data["vestanet_code"] = vestanet_match.group(1)
            elif "LIQUIDAZIONE" in text.upper():
                category = "Liquidazione"
                data = {"type": "Liquidazione"}
            else:
                data = {}

            return {
                "category": category,
                "data": data,
                "snippet": text[:500]  # Store a snippet for search
            }
        except Exception as e:
            print(f"Error analyzing document {pdf_path}: {e}")
            import traceback
            traceback.print_exc()
            return {
                "category": "Errore",
                "data": {"error": str(e)},
                "snippet": ""
            }

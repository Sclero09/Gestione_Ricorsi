import sqlite3
import os

db_path = 'legal_app.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE appeal SET status = 'Concluso' WHERE status = 'Concluso (Accolto)'")
    print(f"Updated {cursor.rowcount} rows.")
    conn.commit()
    conn.close()
else:
    print("Database not found.")

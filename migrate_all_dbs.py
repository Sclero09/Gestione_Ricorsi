import sqlite3
import os

paths = [
    'legal_app.db',
    'dist/legal_app.db',
    'data/legal_app.db',
    'backup_v1/dist/legal_app.db'
]

for db_path in paths:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM appeal")
            count = cursor.fetchone()[0]
            print(f"DB {db_path} has {count} appeals.")
            if count > 0:
                cursor.execute("UPDATE appeal SET status = 'Concluso' WHERE status = 'Concluso (Accolto)'")
                print(f"  Updated {cursor.rowcount} rows in {db_path}")
                conn.commit()
        except:
            print(f"DB {db_path} error or no table.")
        conn.close()

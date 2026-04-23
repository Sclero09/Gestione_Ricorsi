import sqlite3
import os

db_paths = [
    'legal_app.db',
    'dist/legal_app.db'
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Updating {db_path}...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add column if missing
        try:
            cursor.execute("ALTER TABLE appeal ADD COLUMN is_archived BOOLEAN DEFAULT 0")
            conn.commit()
            print(f"  Column added to {db_path}.")
        except sqlite3.OperationalError as e:
            print(f"  Note for {db_path}: {e}")
            
        # Ensure no NULL values
        cursor.execute("UPDATE appeal SET is_archived = 0 WHERE is_archived IS NULL")
        conn.commit()
        print(f"  Visibility fixed for {cursor.rowcount} rows in {db_path}.")
        
        conn.close()
    else:
        print(f"Database {db_path} not found.")

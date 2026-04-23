import sqlite3
import os

db_path = 'legal_app.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE appeal ADD COLUMN is_archived BOOLEAN DEFAULT 0")
        conn.commit()
        print("Column 'is_archived' added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'is_archived' already exists.")
        else:
            print(f"Error: {e}")
    conn.close()
else:
    print("Database not found.")

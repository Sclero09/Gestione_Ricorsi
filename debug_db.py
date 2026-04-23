import sqlite3
conn = sqlite3.connect('legal_app.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cursor.fetchall())
for table in ['appeal', 'recurrent', 'appconfig']:
    try:
        cursor.execute(f"SELECT DISTINCT status FROM {table}")
        print(f"Statuses in {table}:", cursor.fetchall())
    except:
        pass
conn.close()

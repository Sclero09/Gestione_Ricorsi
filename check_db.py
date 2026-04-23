import sqlite3, os, sys

db = r'c:\wamp64\www\Gestione_Ricorsi\dist\legal_app.db'
print(f'DB path: {db}')
print(f'DB exists: {os.path.exists(db)}')
print(f'DB size: {os.path.getsize(db)} bytes')

con = sqlite3.connect(db)
cur = con.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', cur.fetchall())

cur.execute("PRAGMA table_info(appconfig)")
print('AppConfig columns:', cur.fetchall())

try:
    cur.execute('SELECT COUNT(*) FROM appeal')
    print('Appeals count:', cur.fetchone())
except Exception as e:
    print('Appeal error:', e)

try:
    cur.execute('SELECT COUNT(*) FROM recurrent')
    print('Recurrents count:', cur.fetchone())
except Exception as e:
    print('Recurrent error:', e)

try:
    cur.execute('SELECT * FROM appconfig')
    print('Config:', cur.fetchall())
except Exception as e:
    print('Config error:', e)

con.close()
print('DONE')

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
conn.autocommit = True
cur = conn.cursor()

try:
    print("Checking pcs table columns...")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pcs';")
    columns = [row[0] for row in cur.fetchall()]
    print(f"Existing columns: {columns}")

    alter_statements = []
    
    # In my earlier check of initialized database, I noticed lab_id was in seed_dummy_data.sql. Let's see if it's there.
    if 'lab_id' not in columns:
        print("Missing lab_id. Adding...")
        alter_statements.append("ADD COLUMN lab_id INT")
        # NOTE: To strictly add foreign key, we need it. For now just add column if missing.
        # Actually initialize.sql didn't have lab_id but seed_dummy_data had it? Let's verify.
    
    if 'processor' not in columns:
        alter_statements.append("ADD COLUMN processor VARCHAR(100)")
    if 'ram' not in columns:
        alter_statements.append("ADD COLUMN ram VARCHAR(50)")
    if 'storage' not in columns:
        alter_statements.append("ADD COLUMN storage VARCHAR(50)")
    if 'pc_no' not in columns:
        alter_statements.append("ADD COLUMN pc_no VARCHAR(50)")
    if 'status' not in columns:
        alter_statements.append("ADD COLUMN status VARCHAR(50) DEFAULT 'active'")
        
    if alter_statements:
        alter_query = f"ALTER TABLE pcs {', '.join(alter_statements)};"
        print(f"Executing: {alter_query}")
        cur.execute(alter_query)
        print("Migration successful.")
    else:
        print("No migration needed. Columns already exist.")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()

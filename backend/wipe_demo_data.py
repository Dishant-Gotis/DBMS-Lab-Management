import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def wipe_demo_data():
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            database=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "")
        )
        cur = conn.cursor()
        
        # We truncate labs CASCADE which automatically drops pcs, software, and assistant assignments associated with labs
        cur.execute("TRUNCATE TABLE labs CASCADE;")
        
        conn.commit()
        print("Demo labs, PCs, and software wiped successfully.")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    wipe_demo_data()

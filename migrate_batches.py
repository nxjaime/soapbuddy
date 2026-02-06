import sqlite3
import os

DB_PATH = "soapmanager.db"

def migrate_batches():
    print(f"Migrating batches table at {DB_PATH}...")
    
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(production_batches)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        # Add yield_quantity if missing
        if "yield_quantity" not in columns:
            print("Adding yield_quantity column...")
            cursor.execute("ALTER TABLE production_batches ADD COLUMN yield_quantity INTEGER DEFAULT 0 NOT NULL")
        else:
            print("yield_quantity already exists.")
            
        conn.commit()
        print("Migration complete!")
        
    except Exception as e:
        print(f"Error migrating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_batches()

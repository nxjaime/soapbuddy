import sqlite3
import os

DB_PATH = "soapmanager.db"

def migrate_db():
    print(f"Migrating database at {DB_PATH}...")
    
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(recipes)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Current columns in recipes: {columns}")
        
        # Add stock_quantity if missing
        if "stock_quantity" not in columns:
            print("Adding stock_quantity column...")
            cursor.execute("ALTER TABLE recipes ADD COLUMN stock_quantity INTEGER DEFAULT 0 NOT NULL")
        else:
            print("stock_quantity already exists.")
            
        # Add default_price if missing
        if "default_price" not in columns:
            print("Adding default_price column...")
            cursor.execute("ALTER TABLE recipes ADD COLUMN default_price FLOAT DEFAULT 0.0 NOT NULL")
        else:
            print("default_price already exists.")
            
        conn.commit()
        print("Migration complete!")
        
    except Exception as e:
        print(f"Error migrating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()

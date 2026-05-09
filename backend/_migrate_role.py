from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:admin123@127.0.0.1:5432/failsafe_db")
conn = engine.connect()
try:
    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'Faculty'"))
    conn.commit()
    print("SUCCESS: role column added to users table!")
except Exception as e:
    if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
        print("Column already exists, all good!")
    else:
        print(f"Error: {e}")
conn.close()

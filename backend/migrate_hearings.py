from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        cols = [
            ("judge_name", "VARCHAR(100) NULL"),
            ("hearing_type", "VARCHAR(100) NULL DEFAULT 'Trial'"),
            ("notes", "TEXT NULL"),
            ("outcome", "TEXT NULL")
        ]
        for col_name, col_def in cols:
            res = conn.execute(text(f"SHOW COLUMNS FROM hearings LIKE '{col_name}'")).fetchone()
            if not res:
                conn.execute(text(f"ALTER TABLE hearings ADD COLUMN {col_name} {col_def}"))
                print(f"Added column {col_name} to hearings table.")
        conn.commit()
        print("Schema migration completed successfully.")

if __name__ == "__main__":
    migrate()

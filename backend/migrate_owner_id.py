from app.database import engine
from sqlalchemy import text

def migrate():
    print("Starting database migration for client multi-user data isolation...")
    with engine.connect() as conn:
        # 1. Clean up legacy dummy/demo clients if present
        print("Cleaning up hardcoded dummy/demo clients from database...")
        conn.execute(text("DELETE FROM clients WHERE full_name IN ('Global Corp', 'Miller Estate', 'TechnoSoft Inc.', 'Jane Doe', 'Marcus Thorne')"))
        conn.commit()

        # 2. Check if owner_id column exists on clients table
        res = conn.execute(text("SHOW COLUMNS FROM clients LIKE 'owner_id'")).fetchone()
        if not res:
            print("Adding owner_id column and foreign key constraint to clients table...")
            # If there are any existing clients without owner_id, delete them to maintain foreign key integrity
            conn.execute(text("DELETE FROM clients"))
            conn.commit()

            conn.execute(text("""
                ALTER TABLE clients 
                ADD COLUMN owner_id INT NOT NULL,
                ADD CONSTRAINT fk_clients_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                ADD INDEX ix_clients_owner_id (owner_id)
            """))
            conn.commit()
            print("Successfully added owner_id column to clients table.")
        else:
            print("Column owner_id already exists in clients table.")

        # 3. Check if unique index exists on email and replace with standard index
        indexes = conn.execute(text("SHOW INDEX FROM clients WHERE Column_name = 'email'")).fetchall()
        for idx in indexes:
            # Key_name is index 2 in MySQL SHOW INDEX result tuple, Non_unique is index 1
            key_name = idx[2]
            non_unique = idx[1]
            if non_unique == 0 and key_name != "PRIMARY":
                print(f"Dropping unique index {key_name} from clients(email)...")
                conn.execute(text(f"DROP INDEX `{key_name}` ON clients"))
                conn.commit()
                print("Adding non-unique index ix_clients_email on clients(email)...")
                conn.execute(text("CREATE INDEX ix_clients_email ON clients(email)"))
                conn.commit()

        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()

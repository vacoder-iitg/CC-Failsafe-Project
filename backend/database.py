from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------
# UPDATE THIS LINE with your actual PostgreSQL credentials:
# Format: postgresql://username:password@localhost/database_name
# ---------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin123@127.0.0.1:5432/failsafe_db"

# The 'engine' is the actual connection to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 'SessionLocal' creates a temporary workspace for each API request to talk to the DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 'Base' is the master blueprint we will use to build our tables (like Students, RiskScores)
Base = declarative_base() 
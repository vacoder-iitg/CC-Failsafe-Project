from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
# Format: postgresql://username:password@localhost/database_name

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin123@127.0.0.1:5432/failsafe_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base() 
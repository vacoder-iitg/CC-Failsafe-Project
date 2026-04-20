import pandas as pd
from database import SessionLocal
import models

print("Opening Kaggle CSV file...")

try:
    df = pd.read_csv('../student-mat.csv', sep=';')
    if 'age' not in df.columns:
        df = pd.read_csv('../student-mat.csv', sep=',')
except Exception as e:
    print(f"Error finding or reading CSV: {e}")
    exit()

db = SessionLocal()

print(f"Found {len(df)} students. Injecting ALL features into PostgreSQL...")

for index, row in df.iterrows():
    # Convert the pandas row to a dictionary
    student_data = row.to_dict()
    
    # Add our custom name field
    student_data['student_name'] = f"Student {index + 1}"
    
    # Unpack the dictionary directly into the SQLAlchemy model
    db_student = models.Student(**student_data)
    db.add(db_student)

db.commit()
db.close()

print("Massive Success! All 33 Kaggle features are now in the database.")
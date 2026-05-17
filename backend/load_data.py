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

    student_data = row.to_dict()

    student_data['student_name'] = f"Student {index + 1}"
    db_student = models.Student(**student_data)
    db.add(db_student)

db.commit()
db.close()

print("All the student data are loaded #check2")
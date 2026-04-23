from sqlalchemy import Column, Integer, String, Float
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String) 

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(String, index=True, default="unassigned") 
    student_name = Column(String, index=True)
    
    # Demographic & Social
    age = Column(Integer)
    Medu = Column(Integer)
    Fedu = Column(Integer)
    
    # School Support & Extracurriculars
    schoolsup = Column(String)
    famsup = Column(String)
    paid = Column(String)
    activities = Column(String)
    nursery = Column(String)
    higher = Column(String)
    internet = Column(String)
    romantic = Column(String)
    
    # Lifestyle & Health
    freetime = Column(Integer)
    goout = Column(Integer)
    Dalc = Column(Integer)
    Walc = Column(Integer)
    health = Column(Integer)
    
    # Academic History
    absences = Column(Integer)
    failures = Column(Integer)
    studytime = Column(Integer)
    G1 = Column(Integer)
    G2 = Column(Integer)
    
    # Model Outputs
    risk_score = Column(Float)
    risk_category = Column(String)
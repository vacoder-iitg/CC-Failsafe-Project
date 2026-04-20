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
    age = Column(Integer)
    G1 = Column(Integer)
    absences = Column(Integer)
    failures = Column(Integer)
    studytime = Column(Integer)
    goout = Column(Integer)
    schoolsup = Column(String)
    famsup = Column(String)
    internet = Column(String)
    health = Column(Integer)
    risk_score = Column(Float)
    risk_category = Column(String)
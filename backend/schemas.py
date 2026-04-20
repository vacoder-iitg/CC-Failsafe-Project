from pydantic import BaseModel
from typing import Optional

class StudentCreate(BaseModel):
    student_name: str
    school: str
    sex: str
    age: int
    address: str
    famsize: str
    Pstatus: str
    Medu: int
    Fedu: int
    Mjob: str
    Fjob: str
    reason: str
    guardian: str
    traveltime: int
    studytime: int
    failures: int
    schoolsup: str
    famsup: str
    paid: str
    activities: str
    nursery: str
    higher: str
    internet: str
    romantic: str
    famrel: int
    freetime: int
    goout: int
    Dalc: int
    Walc: int
    health: int
    absences: int
    G1: int
    G2: int
    G3: int

class StudentResponse(StudentCreate):
    id: int
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None

    class Config:
        from_attributes = True
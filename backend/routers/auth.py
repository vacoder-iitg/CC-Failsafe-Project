from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from dependencies import get_db

router = APIRouter()

class UserAuth(BaseModel):
    username: str
    password: str
    role: str = "Teacher"  # 'Teacher' or 'HoD'

@router.post("/signup")
def create_user(user: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists. Please log in.")
    role = user.role if user.role in ('Teacher', 'HoD') else 'Teacher'
    new_user = models.User(username=user.username, password=user.password, role=role)
    db.add(new_user)
    db.commit()
    return {"message": "Account created successfully!"}

@router.post("/login")
def login_user(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please create an account.")
    
    if db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Incorrect password.")
    
    # NEW: Verify role matches
    if db_user.role != user.role:
        role_display = "Head of Department" if db_user.role == "HoD" else "Teacher"
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied. This account is registered as {role_display}. Please select the correct role above."
        )

    return {"token": db_user.username, "role": db_user.role or "Teacher"}

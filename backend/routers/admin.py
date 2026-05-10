from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
from database import engine
from dependencies import get_db

router = APIRouter()

@router.get("/admin/nuke")
def nuke_database(db: Session = Depends(get_db)):
    models.User.__table__.drop(engine, checkfirst=True)
    models.Student.__table__.drop(engine, checkfirst=True)
    models.User.__table__.create(engine)
    models.Student.__table__.create(engine)
    return {"message": "DATABASE COMPLETELY RESET FOR AUTHENTICATION!"}

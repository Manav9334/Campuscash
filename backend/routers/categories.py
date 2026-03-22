from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter()

@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()
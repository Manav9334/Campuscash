from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        name=user.name, email=user.email,
        password_hash=auth.hash_password(user.password),
        college=user.college, hostel_room=user.hostel_room,
        monthly_allowance=user.monthly_allowance
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not auth.verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(auth.get_current_user)):
    return current_user

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    college: Optional[str] = None
    monthly_allowance: Optional[float] = None

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(update: ProfileUpdate,
                   db: Session = Depends(get_db),
                   current_user=Depends(auth.get_current_user)):
    if update.name:              current_user.name              = update.name
    if update.college:           current_user.college           = update.college
    if update.monthly_allowance: current_user.monthly_allowance = update.monthly_allowance
    db.commit()
    db.refresh(current_user)
    return current_user

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
def change_password(data: PasswordChange,
                    db: Session = Depends(get_db),
                    current_user=Depends(auth.get_current_user)):
    if not auth.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = auth.hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
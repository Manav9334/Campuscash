from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    college: Optional[str] = None
    hostel_room: Optional[str] = None
    monthly_allowance: Optional[float] = 0.0

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    college: Optional[str]
    hostel_room: Optional[str]
    monthly_allowance: float
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TransactionCreate(BaseModel):
    category_id: Optional[int] = None
    amount: float
    type: str
    description: Optional[str] = None
    date: date

class TransactionOut(TransactionCreate):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    category_id: int
    limit_amount: float
    month: int
    year: int

class BudgetOut(BudgetCreate):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class SplitCreate(BaseModel):
    description: str
    total_amount: float
    date: date
    member_ids: List[int]
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db
from typing import Optional
import models, schemas, auth
from datetime import date

router = APIRouter()
@router.get("/categories/")
@router.post("/", response_model=schemas.TransactionOut)
def add_transaction(t: schemas.TransactionCreate,
                    db: Session = Depends(get_db),
                    user=Depends(auth.get_current_user)):
    txn = models.Transaction(**t.dict(), user_id=user.id)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn

@router.get("/")
def get_transactions(month: Optional[int]=None, year: Optional[int]=None,
                     db: Session = Depends(get_db),
                     user=Depends(auth.get_current_user)):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == user.id)
    if month: query = query.filter(extract('month', models.Transaction.date) == month)
    if year:  query = query.filter(extract('year',  models.Transaction.date) == year)
    return query.order_by(models.Transaction.date.desc()).all()

@router.delete("/{txn_id}")
def delete_transaction(txn_id: int, db: Session = Depends(get_db),
                       user=Depends(auth.get_current_user)):
    txn = db.query(models.Transaction).filter(
        models.Transaction.id == txn_id,
        models.Transaction.user_id == user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()
    return {"message": "Deleted"}

@router.get("/summary")
def get_summary(month: int, year: int,
                db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        extract('month', models.Transaction.date) == month,
        extract('year',  models.Transaction.date) == year
    ).all()
    total_income  = sum(t.amount for t in txns if t.type == 'income')
    total_expense = sum(t.amount for t in txns if t.type == 'expense')
    by_category   = {}
    for t in txns:
        if t.type == 'expense':
            cat = t.category.name if t.category else 'Other'
            by_category[cat] = by_category.get(cat, 0) + t.amount
    return {
        "total_income":  total_income,
        "total_expense": total_expense,
        "remaining":     total_income - total_expense,
        "by_category":   by_category
    }
@router.get("/prediction")
def spending_prediction(db: Session = Depends(get_db),
                        user=Depends(auth.get_current_user)):
    from datetime import datetime
    import calendar

    now          = datetime.now()
    month        = now.month
    year         = now.year
    day_of_month = now.day
    days_in_month = calendar.monthrange(year, month)[1]
    days_left    = days_in_month - day_of_month

    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        extract('month', models.Transaction.date) == month,
        extract('year',  models.Transaction.date) == year,
        models.Transaction.type == 'expense'
    ).all()

    total_spent  = sum(t.amount for t in txns)
    daily_avg    = total_spent / day_of_month if day_of_month > 0 else 0
    predicted    = round(daily_avg * days_in_month)
    over_budget  = predicted > user.monthly_allowance
    overspend_by = round(predicted - user.monthly_allowance) if over_budget else 0
    safe_daily   = round((user.monthly_allowance - total_spent) / days_left) if days_left > 0 else 0

    # Weekly breakdown
    from collections import defaultdict
    weekly = defaultdict(float)
    for t in txns:
        week_num = (t.date.day - 1) // 7 + 1
        weekly[f"Week {week_num}"] += t.amount

    return {
        "total_spent":     total_spent,
        "daily_average":   round(daily_avg),
        "predicted_total": predicted,
        "over_budget":     over_budget,
        "overspend_by":    overspend_by,
        "safe_daily_limit": safe_daily,
        "days_left":       days_left,
        "days_passed":     day_of_month,
        "weekly_breakdown": dict(weekly),
        "allowance":       user.monthly_allowance
    }
    
@router.get("/suggest-category")
def suggest_category(description: str,
                     db: Session = Depends(get_db),
                     user=Depends(auth.get_current_user)):
    desc = description.lower()
    keywords = {
        1: ['mess', 'food', 'lunch', 'dinner', 'breakfast', 'tiffin', 'thali', 'rice', 'dal'],
        2: ['canteen', 'snack', 'tea', 'coffee', 'biscuit', 'chips', 'juice', 'cold drink', 'dominos', 'pizza', 'burger'],
        3: ['auto', 'bus', 'ola', 'uber', 'rapido', 'train', 'metro', 'rickshaw', 'cab', 'transport', 'travel'],
        4: ['book', 'notes', 'xerox', 'pen', 'pencil', 'stationery', 'print', 'photocopy', 'notebook'],
        5: ['movie', 'netflix', 'prime', 'hotstar', 'game', 'concert', 'party', 'outing', 'fun', 'pub'],
        6: ['medicine', 'doctor', 'hospital', 'medical', 'pharmacy', 'tablet', 'injection', 'health'],
        7: ['shirt', 'jeans', 'clothes', 'shoes', 'clothing', 'dress', 'top', 'trouser'],
        8: ['recharge', 'mobile', 'sim', 'internet', 'wifi', 'data', 'phone', 'airtel', 'jio'],
    }
    for cat_id, words in keywords.items():
        if any(word in desc for word in words):
            cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
            return {"category_id": cat_id, "category_name": cat.name if cat else ""}
    return {"category_id": 9, "category_name": "Other"}
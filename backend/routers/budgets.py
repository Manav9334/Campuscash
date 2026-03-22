from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract
from database import get_db
import models, schemas, auth

router = APIRouter()

@router.post("/", response_model=schemas.BudgetOut)
def set_budget(b: schemas.BudgetCreate, db: Session = Depends(get_db),
               user=Depends(auth.get_current_user)):
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == user.id,
        models.Budget.category_id == b.category_id,
        models.Budget.month == b.month,
        models.Budget.year == b.year
    ).first()
    if existing:
        existing.limit_amount = b.limit_amount
        db.commit()
        return existing
    budget = models.Budget(**b.dict(), user_id=user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.get("/status")
def budget_status(month: int, year: int,
                  db: Session = Depends(get_db),
                  user=Depends(auth.get_current_user)):
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == user.id,
        models.Budget.month == month,
        models.Budget.year == year
    ).all()
    result = []
    for b in budgets:
        spent = sum(
            t.amount for t in db.query(models.Transaction).filter(
                models.Transaction.user_id == user.id,
                models.Transaction.category_id == b.category_id,
                models.Transaction.type == 'expense',
                extract('month', models.Transaction.date) == month,
                extract('year',  models.Transaction.date) == year
            ).all()
        )
        result.append({
            "category":     b.category.name,
            "limit":        b.limit_amount,
            "spent":        spent,
            "remaining":    b.limit_amount - spent,
            "percent_used": round((spent / b.limit_amount) * 100, 1) if b.limit_amount else 0,
            "is_over":      spent > b.limit_amount
        })
    return result
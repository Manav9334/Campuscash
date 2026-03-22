from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from pydantic import BaseModel
from database import get_db
from datetime import datetime
import models, auth, os, requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

def call_gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    res  = requests.post(url, json=body, timeout=30)
    data = res.json()
    print("GEMINI RESPONSE:", data)
    if "candidates" not in data:
        raise Exception(f"Gemini error: {data}")
    return data["candidates"][0]["content"]["parts"][0]["text"]

@router.post("/chat")
def chat(req: ChatRequest,
         db: Session = Depends(get_db),
         user=Depends(auth.get_current_user)):
    try:
        now   = datetime.now()
        month = now.month
        year  = now.year

        transactions = db.query(models.Transaction).filter(
            models.Transaction.user_id == user.id,
            extract('month', models.Transaction.date) == month,
            extract('year',  models.Transaction.date) == year
        ).all()

        total_expense = sum(t.amount for t in transactions if t.type == 'expense')
        remaining     = user.monthly_allowance - total_expense

        by_category = {}
        for t in transactions:
            if t.type == 'expense':
                cat = t.category.name if t.category else 'Other'
                by_category[cat] = by_category.get(cat, 0) + t.amount

        days_left = (datetime(year, month + 1, 1) - now).days if month < 12 else (datetime(year + 1, 1, 1) - now).days

        cat_lines = "\n".join([f"- {k}: Rs.{v}" for k, v in by_category.items()]) or "No expenses yet"
        txn_lines = "\n".join([
            f"- {t.date}: {t.description or 'No desc'} | {t.type} | Rs.{t.amount}"
            for t in transactions[-10:]
        ]) or "No transactions yet"

        prompt = f"""You are CampusCash AI, a friendly finance assistant for a college student in India.
Be concise, helpful and friendly. Use Rs. for currency. Keep response under 80 words.

Student: {user.name}
Monthly allowance: Rs.{user.monthly_allowance}
Total spent this month: Rs.{total_expense}
Remaining: Rs.{remaining}
Days left in month: {days_left}
Daily budget: Rs.{round(remaining/days_left) if days_left > 0 else 0}/day

Spending by category:
{cat_lines}

Recent transactions:
{txn_lines}

Question: {req.message}"""

        reply = call_gemini(prompt)
        return {"reply": reply}

    except Exception as e:
        print("AI ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/monthly-report")
def monthly_report(db: Session = Depends(get_db),
                   user=Depends(auth.get_current_user)):
    import calendar
    now   = datetime.now()
    month = now.month
    year  = now.year

    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        extract('month', models.Transaction.date) == month,
        extract('year',  models.Transaction.date) == year
    ).all()

    total_expense = sum(t.amount for t in txns if t.type == 'expense')
    total_income  = sum(t.amount for t in txns if t.type == 'income')

    by_category = {}
    for t in txns:
        if t.type == 'expense':
            cat = t.category.name if t.category else 'Other'
            by_category[cat] = by_category.get(cat, 0) + t.amount

    top_category = max(by_category, key=by_category.get) if by_category else "None"
    cat_lines    = "\n".join([f"- {k}: Rs.{v}" for k, v in by_category.items()])

    prompt = f"""You are CampusCash AI. Generate a friendly monthly financial report for a college student.
Keep it under 150 words. Use Rs. for currency. Include: summary, biggest expense area, 2-3 specific saving tips.

Student: {user.name}
Month: {now.strftime('%B %Y')}
Monthly allowance: Rs.{user.monthly_allowance}
Total spent: Rs.{total_expense}
Total income: Rs.{total_income}
Remaining: Rs.{user.monthly_allowance - total_expense}
Top spending category: {top_category}

Breakdown:
{cat_lines or 'No expenses'}

Write a warm, encouraging monthly report with actionable advice."""

    report = call_gemini(prompt)
    return {
        "report":        report,
        "total_expense": total_expense,
        "total_income":  total_income,
        "top_category":  top_category,
        "by_category":   by_category
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from pydantic import BaseModel
from typing import Optional
from database import get_db
from datetime import datetime, date, timedelta
import models, auth, os, requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter()

def call_gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    res  = requests.post(url, json=body, timeout=30)
    data = res.json()
    if "candidates" not in data:
        raise Exception(f"Gemini error: {data}")
    return data["candidates"][0]["content"]["parts"][0]["text"]

# ── STREAK ───────────────────────────────────────────────────────────────────

@router.get("/streak")
def get_streak(db: Session = Depends(get_db),
               user=Depends(auth.get_current_user)):
    streak = db.query(models.Streak).filter(
        models.Streak.user_id == user.id
    ).first()
    if not streak:
        streak = models.Streak(user_id=user.id)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    today     = date.today()
    is_active = streak.last_log_date == today if streak.last_log_date else False
    logged_yesterday = streak.last_log_date == today - timedelta(days=1) if streak.last_log_date else False
    return {
        "current_streak":  streak.current_streak,
        "longest_streak":  streak.longest_streak,
        "total_days":      streak.total_days,
        "last_log_date":   str(streak.last_log_date) if streak.last_log_date else None,
        "logged_today":    is_active,
        "streak_at_risk":  logged_yesterday and not is_active
    }

@router.post("/streak/log")
def log_streak(db: Session = Depends(get_db),
               user=Depends(auth.get_current_user)):
    streak = db.query(models.Streak).filter(
        models.Streak.user_id == user.id
    ).first()
    if not streak:
        streak = models.Streak(user_id=user.id)
        db.add(streak)

    today = date.today()
    if streak.last_log_date == today:
        return {"message": "Already logged today", "streak": streak.current_streak}

    if streak.last_log_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.total_days     += 1
    streak.last_log_date   = today
    db.commit()
    return {
        "message":        "Streak logged!",
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "is_milestone":   streak.current_streak in [3, 7, 14, 21, 30, 60, 100]
    }

# ── SAVINGS GOALS ────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    title:         str
    target_amount: float
    emoji:         Optional[str] = '🎯'
    deadline:      Optional[str] = None

class GoalDeposit(BaseModel):
    amount: float

@router.get("/goals")
def get_goals(db: Session = Depends(get_db),
              user=Depends(auth.get_current_user)):
    goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == user.id
    ).order_by(models.SavingsGoal.created_at.desc()).all()
    result = []
    for g in goals:
        pct = round((g.saved_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0
        result.append({
            "id":            g.id,
            "title":         g.title,
            "target_amount": g.target_amount,
            "saved_amount":  g.saved_amount,
            "emoji":         g.emoji,
            "deadline":      str(g.deadline) if g.deadline else None,
            "is_completed":  g.is_completed,
            "percent":       min(pct, 100),
            "remaining":     max(g.target_amount - g.saved_amount, 0)
        })
    return result

@router.post("/goals")
def create_goal(goal: GoalCreate,
                db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    new_goal = models.SavingsGoal(
        user_id       = user.id,
        title         = goal.title,
        target_amount = goal.target_amount,
        emoji         = goal.emoji or '🎯',
        deadline      = datetime.strptime(goal.deadline, '%Y-%m-%d').date() if goal.deadline else None
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.put("/goals/{goal_id}/deposit")
def deposit_to_goal(goal_id: int, deposit: GoalDeposit,
                    db: Session = Depends(get_db),
                    user=Depends(auth.get_current_user)):
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.saved_amount += deposit.amount
    if goal.saved_amount >= goal.target_amount:
        goal.is_completed = True
        goal.saved_amount = goal.target_amount
    db.commit()
    return {
        "message":       "Deposited!",
        "saved_amount":  goal.saved_amount,
        "is_completed":  goal.is_completed,
        "percent":       round((goal.saved_amount / goal.target_amount) * 100, 1)
    }

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int,
                db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}

# ── AI ROAST ─────────────────────────────────────────────────────────────────

@router.get("/roast")
def get_roast(db: Session = Depends(get_db),
              user=Depends(auth.get_current_user)):
    now        = datetime.now()
    week_start = now.date() - timedelta(days=now.weekday())

    existing = db.query(models.Roast).filter(
        models.Roast.user_id   == user.id,
        models.Roast.week_start == week_start
    ).first()
    if existing:
        return {"roast": existing.roast_text, "cached": True}

    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == user.id,
        extract('month', models.Transaction.date) == now.month,
        extract('year',  models.Transaction.date) == now.year,
        models.Transaction.type == 'expense'
    ).all()

    if not txns:
        return {"roast": "You haven't spent anything yet this month! Either you're incredibly frugal or you forgot to log your expenses. Either way, your wallet is giving you a standing ovation 👏", "cached": False}

    total    = sum(t.amount for t in txns)
    by_cat   = {}
    for t in txns:
        cat = t.category.name if t.category else 'Unknown'
        by_cat[cat] = by_cat.get(cat, 0) + t.amount
    top_cat  = max(by_cat, key=by_cat.get)
    top_amt  = by_cat[top_cat]

    prompt = f"""You are a funny, savage but friendly finance roast comedian for college students in India.
Roast this student's spending habits in 3-4 sentences. Be funny, use Gen Z language, reference Indian college life.
Use specific numbers. End with one genuine money tip disguised as a joke. Keep it under 80 words.

Student name: {user.name}
This month's total spending: Rs.{total}
Monthly allowance: Rs.{user.monthly_allowance}
Biggest splurge category: {top_cat} (Rs.{top_amt})
All categories: {', '.join([f"{k}: Rs.{v}" for k, v in by_cat.items()])}

Write the roast now — funny, specific, no intro needed:"""

    try:
        roast_text = call_gemini(prompt)
        roast = models.Roast(
            user_id    = user.id,
            roast_text = roast_text,
            week_start = week_start
        )
        db.add(roast)
        db.commit()
        return {"roast": roast_text, "cached": False}
    except Exception as e:
        return {"roast": f"Our AI roast master is on chai break. Try again in a moment! ☕", "cached": False}
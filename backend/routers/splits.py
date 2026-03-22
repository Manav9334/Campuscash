from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, auth, schemas

router = APIRouter()

@router.post("/")
def create_split(s: schemas.SplitCreate, db: Session = Depends(get_db),
                 user=Depends(auth.get_current_user)):
    split = models.SplitExpense(
        created_by=user.id, description=s.description,
        total_amount=s.total_amount, date=s.date
    )
    db.add(split)
    db.commit()
    db.refresh(split)
    per_person = round(s.total_amount / len(s.member_ids), 2)
    for uid in s.member_ids:
        member = models.SplitMember(
            split_id=split.id, user_id=uid, amount_owed=per_person
        )
        db.add(member)
    db.commit()
    return {"split_id": split.id, "per_person": per_person}

@router.get("/my")
def my_splits(db: Session = Depends(get_db), user=Depends(auth.get_current_user)):
    members = db.query(models.SplitMember).filter(
        models.SplitMember.user_id == user.id
    ).all()
    result = []
    for m in members:
        split = db.query(models.SplitExpense).filter(
            models.SplitExpense.id == m.split_id
        ).first()
        result.append({
            "member_id":   m.id,
            "split_id":    m.split_id,
            "description": split.description if split else "",
            "date":        str(split.date) if split else "",
            "total_amount": split.total_amount if split else 0,
            "amount_owed": m.amount_owed,
            "is_paid":     m.is_paid
        })
    return result

@router.put("/{split_id}/pay")
def mark_paid(split_id: int, db: Session = Depends(get_db),
              user=Depends(auth.get_current_user)):
    member = db.query(models.SplitMember).filter(
        models.SplitMember.split_id == split_id,
        models.SplitMember.user_id  == user.id
    ).first()
    if member:
        member.is_paid = True
        db.commit()
    return {"message": "Marked as paid"}

@router.put("/{split_id}/unpay")
def mark_unpaid(split_id: int, db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    member = db.query(models.SplitMember).filter(
        models.SplitMember.split_id == split_id,
        models.SplitMember.user_id  == user.id
    ).first()
    if member:
        member.is_paid = False
        db.commit()
    return {"message": "Marked as unpaid"}

@router.delete("/{split_id}")
def delete_split(split_id: int, db: Session = Depends(get_db),
                 user=Depends(auth.get_current_user)):
    member = db.query(models.SplitMember).filter(
        models.SplitMember.split_id == split_id,
        models.SplitMember.user_id  == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Split not found")
    db.delete(member)
    db.commit()
    return {"message": "Split deleted"}
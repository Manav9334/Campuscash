from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from database import get_db
import models, auth

router = APIRouter()

class FriendRequest(BaseModel):
    email: str

# ── Search user by email ─────────────────────────────────────────────────────
@router.get("/search")
def search_user(email: str, db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    found = db.query(models.User).filter(
        models.User.email == email,
        models.User.id    != user.id
    ).first()
    if not found:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":      found.id,
        "name":    found.name,
        "email":   found.email,
        "college": found.college
    }

# ── Send friend request ──────────────────────────────────────────────────────
@router.post("/request")
def send_request(req: FriendRequest, db: Session = Depends(get_db),
                 user=Depends(auth.get_current_user)):
    target = db.query(models.User).filter(models.User.email == req.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    existing = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.sender_id == user.id,   models.Friendship.receiver_id == target.id),
            and_(models.Friendship.sender_id == target.id, models.Friendship.receiver_id == user.id)
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Request already {existing.status}")

    friendship = models.Friendship(sender_id=user.id, receiver_id=target.id)
    db.add(friendship)
    db.commit()
    return {"message": f"Friend request sent to {target.name}"}

# ── Get all friend requests (incoming) ───────────────────────────────────────
@router.get("/requests")
def get_requests(db: Session = Depends(get_db),
                 user=Depends(auth.get_current_user)):
    pending = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user.id,
        models.Friendship.status      == 'pending'
    ).all()
    result = []
    for f in pending:
        sender = db.query(models.User).filter(models.User.id == f.sender_id).first()
        result.append({
            "friendship_id": f.id,
            "sender_id":     f.sender_id,
            "sender_name":   sender.name if sender else "Unknown",
            "sender_email":  sender.email if sender else "",
            "sender_college": sender.college if sender else ""
        })
    return result

# ── Accept / reject request ──────────────────────────────────────────────────
@router.put("/request/{friendship_id}")
def respond_request(friendship_id: int, action: str,
                    db: Session = Depends(get_db),
                    user=Depends(auth.get_current_user)):
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id          == friendship_id,
        models.Friendship.receiver_id == user.id
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found")
    if action not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Action must be accepted or rejected")
    friendship.status = action
    db.commit()
    return {"message": f"Request {action}"}

# ── Get all friends ──────────────────────────────────────────────────────────
@router.get("/list")
def get_friends(db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.sender_id   == user.id,
            models.Friendship.receiver_id == user.id
        ),
        models.Friendship.status == 'accepted'
    ).all()

    friends = []
    for f in friendships:
        friend_id = f.receiver_id if f.sender_id == user.id else f.sender_id
        friend    = db.query(models.User).filter(models.User.id == friend_id).first()
        if not friend: continue

        streak = db.query(models.Streak).filter(
            models.Streak.user_id == friend.id
        ).first()

        friends.append({
            "friendship_id":  f.id,
            "id":             friend.id,
            "name":           friend.name,
            "email":          friend.email,
            "college":        friend.college or "",
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
        })
    return friends

# ── Remove friend ────────────────────────────────────────────────────────────
@router.delete("/{friendship_id}")
def remove_friend(friendship_id: int, db: Session = Depends(get_db),
                  user=Depends(auth.get_current_user)):
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        or_(
            models.Friendship.sender_id   == user.id,
            models.Friendship.receiver_id == user.id
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    db.delete(friendship)
    db.commit()
    return {"message": "Friend removed"}

# ── Settle up tracker ─────────────────────────────────────────────────────────
@router.get("/settle-up")
def settle_up(db: Session = Depends(get_db),
              user=Depends(auth.get_current_user)):
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.sender_id   == user.id,
            models.Friendship.receiver_id == user.id
        ),
        models.Friendship.status == 'accepted'
    ).all()

    friend_ids = []
    friend_map = {}
    for f in friendships:
        fid = f.receiver_id if f.sender_id == user.id else f.sender_id
        friend_ids.append(fid)
        friend = db.query(models.User).filter(models.User.id == fid).first()
        if friend:
            friend_map[fid] = friend.name

    balances = {}
    for fid in friend_ids:
        balances[fid] = {
            "friend_id":   fid,
            "friend_name": friend_map.get(fid, "Unknown"),
            "they_owe_you": 0.0,
            "you_owe_them": 0.0,
            "net_balance":  0.0
        }

    # splits where user created and friend is member
    all_splits = db.query(models.SplitExpense).filter(
        models.SplitExpense.created_by == user.id
    ).all()
    for split in all_splits:
        members = db.query(models.SplitMember).filter(
            models.SplitMember.split_id == split.id,
            models.SplitMember.user_id.in_(friend_ids),
            models.SplitMember.is_paid == False
        ).all()
        for m in members:
            if m.user_id in balances:
                balances[m.user_id]["they_owe_you"] += m.amount_owed

    # splits where friend created and user is member
    my_splits = db.query(models.SplitMember).filter(
        models.SplitMember.user_id  == user.id,
        models.SplitMember.is_paid  == False
    ).all()
    for m in my_splits:
        split = db.query(models.SplitExpense).filter(
            models.SplitExpense.id == m.split_id,
            models.SplitExpense.created_by.in_(friend_ids)
        ).first()
        if split and split.created_by in balances:
            balances[split.created_by]["you_owe_them"] += m.amount_owed

    result = []
    for fid, b in balances.items():
        b["net_balance"] = round(b["they_owe_you"] - b["you_owe_them"], 2)
        result.append(b)

    return result

# ── Leaderboard ───────────────────────────────────────────────────────────────
@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db),
                user=Depends(auth.get_current_user)):
    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.sender_id   == user.id,
            models.Friendship.receiver_id == user.id
        ),
        models.Friendship.status == 'accepted'
    ).all()

    participants = [user.id]
    for f in friendships:
        fid = f.receiver_id if f.sender_id == user.id else f.sender_id
        participants.append(fid)

    board = []
    for uid in participants:
        u      = db.query(models.User).filter(models.User.id == uid).first()
        streak = db.query(models.Streak).filter(models.Streak.user_id == uid).first()
        if u:
            board.append({
                "user_id":        uid,
                "name":           u.name,
                "is_you":         uid == user.id,
                "current_streak": streak.current_streak if streak else 0,
                "longest_streak": streak.longest_streak if streak else 0,
                "total_days":     streak.total_days     if streak else 0,
            })

    board.sort(key=lambda x: x["current_streak"], reverse=True)
    for i, b in enumerate(board):
        b["rank"] = i + 1

    return board
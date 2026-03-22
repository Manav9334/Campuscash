from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, Date, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id                = Column(Integer, primary_key=True, index=True)
    name              = Column(String(100), nullable=False)
    email             = Column(String(100), unique=True, nullable=False)
    password_hash     = Column(String(255), nullable=False)
    college           = Column(String(150))
    hostel_room       = Column(String(50))
    monthly_allowance = Column(Float, default=0.0)
    created_at        = Column(TIMESTAMP, server_default=func.now())
    transactions      = relationship("Transaction", back_populates="user")
    budgets           = relationship("Budget", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    id    = Column(Integer, primary_key=True, index=True)
    name  = Column(String(50), nullable=False)
    icon  = Column(String(20))
    color = Column(String(10))

class Transaction(Base):
    __tablename__ = "transactions"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    amount      = Column(Float, nullable=False)
    type        = Column(Enum("income", "expense"), nullable=False)
    description = Column(String(255))
    date        = Column(Date, nullable=False)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    user        = relationship("User", back_populates="transactions")
    category    = relationship("Category")

class Budget(Base):
    __tablename__ = "budgets"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id  = Column(Integer, ForeignKey("categories.id"), nullable=False)
    limit_amount = Column(Float, nullable=False)
    month        = Column(Integer, nullable=False)
    year         = Column(Integer, nullable=False)
    user         = relationship("User", back_populates="budgets")
    category     = relationship("Category")

class SplitExpense(Base):
    __tablename__ = "split_expenses"
    id           = Column(Integer, primary_key=True, index=True)
    created_by   = Column(Integer, ForeignKey("users.id"), nullable=False)
    description  = Column(String(255), nullable=False)
    total_amount = Column(Float, nullable=False)
    date         = Column(Date, nullable=False)
    created_at   = Column(TIMESTAMP, server_default=func.now())
    members      = relationship("SplitMember", back_populates="split")

class SplitMember(Base):
    __tablename__ = "split_members"
    id          = Column(Integer, primary_key=True, index=True)
    split_id    = Column(Integer, ForeignKey("split_expenses.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount_owed = Column(Float, nullable=False)
    is_paid     = Column(Boolean, default=False)
    split       = relationship("SplitExpense", back_populates="members")
    
class Streak(Base):
    __tablename__ = "streaks"
    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), unique=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_log_date  = Column(Date, nullable=True)
    total_days     = Column(Integer, default=0)

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id            = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    title         = Column(String(100))
    target_amount = Column(Float)
    saved_amount  = Column(Float, default=0)
    emoji         = Column(String(10), default='🎯')
    deadline      = Column(Date, nullable=True)
    is_completed  = Column(Boolean, default=False)
    created_at    = Column(TIMESTAMP, server_default=func.now())

class Roast(Base):
    __tablename__ = "roasts"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    roast_text = Column(String(1000))
    week_start = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
class Friendship(Base):
    __tablename__ = "friendships"
    id          = Column(Integer, primary_key=True)
    sender_id   = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    status      = Column(String(20), default='pending')
    created_at  = Column(TIMESTAMP, server_default=func.now())
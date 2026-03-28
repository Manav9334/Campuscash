from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import users, transactions, budgets, splits, categories,ai
from routers import gamification
from routers import friends



Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusCash API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://campuscash-zeta.vercel.app/", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router,        prefix="/auth",         tags=["Auth"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(budgets.router,      prefix="/budgets",      tags=["Budgets"])
app.include_router(splits.router,       prefix="/splits",       tags=["Splits"])
app.include_router(categories.router,   prefix="/categories",   tags=["Categories"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(gamification.router, prefix="/gamification", tags=["Gamification"])
app.include_router(friends.router, prefix="/friends", tags=["Friends"])
@app.get("/")
def root():
    return {"message": "CampusCash API running!"}
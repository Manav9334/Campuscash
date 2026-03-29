# CampusCash

CampusCash is a student-friendly personal finance web application built to help users track expenses, manage budgets, split bills, monitor spending habits, and get AI-powered financial insights.

## website link

https://campuscash-zeta.vercel.app/

## Features

- User authentication and protected routes
- Dashboard with monthly allowance, spending, remaining balance, and daily safe limit
- Transactions management
- Budget tracking
- Friends and bill splitting
- Goals tracking
- AI Chat for finance-related insights
- Gamification elements like streaks and spending roast
- Monthly report section

## Tech Stack

### Frontend
- React.js
- Axios
- React Router
- Tailwind CSS / CSS
- Context API

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Python
- JWT Authentication
- SQLite / Database integration

## Project Structure

```bash
CAMPUSCASH/
│
├── backend/
│   ├── routers/
│   │   ├── ai.py
│   │   ├── budgets.py
│   │   ├── categories.py
│   │   ├── friends.py
│   │   ├── gamification.py
│   │   ├── splits.py
│   │   ├── transactions.py
│   │   └── users.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   └── schemas.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md

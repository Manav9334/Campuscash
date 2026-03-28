from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

categories = [
    models.Category(name='Mess / Food',      icon='food',      color='#378ADD'),
    models.Category(name='Canteen / Snacks', icon='snack',     color='#EF9F27'),
    models.Category(name='Transport',        icon='transport', color='#1D9E75'),
    models.Category(name='Stationery',       icon='book',      color='#D85A30'),
    models.Category(name='Entertainment',    icon='fun',       color='#D4537E'),
    models.Category(name='Medical',          icon='health',    color='#E24B4A'),
    models.Category(name='Clothing',         icon='shirt',     color='#7F77DD'),
    models.Category(name='Recharge',         icon='phone',     color='#5DCAA5'),
    models.Category(name='Other',            icon='misc',      color='#888780'),
]

existing = db.query(models.Category).count()
if existing == 0:
    db.add_all(categories)
    db.commit()
    print(f"Seeded {len(categories)} categories!")
else:
    print(f"Categories already exist ({existing} found), skipping seed.")

db.close()
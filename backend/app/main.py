from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, appointments, client as client_router, contact as contact_router
from .routers import reviews as reviews_router
from . import models
from .auth import hash_password
from sqlalchemy.orm import Session
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR DEFAULT ''"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR DEFAULT ''"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS county VARCHAR DEFAULT ''"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE"))
    _conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR DEFAULT ''"))
    _conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
    _conn.execute(text("ALTER TABLE reviews ALTER COLUMN appointment_id DROP NOT NULL"))
    _conn.execute(text("ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL"))
    _conn.execute(text("ALTER TABLE reviews ALTER COLUMN rating DROP NOT NULL"))
    _conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR DEFAULT ''"))
    _conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'approved'"))
    _conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_token VARCHAR"))
    _conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP"))
    _conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS token_used BOOLEAN DEFAULT FALSE"))
    _conn.commit()

app = FastAPI(title="Abundios Cleaning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(client_router.router)
app.include_router(contact_router.router)
app.include_router(reviews_router.router)

@app.on_event("startup")
def seed_defaults():
    db = Session(engine)
    if not db.query(models.User).filter(models.User.email == "lily@abundioscleaning.com").first():
        db.add(models.User(
            email="lily@abundioscleaning.com",
            username="lily",
            hashed_password=hash_password("lily1234"),
            first_name="Lily",
            last_name="Abundio-Alonso",
            role="admin",
            email_verified=True,
        ))
        db.commit()

    if db.query(models.ServiceType).count() == 0:
        db.add_all([
            models.ServiceType(name="General Cleaning", description="Standard home or office cleaning", duration_hours=2.0),
            models.ServiceType(name="Deep Cleaning", description="Thorough deep clean of all areas", duration_hours=4.0),
            models.ServiceType(name="Move-In / Move-Out", description="Full clean for move-in or move-out", duration_hours=5.0),
            models.ServiceType(name="Post-Construction", description="Clean-up after renovation or construction", duration_hours=6.0),
        ])
        db.commit()
    db.close()

@app.get("/")
def root():
    return {"status": "ok", "message": "Abundios Cleaning API"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, clients, appointments, client as client_router
from . import models
from .auth import hash_password
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Abundios Cleaning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(appointments.router)
app.include_router(client_router.router)

@app.on_event("startup")
def seed_defaults():
    db = Session(engine)
    if not db.query(models.User).filter(models.User.email == "lili@abundioscleaning.com").first():
        db.add(models.User(
            email="lili@abundioscleaning.com",
            username="lili",
            hashed_password=hash_password("lili1234"),
            first_name="Lili",
            last_name="Abundio-Alonso",
            role="admin"
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

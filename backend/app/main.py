from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, clients, appointments
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

@app.on_event("startup")
def create_default_user():
    db = Session(engine)
    existing = db.query(models.User).filter(models.User.username == "lili").first()
    if not existing:
        user = models.User(username="lili", hashed_password=hash_password("cambia-esta-password"))
        db.add(user)
        db.commit()
    db.close()

@app.get("/")
def root():
    return {"status": "ok", "message": "Abundios Cleaning API"}

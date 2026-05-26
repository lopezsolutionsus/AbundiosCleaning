from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth
from pydantic import BaseModel, EmailStr
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = "52874344580-o0slf4g1rao4mss8g0opffoecfk5nd17.apps.googleusercontent.com"

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginForm(BaseModel):
    identifier: str  # email o username
    password: str

class RegisterForm(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: Optional[str] = ""
    phone: Optional[str] = ""

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    first_name: str

@router.post("/login", response_model=Token)
def login(form: LoginForm, db: Session = Depends(get_db)):
    identifier = form.identifier.lower()
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.username == identifier)
    ).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = auth.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "first_name": user.first_name,
    }

@router.post("/register", response_model=Token)
def register(form: RegisterForm, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == form.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=form.email.lower(),
        hashed_password=auth.hash_password(form.password),
        first_name=form.first_name,
        last_name=form.last_name,
        phone=form.phone,
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = auth.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "first_name": user.first_name,
    }

class GoogleLoginForm(BaseModel):
    credential: str

@router.post("/google", response_model=Token)
def google_login(form: GoogleLoginForm, db: Session = Depends(get_db)):
    try:
        info = id_token.verify_oauth2_token(
            form.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = info["sub"]
    email = info.get("email", "").lower()
    first_name = info.get("given_name", "")
    last_name = info.get("family_name", "")

    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user and email:
        user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        user = models.User(
            email=email,
            google_id=google_id,
            first_name=first_name,
            last_name=last_name,
            hashed_password="",
            role="client",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        user.google_id = google_id
        db.commit()

    token = auth.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "first_name": user.first_name,
    }

@router.get("/me")
def me(current_user=Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
    }

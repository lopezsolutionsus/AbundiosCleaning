from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth
from pydantic import BaseModel
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as http_requests
import os
from twilio.rest import Client as TwilioClient

GOOGLE_CLIENT_ID = "52874344580-o0slf4g1rao4mss8g0opffoecfk5nd17.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "https://app.abundioscleaning.com/auth/google/callback"

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SID  = os.environ.get("TWILIO_VERIFY_SID", "")

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginForm(BaseModel):
    identifier: str
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
    phone_verified: bool = True

class GoogleCallbackForm(BaseModel):
    code: str

class SendCodeForm(BaseModel):
    phone: str  # 10 digits, sin +1

class VerifyCodeForm(BaseModel):
    phone: str
    code: str


@router.post("/login", response_model=Token)
def login(form: LoginForm, db: Session = Depends(get_db)):
    identifier = form.identifier.lower()
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.username == identifier)
    ).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "first_name": user.first_name, "phone_verified": True}


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
    return {"access_token": token, "token_type": "bearer", "role": user.role, "first_name": user.first_name, "phone_verified": True}


def _login_or_create_google_user(info: dict, db: Session):
    google_id  = info["sub"]
    email      = info.get("email", "").lower()
    first_name = info.get("given_name", "")
    last_name  = info.get("family_name", "")

    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user and email:
        user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        user = models.User(
            email=email, google_id=google_id,
            first_name=first_name, last_name=last_name,
            hashed_password="", role="client",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        user.google_id = google_id
        db.commit()

    return user


@router.post("/google/callback", response_model=Token)
def google_callback(form: GoogleCallbackForm, db: Session = Depends(get_db)):
    token_response = http_requests.post("https://oauth2.googleapis.com/token", data={
        "code": form.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    if not token_response.ok:
        raise HTTPException(status_code=401, detail="Failed to exchange Google code")

    id_token_str = token_response.json().get("id_token")
    try:
        info = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = _login_or_create_google_user(info, db)
    token = auth.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "first_name": user.first_name,
        "phone_verified": user.phone_verified,
    }


@router.post("/send-code")
def send_code(form: SendCodeForm, current_user=Depends(auth.get_current_user)):
    phone = "+1" + form.phone.strip().replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
    if len(phone) != 12:
        raise HTTPException(status_code=400, detail="Invalid US phone number")
    try:
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.verify.v2.services(TWILIO_VERIFY_SID).verifications.create(to=phone, channel="sms")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send verification code")
    return {"message": "Code sent"}


@router.post("/verify-code")
def verify_code(form: VerifyCodeForm, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    phone = "+1" + form.phone.strip().replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
    try:
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        check = client.verify.v2.services(TWILIO_VERIFY_SID).verification_checks.create(to=phone, code=form.code)
    except Exception:
        raise HTTPException(status_code=500, detail="Verification failed")

    if check.status != "approved":
        raise HTTPException(status_code=400, detail="Incorrect code")

    current_user.phone = phone
    current_user.phone_verified = True
    db.commit()
    return {"message": "Phone verified"}


@router.get("/me")
def me(current_user=Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "phone_verified": current_user.phone_verified,
    }

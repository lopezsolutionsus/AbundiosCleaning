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
import secrets
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from twilio.rest import Client as TwilioClient

GOOGLE_CLIENT_ID = "52874344580-o0slf4g1rao4mss8g0opffoecfk5nd17.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "https://app.abundioscleaning.com/auth/google/callback"

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_VERIFY_SID  = os.environ.get("TWILIO_VERIFY_SID", "")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "https://app.abundioscleaning.com")

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

class ForgotPasswordForm(BaseModel):
    email: str

class ResetPasswordForm(BaseModel):
    token: str
    password: str

class VerifyEmailForm(BaseModel):
    token: str


@router.post("/login", response_model=Token)
def login(form: LoginForm, db: Session = Depends(get_db)):
    identifier = form.identifier.lower()
    user = db.query(models.User).filter(
        (models.User.email == identifier) | (models.User.username == identifier)
    ).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in. Check your inbox.")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "first_name": user.first_name, "phone_verified": True}


def _send_verification_email(to_email: str, verify_url: str, first_name: str):
    if not SMTP_USER or not SMTP_PASS:
        return
    body = f"""Hi {first_name},

Thanks for creating an account with Abundios Cleaning!

Please verify your email address by clicking the link below (valid for 24 hours):

{verify_url}

If you didn't create an account, you can safely ignore this email.

— Abundios Cleaning
"""
    msg = MIMEText(body)
    msg["Subject"] = "Verify your Abundios Cleaning account"
    msg["From"] = f"Abundios Cleaning <{SMTP_USER}>"
    msg["To"] = to_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
    except Exception:
        pass


@router.post("/register")
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
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = secrets.token_urlsafe(32)
    verify_token = models.EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(verify_token)
    db.commit()

    verify_url = f"{APP_BASE_URL}/verify-email?token={token}"
    _send_verification_email(user.email, verify_url, user.first_name)

    return {"message": "verification_sent", "email": user.email}


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

    if not user.email_verified:
        user.email_verified = True
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


@router.post("/verify-email")
def verify_email_route(form: VerifyEmailForm, db: Session = Depends(get_db)):
    record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == form.token,
        models.EmailVerificationToken.used == False,
    ).first()
    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.email_verified = True
    record.used = True
    db.commit()

    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "first_name": user.first_name}


def _send_reset_email(to_email: str, reset_url: str, first_name: str):
    if not SMTP_USER or not SMTP_PASS:
        return
    body = f"""Hi {first_name},

We received a request to reset your Abundios Cleaning password.

Click the link below to set a new password (valid for 1 hour):

{reset_url}

If you didn't request this, you can safely ignore this email.

— Abundios Cleaning
"""
    msg = MIMEText(body)
    msg["Subject"] = "Reset your Abundios Cleaning password"
    msg["From"] = f"Abundios Cleaning <{SMTP_USER}>"
    msg["To"] = to_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
    except Exception:
        pass  # Don't leak email errors to the client


@router.post("/forgot-password")
def forgot_password(form: ForgotPasswordForm, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.email.lower()).first()
    # Always return 200 to avoid email enumeration
    if not user or not user.hashed_password:
        return {"message": "If that email is registered, you will receive a reset link shortly."}

    # Invalidate old tokens
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False,
    ).update({"used": True})

    token = secrets.token_urlsafe(32)
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset_token)
    db.commit()

    reset_url = f"{APP_BASE_URL}/reset-password?token={token}"
    _send_reset_email(user.email, reset_url, user.first_name)

    return {"message": "If that email is registered, you will receive a reset link shortly."}


@router.post("/reset-password")
def reset_password(form: ResetPasswordForm, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == form.token,
        models.PasswordResetToken.used == False,
    ).first()
    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")

    if len(form.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.hashed_password = auth.hash_password(form.password)
    record.used = True
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/users")
def list_users(current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "email_verified": u.email_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/me")
def me(current_user=Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "phone_verified": current_user.phone_verified,
        "email_verified": current_user.email_verified,
    }


class UpdateProfileForm(BaseModel):
    first_name: str
    last_name: Optional[str] = ""
    phone: Optional[str] = ""

class RequestEmailChangeForm(BaseModel):
    new_email: str

class ConfirmEmailChangeForm(BaseModel):
    code: str

class ChangePasswordForm(BaseModel):
    current_password: str
    new_password: str


@router.put("/me")
def update_me(form: UpdateProfileForm, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    current_user.first_name = form.first_name
    current_user.last_name  = form.last_name
    current_user.phone      = form.phone
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "phone": current_user.phone,
    }


def _send_email_change_code(to_email: str, code: str, first_name: str):
    if not SMTP_USER or not SMTP_PASS:
        return
    body = f"""Hi {first_name},

We received a request to change the email address on your Abundios Cleaning account.

Your verification code is: {code}

This code expires in 15 minutes. If you didn't request this change, you can safely ignore this email.

— Abundios Cleaning
"""
    msg = MIMEText(body)
    msg["Subject"] = "Your email change verification code"
    msg["From"]    = f"Abundios Cleaning <{SMTP_USER}>"
    msg["To"]      = to_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
    except Exception:
        pass


@router.post("/me/request-email-change")
def request_email_change(form: RequestEmailChangeForm, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    new_email = form.new_email.lower()
    if new_email == current_user.email:
        raise HTTPException(status_code=400, detail="New email is the same as your current email.")
    if db.query(models.User).filter(models.User.email == new_email).first():
        raise HTTPException(status_code=400, detail="Email already in use.")

    db.query(models.EmailChangeToken).filter(
        models.EmailChangeToken.user_id == current_user.id,
        models.EmailChangeToken.used == False,
    ).update({"used": True})

    code = str(random.randint(100000, 999999))
    db.add(models.EmailChangeToken(
        user_id=current_user.id,
        new_email=new_email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    ))
    db.commit()
    _send_email_change_code(current_user.email, code, current_user.first_name)
    return {"message": "Code sent to your current email."}


@router.post("/me/confirm-email-change")
def confirm_email_change(form: ConfirmEmailChangeForm, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    record = db.query(models.EmailChangeToken).filter(
        models.EmailChangeToken.user_id == current_user.id,
        models.EmailChangeToken.code == form.code,
        models.EmailChangeToken.used == False,
    ).first()
    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    if db.query(models.User).filter(models.User.email == record.new_email).first():
        raise HTTPException(status_code=400, detail="Email already in use.")

    current_user.email = record.new_email
    record.used = True
    db.commit()
    return {"message": "Email updated successfully.", "email": current_user.email}


@router.put("/me/password")
def change_password(form: ChangePasswordForm, current_user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if not current_user.hashed_password or not auth.verify_password(form.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(form.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = auth.hash_password(form.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth import get_current_user
import os, smtplib
from email.mime.text import MIMEText

router = APIRouter(prefix="/api/contact", tags=["contact"])

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", "lily@abundioscleaning.com")


class ContactForm(BaseModel):
    name: str
    email: str
    phone: str = ""
    service_type: str = ""
    message: str = ""


@router.post("", status_code=201)
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    inquiry = models.ContactInquiry(
        name=form.name,
        email=form.email,
        phone=form.phone,
        service_type=form.service_type,
        message=form.message,
    )
    db.add(inquiry)
    db.commit()
    _notify(form)
    return {"ok": True}


@router.get("")
def get_inquiries(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "staff"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden")
    inquiries = db.query(models.ContactInquiry).order_by(models.ContactInquiry.created_at.desc()).all()
    return [
        {
            "id":           i.id,
            "name":         i.name,
            "email":        i.email,
            "phone":        i.phone,
            "service_type": i.service_type,
            "message":      i.message,
            "created_at":   i.created_at.isoformat() if i.created_at else None,
        }
        for i in inquiries
    ]


def _notify(form: ContactForm):
    if not SMTP_USER or not SMTP_PASS:
        return
    body = f"""New quote request from abundioscleaning.com

Name:         {form.name}
Email:        {form.email}
Phone:        {form.phone}
Service:      {form.service_type}
Message:      {form.message}
"""
    msg = MIMEText(body)
    msg["Subject"] = f"New Quote Request — {form.name}"
    msg["From"] = f"Abundios Cleaning <{SMTP_USER}>"
    msg["To"] = NOTIFY_EMAIL
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [NOTIFY_EMAIL], msg.as_string())
    except Exception:
        pass

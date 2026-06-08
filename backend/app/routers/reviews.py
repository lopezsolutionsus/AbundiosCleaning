from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth import get_current_user, hash_password, create_access_token
import secrets
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


# Public: validate token and get client first name
@router.get("/by-token/{token}")
def get_token_info(token: str, db: Session = Depends(get_db)):
    review = db.query(models.Review).filter(
        models.Review.review_token == token,
        models.Review.token_used == False,
        models.Review.token_expires_at > datetime.utcnow(),
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    client = db.query(models.User).filter(models.User.id == review.user_id).first()
    return {"client_name": client.first_name if client else "", "valid": True}


# Public: submit review via token
class ReviewSubmit(BaseModel):
    rating: int
    comment: str = ""
    reviewer_name: str = ""

@router.post("/by-token/{token}")
def submit_review(token: str, body: ReviewSubmit, db: Session = Depends(get_db)):
    review = db.query(models.Review).filter(
        models.Review.review_token == token,
        models.Review.token_used == False,
        models.Review.token_expires_at > datetime.utcnow(),
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    review.rating = body.rating
    review.comment = body.comment
    review.reviewer_name = body.reviewer_name
    review.token_used = True
    review.status = "pending"
    db.commit()
    return {"ok": True}


# Public: signup from review link (activate pending account)
class ReviewSignup(BaseModel):
    token: str
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""
    phone: str = ""

@router.post("/by-token/{token}/signup")
def signup_from_review(token: str, body: ReviewSignup, db: Session = Depends(get_db)):
    review = db.query(models.Review).filter(models.Review.review_token == token).first()
    if not review:
        raise HTTPException(status_code=404, detail="Invalid link")
    existing = db.query(models.User).filter(models.User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    client = db.query(models.User).filter(models.User.id == review.user_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client.email = body.email.lower()
    client.hashed_password = hash_password(body.password)
    client.status = "active"
    client.email_verified = True
    if body.first_name:
        client.first_name = body.first_name
    if body.last_name:
        client.last_name = body.last_name
    if body.phone:
        client.phone = body.phone
    db.commit()
    jwt_token = create_access_token({"sub": client.email})
    return {"access_token": jwt_token, "token_type": "bearer", "role": client.role, "first_name": client.first_name}


# Public: approved reviews for landing page
@router.get("/public")
def get_public_reviews(db: Session = Depends(get_db)):
    reviews = (
        db.query(models.Review)
        .filter(models.Review.status == "approved", models.Review.rating != None)
        .order_by(models.Review.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": r.id,
            "reviewer_name": r.reviewer_name or "",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


# Admin: list all submitted reviews for moderation
@router.get("")
def list_reviews(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "staff"):
        raise HTTPException(status_code=403)
    reviews = (
        db.query(models.Review)
        .filter(models.Review.rating != None)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "reviewer_name": r.reviewer_name or "",
            "rating": r.rating,
            "comment": r.comment,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]


# Admin: approve review
@router.put("/{review_id}/approve")
def approve_review(review_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "staff"):
        raise HTTPException(status_code=403)
    r = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404)
    r.status = "approved"
    db.commit()
    return {"ok": True}


# Admin: reject review
@router.put("/{review_id}/reject")
def reject_review(review_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("admin", "staff"):
        raise HTTPException(status_code=403)
    r = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404)
    r.status = "rejected"
    db.commit()
    return {"ok": True}

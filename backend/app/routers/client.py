from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..auth import get_current_user
from .. import models

router = APIRouter(prefix="/api/client", tags=["client"])


# ── Properties ──────────────────────────────────────────────────────────────

class PropertyIn(BaseModel):
    name: str
    type: str = "house"
    address: str
    city: str
    state: str = "VA"
    zip_code: str = ""
    notes: str = ""


@router.get("/properties")
def get_properties(user=Depends(get_current_user), db: Session = Depends(get_db)):
    props = db.query(models.Property).filter(models.Property.user_id == user.id).all()
    return [
        {
            "id": p.id, "name": p.name, "type": p.type,
            "address": p.address, "city": p.city, "state": p.state,
            "zip_code": p.zip_code, "notes": p.notes,
        }
        for p in props
    ]


@router.post("/properties", status_code=201)
def create_property(body: PropertyIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = models.Property(user_id=user.id, **body.dict())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {
        "id": prop.id, "name": prop.name, "type": prop.type,
        "address": prop.address, "city": prop.city, "state": prop.state,
        "zip_code": prop.zip_code, "notes": prop.notes,
    }


@router.delete("/properties/{property_id}", status_code=204)
def delete_property(property_id: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = db.query(models.Property).filter(
        models.Property.id == property_id,
        models.Property.user_id == user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()


# ── Service Types ────────────────────────────────────────────────────────────

@router.get("/service-types")
def get_service_types(db: Session = Depends(get_db), user=Depends(get_current_user)):
    services = db.query(models.ServiceType).all()
    return [
        {"id": s.id, "name": s.name, "description": s.description, "duration_hours": s.duration_hours}
        for s in services
    ]


# ── Quotes ───────────────────────────────────────────────────────────────────

class QuoteIn(BaseModel):
    property_id: str
    service_type_id: str
    sqft: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    cleanliness_level: int = 3
    notes: str = ""


@router.post("/quotes", status_code=201)
def create_quote(body: QuoteIn, user=Depends(get_current_user), db: Session = Depends(get_db)):
    prop = db.query(models.Property).filter(
        models.Property.id == body.property_id,
        models.Property.user_id == user.id
    ).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    quote = models.Quote(user_id=user.id, **body.dict())
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return {"id": quote.id, "status": quote.status}


@router.get("/quotes")
def get_quotes(user=Depends(get_current_user), db: Session = Depends(get_db)):
    quotes = (
        db.query(models.Quote)
        .filter(models.Quote.user_id == user.id)
        .order_by(models.Quote.created_at.desc())
        .all()
    )
    return [
        {
            "id": q.id,
            "status": q.status,
            "service_type_name": q.service_type.name if q.service_type else "",
            "property_address": f"{q.property.address}, {q.property.city}" if q.property else "",
            "sqft": q.sqft,
            "final_price": q.final_price,
            "created_at": str(q.created_at),
        }
        for q in quotes
    ]


# ── Appointments ─────────────────────────────────────────────────────────────

@router.get("/appointments")
def get_appointments(user=Depends(get_current_user), db: Session = Depends(get_db)):
    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.user_id == user.id)
        .order_by(models.Appointment.date.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "date": a.date,
            "time": a.time,
            "status": a.status,
            "type": a.service_type.name if a.service_type else "",
            "property_address": f"{a.property.address}, {a.property.city}" if a.property else "",
        }
        for a in appts
    ]

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from .. import models, auth

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.get("", response_model=List[AppointmentOut])
def get_appointments(
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user)
):
    query = db.query(models.Appointment)
    if date:
        query = query.filter(models.Appointment.date == date)
    appointments = query.order_by(models.Appointment.date, models.Appointment.time).all()
    result = []
    for a in appointments:
        out = AppointmentOut.model_validate(a)
        out.client = f"{a.client_rel.first_name} {a.client_rel.last_name}".strip()
        result.append(out)
    return result

@router.post("", response_model=AppointmentOut)
def create_appointment(appt: AppointmentCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    client = db.query(models.Client).filter(models.Client.id == appt.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db_appt = models.Appointment(**appt.model_dump())
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    out = AppointmentOut.model_validate(db_appt)
    out.client = f"{client.first_name} {client.last_name}".strip()
    return out

@router.put("/{appt_id}", response_model=AppointmentOut)
def update_appointment(appt_id: str, appt: AppointmentUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in appt.model_dump().items():
        setattr(db_appt, key, value)
    db.commit()
    db.refresh(db_appt)
    out = AppointmentOut.model_validate(db_appt)
    out.client = f"{db_appt.client_rel.first_name} {db_appt.client_rel.last_name}".strip()
    return out

@router.delete("/{appt_id}")
def delete_appointment(appt_id: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(db_appt)
    db.commit()
    return {"ok": True}

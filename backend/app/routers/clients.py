from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import ClientCreate, ClientUpdate, ClientOut
from .. import models, auth

router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.get("", response_model=List[ClientOut])
def get_clients(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    return db.query(models.Client).order_by(models.Client.last_name, models.Client.first_name).all()

@router.post("", response_model=ClientOut)
def create_client(client: ClientCreate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: str, client: ClientUpdate, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    for key, value in client.model_dump().items():
        setattr(db_client, key, value)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(db_client)
    db.commit()
    return {"ok": True}

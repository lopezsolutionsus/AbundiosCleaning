from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import Token, LoginForm
from .. import models, auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(form: LoginForm, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form.username.lower()).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = auth.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

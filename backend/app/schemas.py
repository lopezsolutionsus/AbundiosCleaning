from pydantic import BaseModel
from typing import Optional

class ClientCreate(BaseModel):
    first_name: str
    last_name:  Optional[str] = ""
    phone:      Optional[str] = ""
    address:    Optional[str] = ""
    notes:      Optional[str] = ""
    status:     Optional[str] = "client"

class ClientUpdate(ClientCreate):
    pass

class ClientOut(ClientCreate):
    id: str
    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    client_id: str
    property:  Optional[str] = ""
    date:      str
    time:      Optional[str] = ""
    type:      Optional[str] = "general"
    notes:     Optional[str] = ""

class AppointmentUpdate(AppointmentCreate):
    pass

class AppointmentOut(AppointmentCreate):
    id:     str
    client: Optional[str] = ""
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type:   str

class LoginForm(BaseModel):
    username: str
    password: str

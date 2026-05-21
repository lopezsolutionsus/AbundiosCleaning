from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"

    id         = Column(String, primary_key=True, default=gen_id)
    first_name = Column(String, nullable=False, default="")
    last_name  = Column(String, nullable=False, default="")
    phone      = Column(String, default="")
    address    = Column(String, default="")
    notes      = Column(Text, default="")
    status     = Column(String, default="client")

    appointments = relationship("Appointment", back_populates="client_rel", cascade="all, delete")

class Appointment(Base):
    __tablename__ = "appointments"

    id        = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    property  = Column(String, default="")
    date      = Column(String, nullable=False)
    time      = Column(String, default="")
    type      = Column(String, default="general")
    notes     = Column(Text, default="")

    client_rel = relationship("Client", back_populates="appointments")

class User(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True, default=gen_id)
    username        = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

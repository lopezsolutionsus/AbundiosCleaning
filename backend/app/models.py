from sqlalchemy import Column, String, Text, ForeignKey, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id              = Column(String, primary_key=True, default=gen_id)
    email           = Column(String, unique=True, nullable=False)
    username        = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    first_name      = Column(String, nullable=False, default="")
    last_name       = Column(String, nullable=False, default="")
    phone           = Column(String, default="")
    role            = Column(String, default="client")  # admin / staff / client
    google_id       = Column(String, nullable=True)
    created_at      = Column(DateTime, server_default=func.now())

    properties         = relationship("Property", back_populates="owner", cascade="all, delete")
    quotes             = relationship("Quote", back_populates="client", cascade="all, delete")
    appointments       = relationship("Appointment", foreign_keys="Appointment.user_id", back_populates="client")
    staff_appointments = relationship("Appointment", foreign_keys="Appointment.staff_id", back_populates="staff")
    reviews            = relationship("Review", back_populates="author", cascade="all, delete")
    staff_profile      = relationship("StaffProfile", back_populates="user", uselist=False, cascade="all, delete")


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id           = Column(String, primary_key=True, default=gen_id)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    availability = Column(Text, default="")
    service_area = Column(String, default="")
    notes        = Column(Text, default="")

    user = relationship("User", back_populates="staff_profile")


class ServiceType(Base):
    __tablename__ = "service_types"

    id             = Column(String, primary_key=True, default=gen_id)
    name           = Column(String, nullable=False)
    description    = Column(Text, default="")
    duration_hours = Column(Float, default=2.0)

    quotes       = relationship("Quote", back_populates="service_type")
    appointments = relationship("Appointment", back_populates="service_type")


class Property(Base):
    __tablename__ = "properties"

    id        = Column(String, primary_key=True, default=gen_id)
    user_id   = Column(String, ForeignKey("users.id"), nullable=False)
    name      = Column(String, nullable=False, default="")
    type      = Column(String, default="house")  # house/apartment/office/other
    address   = Column(String, default="")
    city      = Column(String, default="")
    state     = Column(String, default="")
    zip_code  = Column(String, default="")
    latitude  = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes     = Column(Text, default="")

    owner        = relationship("User", back_populates="properties")
    quotes       = relationship("Quote", back_populates="property")
    appointments = relationship("Appointment", back_populates="property")


class Quote(Base):
    __tablename__ = "quotes"

    id                = Column(String, primary_key=True, default=gen_id)
    user_id           = Column(String, ForeignKey("users.id"), nullable=False)
    property_id       = Column(String, ForeignKey("properties.id"), nullable=False)
    service_type_id   = Column(String, ForeignKey("service_types.id"), nullable=False)
    sqft              = Column(Float, nullable=True)
    bedrooms          = Column(Integer, nullable=True)
    bathrooms         = Column(Integer, nullable=True)
    cleanliness_level = Column(Integer, default=3)
    status            = Column(String, default="pending")  # pending/sent/accepted/rejected
    gas_cost          = Column(Float, default=0.0)
    staff_cost        = Column(Float, default=0.0)
    other_costs       = Column(Float, default=0.0)
    total_cost        = Column(Float, default=0.0)
    final_price       = Column(Float, nullable=True)
    profit            = Column(Float, nullable=True)
    notes             = Column(Text, default="")
    created_at        = Column(DateTime, server_default=func.now())

    client       = relationship("User", back_populates="quotes")
    property     = relationship("Property", back_populates="quotes")
    service_type = relationship("ServiceType", back_populates="quotes")
    photos       = relationship("QuotePhoto", back_populates="quote", cascade="all, delete")
    appointment  = relationship("Appointment", back_populates="quote", uselist=False)


class QuotePhoto(Base):
    __tablename__ = "quote_photos"

    id         = Column(String, primary_key=True, default=gen_id)
    quote_id   = Column(String, ForeignKey("quotes.id"), nullable=False)
    photo_url  = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    quote = relationship("Quote", back_populates="photos")


class Appointment(Base):
    __tablename__ = "appointments"

    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    staff_id        = Column(String, ForeignKey("users.id"), nullable=True)
    property_id     = Column(String, ForeignKey("properties.id"), nullable=False)
    quote_id        = Column(String, ForeignKey("quotes.id"), nullable=True)
    service_type_id = Column(String, ForeignKey("service_types.id"), nullable=False)
    date            = Column(String, nullable=False)
    time            = Column(String, default="")
    status          = Column(String, default="pending")  # pending/confirmed/completed/cancelled
    paid            = Column(Boolean, default=False)
    notes           = Column(Text, default="")

    client       = relationship("User", foreign_keys=[user_id], back_populates="appointments")
    staff        = relationship("User", foreign_keys=[staff_id], back_populates="staff_appointments")
    property     = relationship("Property", back_populates="appointments")
    quote        = relationship("Quote", back_populates="appointment")
    service_type = relationship("ServiceType", back_populates="appointments")
    review       = relationship("Review", back_populates="appointment", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id             = Column(String, primary_key=True, default=gen_id)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False, unique=True)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False)
    rating         = Column(Integer, nullable=False)
    comment        = Column(Text, default="")
    created_at     = Column(DateTime, server_default=func.now())

    appointment = relationship("Appointment", back_populates="review")
    author      = relationship("User", back_populates="reviews")

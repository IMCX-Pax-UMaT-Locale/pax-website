"""
Pydantic module for handling events
"""
import re
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator, ConfigDict
from backend.core.constants import EventType

_EVENT_RE = re.compile(r"^[a-zA-Z\s\-']{2,100}$")
_PHONE_RE = re.compile(r"^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$")

class EventsBase(BaseModel):
    id: str
    title: str
    type: EventType = EventType.sunday_service
    description: str
    starts_at: datetime
    ends_at: datetime
    location: str
    contact_person: str

    @field_validator("event_name", "venue")
    @classmethod
    def validate(cls, v:str) -> str:
        v = v.strip()
        if not _EVENT_RE.match(v):
            raise ValueError("Must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes.")
        return v
    
    @field_validator("resource_person_phone")
    @classmethod
    def validate_phone(cls, v:str) -> str:
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone number format")
        return v

class EventCreate(EventsBase):
    pass

class EventUpdate(BaseModel):
    id: str
    event_name: str
    description: str
    event_type: EventType = EventType.sunday_service
    start_date: datetime
    end_date: datetime
    resource_person_phone: str
    venue: str

    @field_validator("event_name", "venue")
    @classmethod
    def validate(cls, v:str) -> str:
        v = v.strip()
        if not _EVENT_RE.match(v):
            raise ValueError("Must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes.")
        return v
    
    @field_validator("resource_person_phone")
    @classmethod
    def validate_phone(cls, v:str) -> str:
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone number format")
        return v
    
# What the API returns
class EventsList(EventsBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    is_active = bool
    created_at = datetime
    updated_at = datetime

# Paginated list of events
class EventListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[EventsList]

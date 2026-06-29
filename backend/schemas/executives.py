"""
This module creates schemas for executives
"""
import re
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

from pydantic import field_validator, BaseModel, ConfigDict, EmailStr
from backend.core.constants import ExecutiveType

_NAME_RE = re.compile(r"^[a-zA-Z\s\-']{2,100}$")
_PHONE_RE = re.compile(r"^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$")

class ExecutivesBase(BaseModel):
    name: str
    position: ExecutiveType = ExecutiveType
    email: EmailStr
    phone: str

    @field_validator("name")
    @classmethod()
    def validate(cls, v:str) -> str:
        v = v.strip()
        if not _NAME_RE.match(v):
            raise ValueError("Must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes.")
        return v
    
    @field_validator("phone")
    @classmethod()
    def validate_phone(cls, v:str)->str:
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone format")
        return v

# Respose from the API call
class ExecutivesList(ExecutivesBase):
    model_config = ConfigDict(from_attributes=True)
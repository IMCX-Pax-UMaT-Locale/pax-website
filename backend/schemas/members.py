"""
Pydantic schemas for Member request/response validation.
Separate from ORM models — never expose internal fields directly.
"""
import re
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator, ConfigDict

from backend.core.constants import GenderType, MembershipStatus

# ---------------------------------------------------------------------------
# Regex constants
# ---------------------------------------------------------------------------
_NAME_RE = re.compile(r"^[a-zA-Z\s\-']{2,100}$")
_PHONE_RE = re.compile(r"^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$")


# ---------------------------------------------------------------------------
# Shared base — fields common to create + update
# ---------------------------------------------------------------------------
class MemberBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderType] = None
    membership_status: MembershipStatus = MembershipStatus.visitor
    join_date: Optional[date] = None
    address: Optional[str] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not _NAME_RE.match(v):
            raise ValueError("Name must be 2–100 characters and contain only letters, spaces, hyphens, or apostrophes.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone number format.")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def dob_not_future(cls, v: Optional[date]) -> Optional[date]:
        if v and v > date.today():
            raise ValueError("Date of birth cannot be in the future.")
        return v

    @model_validator(mode="after")
    def join_date_after_dob(self) -> "MemberBase":
        if self.join_date and self.date_of_birth:
            if self.join_date < self.date_of_birth:
                raise ValueError("Join date cannot be before date of birth.")
        return self


# ---------------------------------------------------------------------------
# Create — all writable fields; password optional (portal access)
# ---------------------------------------------------------------------------
class MemberCreate(MemberBase):
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


# ---------------------------------------------------------------------------
# Update — all fields optional (PATCH semantics)
# ---------------------------------------------------------------------------
class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderType] = None
    membership_status: Optional[MembershipStatus] = None
    join_date: Optional[date] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not _NAME_RE.match(v):
            raise ValueError("Name must be 2–100 characters and contain only letters, spaces, hyphens, or apostrophes.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not _PHONE_RE.match(v):
            raise ValueError("Invalid phone number format.")
        return v


# ---------------------------------------------------------------------------
# Response — what the API returns; never exposes password hash
# ---------------------------------------------------------------------------
class MemberResponse(MemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------
class MemberListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[MemberResponse]
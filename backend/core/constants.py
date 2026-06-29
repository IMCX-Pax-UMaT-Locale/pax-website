import uuid
from datetime import date, datetime
from typing import Optional, List
 
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
import enum
 
 
# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------
 
class Base(DeclarativeBase):
    pass
 

 
def _uuid():
    return str(uuid.uuid4())
 
 
# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
 
class GenderType(str, enum.Enum):
    male = "male"
    female = "female"
    unspecified = "unspecified"
 
 
class MembershipStatus(str, enum.Enum):
    visitor = "visitor"
    member = "member"
    inactive = "inactive"
    transferred = "transferred"
    graduated = "graduated"

class ExecutiveType(str, enum.Enum):
    president = "president"
    vice_president = "vice_president"
    organizer = "organizer"
    vice_organizer = "vice organizer"
    secretary = "secretary"
    vice_secretary = "vice secretary"
    WOCOM = "WOCOM"
    catachist = "catachist"
    vice_catachist = "vice catachist"
    scc_rep = "scc_rep"
    choir_president = "choir president"
    outreach_coordinator = "outreach coordinator"
    servers_president = "Mass servers president"
    ccr_coordinator = "CCR coordinator"
 
 
class Departments(str, enum.Enum):
    heavenly_jewels = "heavenly_jewels"
    pax_choir = "pax_choir"
    mass_servers = "mass_servers"
    media = "media"
    aushers = "aushers"
    lectors = "lectors"
    ccr = "ccr"
 
 
class EventType(str, enum.Enum):
    sunday_service = "sunday_service"
    midweek = "midweek"
    special = "special"
    retreat = "retreat"
    outreach = "outreach"
 
 
class CheckInMethod(str, enum.Enum):
    manual = "manual"
    qr_code = "qr_code"
    self_checkin = "self_checkin"
 
 
class GivingType(str, enum.Enum):
    tithe = "tithe"
    offering = "offering"
    special = "special"
    building_fund = "building_fund"
    missions = "missions"
 
 
class PaymentMethod(str, enum.Enum):
    cash = "cash"
    mobile_money = "mobile_money"
    bank_transfer = "bank_transfer"
    cheque = "cheque"
 
 
class PrayerStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    answered = "answered"
 
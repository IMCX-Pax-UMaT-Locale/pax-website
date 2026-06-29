 
from backend.core.constants import *
from backend.core.constants import _uuid
from backend.models.members import Member

class Event(Base):
    __tablename__ = "events"
 
    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    title: str = Column(String(255), nullable=False)
    type: EventType = Column(Enum(EventType), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    starts_at: datetime = Column(DateTime(timezone=True), nullable=False)
    ends_at: Optional[datetime] = Column(DateTime(timezone=True), nullable=True)
    location: Optional[str] = Column(String(255), nullable=True)
    contact_person: Optional[str] = Column(String(20), nullable=True)
    created_by: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("members.id"), nullable=True)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
 
    # Relationships
    # creator: Optional[Member] = relationship("Member", foreign_keys=[created_by])
    # attendance_records: List["Attendance"] = relationship("Attendance", back_populates="event")
    # sermons: List["Sermon"] = relationship("Sermon", back_populates="event")
 
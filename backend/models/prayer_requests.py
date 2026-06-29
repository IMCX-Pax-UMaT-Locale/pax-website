from backend.core.constants import *
from backend.core.constants import _uuid
from .members import Member
class PrayerRequest(Base):
    __tablename__ = "prayer_requests"
 
    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    member_id: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("members.id"), nullable=True)
    request: str = Column(Text, nullable=False)
    is_anonymous: bool = Column(Boolean, nullable=False, default=False)
    status: PrayerStatus = Column(Enum(PrayerStatus), nullable=False, default=PrayerStatus.pending)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
 
    # Relationships
    member: Optional[Member] = relationship("Member", back_populates="prayer_requests")
 
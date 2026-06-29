from backend.core.constants import *
from backend.core.constants import _uuid
from backend.models.members import Member

class Logs(Base):
    __tablename__ = "logs"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    action: str = Column(String(255), nullable=False)
    user_id: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("members.id"), nullable=True)
    timestamp: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user: Optional["Member"] = relationship("Member", back_populates="logs")
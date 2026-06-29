from backend.core.constants import *
from backend.core.constants import _uuid
from .members import Member
from .executives import Executive
class Department(Base):
    __tablename__ = "departments"
 
    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: str = Column(String(100), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    head_id: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("executives.id"), nullable=True)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
 
    # Relationships
    head: Optional[Executive] = relationship("Executive", back_populates="department")
    members: List[Member] = relationship("Member", back_populates="department")
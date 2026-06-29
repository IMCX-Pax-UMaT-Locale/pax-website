from backend.core.constants import *
from backend.core.constants import _uuid
from backend.models.members import Member

class Executive(Base):
    __tablename__ = "executives"

    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: str = Column(String(100), nullable=False)
    position: str = Column(String(100), nullable=False)
    email: Optional[str] = Column(String(255), unique=True, nullable=True)
    phone: Optional[str] = Column(String(20), nullable=True)
    is_active: bool = Column(Boolean, nullable=False, default=True)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    member: Optional[Member] = relationship("Member", back_populates="executive")
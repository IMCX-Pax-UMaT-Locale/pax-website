from backend.core.constants import *
from backend.core.constants import _uuid
class TitheAndOffering(Base):
    __tablename__ = "tithes_and_offerings"
 
    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    member_id: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("members.id"), nullable=True)  # null = anonymous
    amount: float = Column(Numeric(12, 2), nullable=False)
    currency: str = Column(String(3), nullable=False, default="GHS")
    giving_type: GivingType = Column(Enum(GivingType), nullable=False)
    payment_method: PaymentMethod = Column(Enum(PaymentMethod), nullable=False)
    reference: Optional[str] = Column(String(255), nullable=True)
    given_at: datetime = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    recorded_by: Optional[str] = Column(UUID(as_uuid=False), ForeignKey("members.id"), nullable=True)
    notes: Optional[str] = Column(Text, nullable=True)
 
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_giving_amount_positive"),
    )
 
    # Relationships
    # member: Optional[Member] = relationship("Member", back_populates="giving_records", foreign_keys=[member_id])
    # recorder: Optional[Member] = relationship("Member", foreign_keys=[recorded_by])
 
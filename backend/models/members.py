from backend.core.constants import *
from backend.core.constants import Base, _uuid
class Member(Base):
    __tablename__ = "members"
 
    id: str = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email: Optional[str] = Column(String(255), unique=True, nullable=True)
    hashed_password: Optional[str] = Column(Text, nullable=True)
    first_name: str = Column(String(100), nullable=False)
    last_name: str = Column(String(100), nullable=False)
    phone: Optional[str] = Column(String(20), nullable=True)
    date_of_birth: Optional[date] = Column(Date, nullable=True)
    gender: Optional[GenderType] = Column(Enum(GenderType), nullable=True)
    membership_status: MembershipStatus = Column(
        Enum(MembershipStatus), nullable=False, default=MembershipStatus.visitor
    )
    join_date: Optional[date] = Column(Date, nullable=True)
    address: Optional[str] = Column(Text, nullable=True)
    is_active: bool = Column(Boolean, nullable=False, default=True)
    created_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: datetime = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
 
    # Relationships
    # family_memberships: List["FamilyMember"] = relationship("FamilyMember", back_populates="member")
    # group_memberships: List["GroupMember"] = relationship("GroupMember", back_populates="member")
    # attendance_records: List["Attendance"] = relationship("Attendance", back_populates="member", foreign_keys="Attendance.member_id")
    # giving_records: List["TitheAndOffering"] = relationship("TitheAndOffering", back_populates="member", foreign_keys="TitheAndOffering.member_id")
    # prayer_requests: List["PrayerRequest"] = relationship("PrayerRequest", back_populates="member")
    # sermons_preached: List["Sermon"] = relationship("Sermon", back_populates="speaker", foreign_keys="Sermon.speaker_id")
    # led_groups: List["Group"] = relationship("Group", back_populates="leader", foreign_keys="Group.leader_id")
    # headed_families: List["Family"] = relationship("Family", back_populates="head_of_family", foreign_keys="Family.head_of_family_id")
 
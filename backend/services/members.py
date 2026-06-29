"""
Repository layer for Member database operations.
All queries live here — routers never touch the session directly.
Uses SQLAlchemy 2.x async style.
"""
from typing import Optional
from uuid import UUID

from passlib.context import CryptContext
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.members import Member
from backend.schemas.members import MemberCreate, MemberUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class MemberRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    # -----------------------------------------------------------------------
    # Read
    # -----------------------------------------------------------------------

    async def get_by_id(self, member_id: UUID) -> Optional[Member]:
        result = await self.session.execute(
            select(Member).where(Member.id == str(member_id))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Member]:
        result = await self.session.execute(
            select(Member).where(Member.email == email)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
        membership_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Member], int]:
        query = select(Member)

        if is_active is not None:
            query = query.where(Member.is_active == is_active)
        if membership_status:
            query = query.where(Member.membership_status == membership_status)
        if search:
            term = f"%{search.lower()}%"
            query = query.where(
                func.lower(Member.first_name).like(term)
                | func.lower(Member.last_name).like(term)
                | func.lower(Member.email).like(term)
            )

        # Total count (same filters, no pagination)
        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        # Paginated results
        query = query.order_by(Member.last_name, Member.first_name)
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(query)
        return result.scalars().all(), total

    # -----------------------------------------------------------------------
    # Write
    # -----------------------------------------------------------------------

    async def create(self, data: MemberCreate) -> Member:
        hashed_password = (
            pwd_context.hash(data.password) if data.password else None
        )
        member = Member(
            **data.model_dump(exclude={"password"}),
            hashed_password=hashed_password,
        )
        self.session.add(member)
        await self.session.flush()   # get the generated ID before commit
        await self.session.refresh(member)
        return member

    async def update(self, member: Member, data: MemberUpdate) -> Member:
        updates = data.model_dump(exclude_none=True)
        for field, value in updates.items():
            setattr(member, field, value)
        await self.session.flush()
        await self.session.refresh(member)
        return member

    async def soft_delete(self, member: Member) -> None:
        """Marks as inactive — preserves giving/attendance history."""
        member.is_active = False
        await self.session.flush()

    async def hard_delete(self, member: Member) -> None:
        """Permanent removal — only for data-erasure / GDPR requests."""
        await self.session.delete(member)
        await self.session.flush()
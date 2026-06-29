from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_session
from backend.core.constants import MembershipStatus
from backend.services.members import MemberRepository
from backend.schemas.members import (
    MemberCreate,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
)

router = APIRouter(prefix="/members", tags=["Members"])


# ---------------------------------------------------------------------------
# Dependency — builds a repository scoped to the current request session
# ---------------------------------------------------------------------------
def get_repo(session: AsyncSession = Depends(get_session)) -> MemberRepository:
    return MemberRepository(session)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new member",
)
async def create_member(
    body: MemberCreate,
    repo: MemberRepository = Depends(get_repo),
):
    if body.email:
        existing = await repo.get_by_email(body.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A member with email '{body.email}' already exists.",
            )
    member = await repo.create(body)
    return member


@router.get(
    "",
    response_model=MemberListResponse,
    summary="List members with optional filtering and pagination",
)
async def list_members(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page"),
    is_active: Optional[bool] = Query(default=None),
    membership_status: Optional[MembershipStatus] = Query(default=None),
    search: Optional[str] = Query(default=None, max_length=100, description="Search by name or email"),
    repo: MemberRepository = Depends(get_repo),
):
    members, total = await repo.list(
        page=page,
        page_size=page_size,
        is_active=is_active,
        membership_status=membership_status.value if membership_status else None,
        search=search,
    )
    return MemberListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=members,
    )


@router.get(
    "/{member_id}",
    response_model=MemberResponse,
    summary="Get a single member by ID",
)
async def get_member(
    member_id: UUID,
    repo: MemberRepository = Depends(get_repo),
):
    member = await repo.get_by_id(member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    return member


@router.patch(
    "/{member_id}",
    response_model=MemberResponse,
    summary="Partially update a member record",
)
async def update_member(
    member_id: UUID,
    body: MemberUpdate,
    repo: MemberRepository = Depends(get_repo),
):
    member = await repo.get_by_id(member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")

    # Guard against taking an email that belongs to someone else
    if body.email:
        conflict = await repo.get_by_email(body.email)
        if conflict and str(conflict.id) != str(member_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{body.email}' is already in use.",
            )

    updated = await repo.update(member, body)
    return updated


@router.delete(
    "/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a member (soft delete)",
)
async def deactivate_member(
    member_id: UUID,
    repo: MemberRepository = Depends(get_repo),
):
    """
    Marks the member inactive. Giving records, attendance, and prayer
    requests are preserved. Use the hard-delete endpoint for GDPR erasure.
    """
    member = await repo.get_by_id(member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    await repo.soft_delete(member)


@router.delete(
    "/{member_id}/hard",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a member record (admin only)",
    include_in_schema=True,  # set False to hide from public docs
)
async def hard_delete_member(
    member_id: UUID,
    repo: MemberRepository = Depends(get_repo),
    # TODO: add  `current_user: Member = Depends(require_role("admin"))`
    #       once auth is wired up.
):
    """
    Permanent removal. Restricted to admins.
    Cascades will remove attendance and prayer records per FK constraints.
    Giving records are protected by ON DELETE RESTRICT — transfer them first.
    """
    member = await repo.get_by_id(member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")
    await repo.hard_delete(member)
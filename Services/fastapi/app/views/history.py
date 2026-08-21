from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.database import SessionDep
from app.models import QueryHistory
from app.services.history import ENTITY_TYPES, serialize_history_entry


router = APIRouter(tags=["history"])


@router.get("/history/{entity_type}/{entity_id}/")
async def get_entity_history(
    session: SessionDep,
    request: Request,
    entity_type: str,
    entity_id: int,
    limit: int = Query(100, ge=1, le=500),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    if entity_type not in ENTITY_TYPES:
        return {"ok": False, "error": "Unsupported history entity type."}

    entity_filter = (
        (QueryHistory.entity_type == entity_type)
        & (QueryHistory.entity_id == entity_id)
    )
    if entity_type == "task":
        entity_filter = entity_filter | (QueryHistory.task_id == entity_id)

    statement = (
        select(QueryHistory)
        .options(selectinload(QueryHistory.user))
        .where(entity_filter)
        .order_by(QueryHistory.created_at.desc(), QueryHistory.id.desc())
        .limit(limit)
    )
    history = (await session.exec(statement)).all()
    return {"ok": True, "data": [serialize_history_entry(item) for item in history]}

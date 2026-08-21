from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.enums.action_type import ActionType
from app.models import Protocol, Stage
from app.request_body import ProtocolCreate, ProtocolUpdate, StageCreate
from app.services.history import add_history, snapshot

router = APIRouter(tags=["protocol"])

PROTOCOL_HISTORY_FIELDS = ["name", "code", "description", "version"]
STAGE_HISTORY_FIELDS = ["name", "description", "order"]


@router.get("/protocols/")
async def get_protocols(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Загружаем stages и created_by сразу
    statement = select(Protocol).options(
        selectinload(Protocol.stages), selectinload(Protocol.created_by)
    )
    total = (await session.exec(select(func.count()).select_from(Protocol))).one()
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    protocols = (await session.exec(statement)).all()

    result = []
    for p in protocols:
        result.append(
            {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "description": p.description,
                "version": p.version,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "created_by": {
                    "id": p.created_by.id,
                    "username": p.created_by.username,
                    "first_name": p.created_by.first_name,
                    "last_name": p.created_by.last_name,
                }
                if p.created_by
                else None,
                "stages": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "description": s.description,
                        "order": s.order,
                    }
                    for s in p.stages
                ],
            }
        )
    return {
        "ok": True,
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/protocol/{protocol_id}/")
async def get_protocol(session: SessionDep, request: Request, protocol_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Not found protocol."}

    return {"ok": True, "data": protocol}


@router.post("/protocol/")
async def create_protocol(
    session: SessionDep, request: Request, protocol_data: ProtocolCreate
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocol = Protocol(
        name=protocol_data.name,
        code=protocol_data.code,
        description=protocol_data.description,
        version=protocol_data.version,
        created_by_id=request.state.user.id,
    )

    session.add(protocol)
    await session.commit()
    await session.refresh(protocol)

    await add_history(
        session,
        entity_type="protocol",
        entity_id=protocol.id,
        user_id=request.state.user.id,
        action_type=ActionType.CREATED,
        new_value=snapshot(protocol, PROTOCOL_HISTORY_FIELDS),
        comment=f"Протокол '{protocol.name}' создан",
    )
    await session.commit()

    return {"ok": True, "data": protocol}


@router.put("/protocol/{protocol_id}/")
async def update_protocol(
    session: SessionDep,
    request: Request,
    protocol_id: int,
    protocol_data: ProtocolUpdate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Not found protocol."}

    update_data = protocol_data.model_dump(exclude_unset=True)
    changes = []
    for field, value in update_data.items():
        old_value = getattr(protocol, field)
        if old_value == value:
            continue
        changes.append((field, old_value, value))
        setattr(protocol, field, value)

    if changes:
        protocol.updated_at = datetime.now()
    session.add(protocol)
    await session.commit()
    await session.refresh(protocol)

    for field, old_value, new_value in changes:
        await add_history(
            session,
            entity_type="protocol",
            entity_id=protocol.id,
            user_id=request.state.user.id,
            field_name=field,
            old_value={field: old_value},
            new_value={field: new_value},
            comment=f"Изменено поле протокола: {field}",
        )
    if changes:
        await session.commit()

    return {"ok": True, "data": protocol}


@router.delete("/protocol/{protocol_id}/")
async def delete_protocol(session: SessionDep, request: Request, protocol_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Not found protocol."}

    await add_history(
        session,
        entity_type="protocol",
        entity_id=protocol.id,
        user_id=request.state.user.id,
        action_type=ActionType.DELETED,
        old_value=snapshot(protocol, PROTOCOL_HISTORY_FIELDS),
        comment=f"Протокол '{protocol.name}' удалён",
    )
    await session.delete(protocol)
    await session.commit()
    return {"ok": True}


# Новые эндпоинты для этапов:
@router.get("/protocol/{protocol_id}/stages/")
async def get_protocol_stages(session: SessionDep, request: Request, protocol_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}
    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Protocol not found."}
    stages = await session.exec(
        select(Stage).where(Stage.protocol_id == protocol_id).order_by(Stage.order)
    )
    return {"ok": True, "data": [s.dict() for s in stages]}


@router.post("/protocol/{protocol_id}/stage/")
async def create_protocol_stage(
    session: SessionDep,
    request: Request,
    protocol_id: int,
    stage_data: StageCreate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}
    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Protocol not found."}
    stage = Stage(
        name=stage_data.name,
        description=stage_data.description or "",
        order=stage_data.order or 0,
        protocol_id=protocol_id,
    )
    session.add(stage)
    await session.commit()
    await session.refresh(stage)
    await add_history(
        session,
        entity_type="stage",
        entity_id=stage.id,
        user_id=request.state.user.id,
        action_type=ActionType.CREATED,
        new_value=snapshot(stage, STAGE_HISTORY_FIELDS),
        comment=f"Этап '{stage.name}' создан",
    )
    await add_history(
        session,
        entity_type="protocol",
        entity_id=protocol_id,
        user_id=request.state.user.id,
        field_name="stages",
        new_value={"stage_id": stage.id},
        comment=f"Этап #{stage.id} добавлен в протокол",
    )
    await session.commit()
    return {"ok": True, "data": stage.dict()}

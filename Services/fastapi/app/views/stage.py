from datetime import datetime

from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.enums.action_type import ActionType
from app.models import Protocol, Stage
from app.request_body import StageCreate, StageUpdate
from app.services.history import add_history, snapshot

router = APIRouter(tags=["stage"])

STAGE_HISTORY_FIELDS = ["name", "description", "order", "is_completed"]


@router.get("/stages/")
async def get_stages(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    stages = (await session.exec(select(Stage))).all()
    return {"ok": True, "data": stages}


@router.get("/stage/{stage_id}/")
async def get_stage(session: SessionDep, request: Request, stage_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    stage = await session.get(Stage, stage_id)
    if not stage:
        return {"ok": False, "error": "Not found stage."}

    return {"ok": True, "data": stage}


@router.post("/stage/")
async def create_stage(session: SessionDep, request: Request, stage_data: StageCreate):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    if not stage_data.protocol_id:
        return {"ok": False, "error": "protocol_id is required."}

    protocol = await session.get(Protocol, stage_data.protocol_id)
    if not protocol:
        return {"ok": False, "error": "Protocol not found."}

    stage = Stage(
        name=stage_data.name,
        description=stage_data.description,
        order=stage_data.order,
        protocol_id=stage_data.protocol_id,
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
    await session.commit()

    return {"ok": True, "data": stage}


@router.put("/stage/{stage_id}/")
async def update_stage(
    session: SessionDep, request: Request, stage_id: int, stage_data: StageUpdate
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    stage = await session.get(Stage, stage_id)
    if not stage:
        return {"ok": False, "error": "Not found stage."}

    update_data = stage_data.model_dump(exclude_unset=True)
    changes = []
    for field, value in update_data.items():
        old_value = getattr(stage, field)
        if old_value == value:
            continue
        changes.append((field, old_value, value))
        setattr(stage, field, value)

    if changes:
        stage.updated_at = datetime.now()
    session.add(stage)
    await session.commit()
    await session.refresh(stage)

    for field, old_value, new_value in changes:
        await add_history(
            session,
            entity_type="stage",
            entity_id=stage.id,
            user_id=request.state.user.id,
            field_name=field,
            old_value={field: old_value},
            new_value={field: new_value},
            comment=f"Изменено поле этапа: {field}",
        )
    if changes:
        await session.commit()

    return {"ok": True, "data": stage}


@router.delete("/stage/{stage_id}/")
async def delete_stage(session: SessionDep, request: Request, stage_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    stage = await session.get(Stage, stage_id)
    if not stage:
        return {"ok": False, "error": "Not found stage."}

    await add_history(
        session,
        entity_type="stage",
        entity_id=stage.id,
        user_id=request.state.user.id,
        action_type=ActionType.DELETED,
        old_value=snapshot(stage, STAGE_HISTORY_FIELDS),
        comment=f"Этап '{stage.name}' удалён",
    )
    await session.delete(stage)
    await session.commit()
    return {"ok": True}

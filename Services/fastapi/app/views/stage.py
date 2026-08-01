from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import Stage
from app.request_body import StageCreate, StageUpdate

router = APIRouter(tags=["stage"])


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

    stage = Stage(
        name=stage_data.name,
        description=stage_data.description,
        order=stage_data.order,
    )
    session.add(stage)
    await session.commit()
    await session.refresh(stage)

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
    for field, value in update_data.items():
        setattr(stage, field, value)

    session.add(stage)
    await session.commit()
    await session.refresh(stage)

    return {"ok": True, "data": stage}


@router.delete("/stage/{stage_id}/")
async def delete_stage(session: SessionDep, request: Request, stage_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    stage = await session.get(Stage, stage_id)
    if not stage:
        return {"ok": False, "error": "Not found stage."}

    await session.delete(stage)
    await session.commit()
    return {"ok": True}

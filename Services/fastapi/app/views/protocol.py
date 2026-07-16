from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import Protocol
from app.request_body import ProtocolCreate, ProtocolUpdate

router = APIRouter(tags=["protocol"])


@router.get("/protocols/")
async def get_protocols(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocols = (await session.exec(select(Protocol))).all()
    return {"ok": True, "data": protocols}


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
    for field, value in update_data.items():
        setattr(protocol, field, value)

    session.add(protocol)
    await session.commit()
    await session.refresh(protocol)

    return {"ok": True, "data": protocol}


@router.delete("/protocol/{protocol_id}/")
async def delete_protocol(session: SessionDep, request: Request, protocol_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    protocol = await session.get(Protocol, protocol_id)
    if not protocol:
        return {"ok": False, "error": "Not found protocol."}

    await session.delete(protocol)
    await session.commit()
    return {"ok": True}

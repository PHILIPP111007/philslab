from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.database import SessionDep
from app.models import Protocol
from app.request_body import ProtocolCreate, ProtocolUpdate

router = APIRouter(tags=["protocol"])


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
    return {"ok": True, "data": result}


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

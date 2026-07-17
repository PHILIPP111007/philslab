# views/batch.py

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Batch, BatchSubsampleLink, Subsample
from app.request_body import BatchCreate, BatchUpdate

router = APIRouter(tags=["batch"])


@router.get("/batches/")
async def get_batches(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = select(Batch).options(selectinload(Batch.subsamples))

    if search:
        statement = statement.where(
            (Batch.name.contains(search))
            | (Batch.department.contains(search))
            | (Batch.descr.contains(search))
        )

    statement = statement.order_by(Batch.timestamp.desc())

    offset = (page - 1) * page_size
    total = (
        await session.exec(select(func.count()).select_from(statement.subquery()))
    ).one()
    statement = statement.offset(offset).limit(page_size)
    batches = (await session.exec(statement)).all()

    return {
        "ok": True,
        "data": batches,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/batch/{batch_id}/")
async def get_batch(session: SessionDep, request: Request, batch_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(
        Batch,
        batch_id,
        options=[selectinload(Batch.subsamples)],
    )
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    return {"ok": True, "data": batch}


@router.post("/batch/")
async def create_batch(session: SessionDep, request: Request, batch_data: BatchCreate):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = Batch(
        name=batch_data.name,
        department=batch_data.department or "",
        descr=batch_data.descr or "",
        user_id=request.state.user.id,
    )

    session.add(batch)
    await session.commit()
    await session.refresh(batch)

    return {"ok": True, "data": batch}


@router.put("/batch/{batch_id}/")
async def put_batch(
    session: SessionDep,
    request: Request,
    batch_id: int,
    batch_data: BatchUpdate,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    update_data = batch_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(batch, field, value)

    batch.updated_at = datetime.now()
    session.add(batch)
    await session.commit()
    await session.refresh(batch)

    return {"ok": True, "data": batch}


@router.delete("/batch/{batch_id}/")
async def delete_batch(session: SessionDep, request: Request, batch_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    await session.delete(batch)
    await session.commit()
    return {"ok": True}


# ============================================
# РАБОТА С ПОДОБРАЗЦАМИ В БАТЧЕ
# ============================================


@router.post("/batch/{batch_id}/subsample/{subsample_id}/")
async def add_subsample_to_batch(
    session: SessionDep,
    request: Request,
    batch_id: int,
    subsample_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    subsample = await session.get(Subsample, subsample_id)
    if not subsample:
        return {"ok": False, "error": "Subsample not found."}

    # Проверяем, не добавлен ли уже
    existing = await session.exec(
        select(BatchSubsampleLink).where(
            BatchSubsampleLink.batch_id == batch_id,
            BatchSubsampleLink.subsample_id == subsample_id,
        )
    )
    if existing.first():
        return {"ok": False, "error": "Subsample already in batch."}

    link = BatchSubsampleLink(
        batch_id=batch_id,
        subsample_id=subsample_id,
    )
    session.add(link)
    await session.commit()

    return {"ok": True, "data": {"batch_id": batch_id, "subsample_id": subsample_id}}


@router.delete("/batch/{batch_id}/subsample/{subsample_id}/")
async def remove_subsample_from_batch(
    session: SessionDep,
    request: Request,
    batch_id: int,
    subsample_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    link = await session.exec(
        select(BatchSubsampleLink).where(
            BatchSubsampleLink.batch_id == batch_id,
            BatchSubsampleLink.subsample_id == subsample_id,
        )
    )
    item = link.first()
    if not item:
        return {"ok": False, "error": "Subsample not found in batch."}

    await session.delete(item)
    await session.commit()
    return {"ok": True}


@router.get("/batch/{batch_id}/subsamples/")
async def get_batch_subsamples(
    session: SessionDep,
    request: Request,
    batch_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    # Получаем подобразцы через связь
    subsamples = await session.exec(
        select(Subsample)
        .join(BatchSubsampleLink)
        .where(BatchSubsampleLink.batch_id == batch_id)
    )
    return {"ok": True, "data": subsamples.all()}

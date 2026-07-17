# views/batch.py

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Batch, BatchSubsampleLink, Subsample
from app.request_body import BatchCreate, BatchUpdate

router = APIRouter(tags=["batch"])


def serialize_batch(batch: Batch) -> dict:
    """Сериализует батч с подсчётом подобразцов."""
    return {
        "id": batch.id,
        "name": batch.name,
        "department": batch.department,
        "descr": batch.descr,
        "timestamp": batch.timestamp.isoformat() if batch.timestamp else None,
        "updated_at": batch.updated_at.isoformat() if batch.updated_at else None,
        "user_id": batch.user_id,
        "subsample_count": len(batch.subsamples) if batch.subsamples else 0,
        "subsamples": [
            {
                "id": s.id,
                "sample_code": s.sample_code,
                "name": s.name,
            }
            for s in batch.subsamples
        ]
        if batch.subsamples
        else [],
    }


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

    # ✅ Загружаем subsamples для подсчёта
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

    # ✅ Сериализуем с subsample_count
    result = [serialize_batch(b) for b in batches]

    return {
        "ok": True,
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/batch/{batch_id}/")
async def get_batch(
    session: SessionDep,
    request: Request,
    batch_id: int,
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(
        Batch,
        batch_id,
        options=[selectinload(Batch.subsamples)],
    )
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    return {"ok": True, "data": serialize_batch(batch)}


@router.post("/batch/")
async def create_batch(
    session: SessionDep,
    request: Request,
    batch_data: BatchCreate,
):
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

    # ✅ После создания подгружаем subsamples (их пока нет)
    batch_with_subsamples = await session.get(
        Batch,
        batch.id,
        options=[selectinload(Batch.subsamples)],
    )

    return {"ok": True, "data": serialize_batch(batch_with_subsamples)}


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

    # ✅ После обновления подгружаем subsamples для подсчёта
    batch_with_subsamples = await session.get(
        Batch,
        batch.id,
        options=[selectinload(Batch.subsamples)],
    )

    return {"ok": True, "data": serialize_batch(batch_with_subsamples)}


@router.delete("/batch/{batch_id}/")
async def delete_batch(
    session: SessionDep,
    request: Request,
    batch_id: int,
):
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

    # Получаем батч с подобразцами
    batch = await session.get(Batch, batch_id, options=[selectinload(Batch.subsamples)])
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    subsample = await session.get(Subsample, subsample_id)
    if not subsample:
        return {"ok": False, "error": "Subsample not found."}

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

    # ✅ Вместо refresh делаем новый запрос с загрузкой всех нужных связей
    batch_with_subs = await session.get(
        Batch,
        batch_id,
        options=[selectinload(Batch.subsamples)],
    )

    return {"ok": True, "data": serialize_batch(batch_with_subs)}


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

    # Сохраняем batch_id до удаления
    saved_batch_id = item.batch_id

    await session.delete(item)
    await session.commit()

    # ✅ Получаем свежий объект batch с подобразцами
    batch = await session.get(
        Batch,
        saved_batch_id,
        options=[selectinload(Batch.subsamples)],
    )
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    return {"ok": True, "data": serialize_batch(batch)}


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

    subsamples = await session.exec(
        select(Subsample)
        .join(BatchSubsampleLink)
        .where(BatchSubsampleLink.batch_id == batch_id)
    )
    return {"ok": True, "data": subsamples.all()}

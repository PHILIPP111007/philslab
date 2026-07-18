# views/batch.py

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlmodel import func, select

from app.database import SessionDep
from app.models import Batch, BatchSubsampleLink, Subsample, Task, TaskBatchLink
from app.request_body import BatchCreate, BatchUpdate

router = APIRouter(tags=["batch"])


# ------------------------------------------------------------
# Безопасная сериализация – связи передаются явно
# ------------------------------------------------------------
def serialize_batch(batch: Batch, subsamples: list = None, tasks: list = None) -> dict:
    subs = subsamples if subsamples is not None else []
    tsk = tasks if tasks is not None else []

    return {
        "id": batch.id,
        "name": batch.name,
        "department": batch.department,
        "descr": batch.descr,
        "timestamp": batch.timestamp.isoformat() if batch.timestamp else None,
        "updated_at": batch.updated_at.isoformat() if batch.updated_at else None,
        "user_id": batch.user_id,
        "subsample_count": len(subs),
        "subsamples": [
            {
                "id": s.id,
                "sample_code": s.sample_code,
                "name": s.name,
                "some_number": s.some_number,
                "qc_1": s.qc_1,
                "qc_2": s.qc_2,
                "descr": s.descr,
                "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            }
            for s in subs
        ],
        "tasks": [
            {
                "id": t.id,
                "name": t.name,
                "is_completed": t.is_completed,
                "priority": t.priority,
                "department": t.department,
            }
            for t in tsk
        ],
    }


# ------------------------------------------------------------
# Явная загрузка связей (не зависит от состояния объекта Batch)
# ------------------------------------------------------------
async def _load_batch_relations(session, batch_id):
    """Загружает subsamples и tasks для заданного batch_id."""
    subsamples = (
        await session.exec(
            select(Subsample)
            .join(BatchSubsampleLink)
            .where(BatchSubsampleLink.batch_id == batch_id)
        )
    ).all()

    tasks = (
        await session.exec(
            select(Task).join(TaskBatchLink).where(TaskBatchLink.batch_id == batch_id)
        )
    ).all()

    return subsamples, tasks


# ============================================================
# Эндпоинты
# ============================================================


@router.get("/batches/")
async def get_batches(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    search: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Для списка без коммита можно использовать selectinload
    from sqlalchemy.orm import selectinload

    statement = select(Batch).options(
        selectinload(Batch.subsamples), selectinload(Batch.tasks)
    )

    if search:
        statement = statement.where(
            (Batch.name.contains(search))
            | (Batch.department.contains(search))
            | (Batch.descr.contains(search))
        )

    if sort_by and hasattr(Batch, sort_by):
        column = getattr(Batch, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )
    else:
        statement = statement.order_by(Batch.timestamp.desc())

    count_stmt = select(func.count()).select_from(statement.subquery())
    total = (await session.exec(count_stmt)).one()

    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    batches = (await session.exec(statement)).all()

    result = [
        serialize_batch(b, subsamples=b.subsamples, tasks=b.tasks) for b in batches
    ]
    return {
        "ok": True,
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/batch/{batch_id}/")
async def get_batch(session: SessionDep, request: Request, batch_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    from sqlalchemy.orm import selectinload

    batch = await session.get(
        Batch,
        batch_id,
        options=[selectinload(Batch.subsamples), selectinload(Batch.tasks)],
    )
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    return {
        "ok": True,
        "data": serialize_batch(batch, subsamples=batch.subsamples, tasks=batch.tasks),
    }


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

    # Загружаем свежий объект без связей и отдельно связи
    batch_obj = await session.get(Batch, batch.id)
    subs, tsk = await _load_batch_relations(session, batch.id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}


@router.put("/batch/{batch_id}/")
async def put_batch(
    session: SessionDep, request: Request, batch_id: int, batch_data: BatchUpdate
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

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}


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


# --- Управление подобразцами ---


@router.post("/batch/{batch_id}/subsample/{subsample_id}/")
async def add_subsample_to_batch(
    session: SessionDep, request: Request, batch_id: int, subsample_id: int
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    subsample = await session.get(Subsample, subsample_id)
    if not batch or not subsample:
        return {"ok": False, "error": "Batch or subsample not found."}

    existing = await session.exec(
        select(BatchSubsampleLink).where(
            BatchSubsampleLink.batch_id == batch_id,
            BatchSubsampleLink.subsample_id == subsample_id,
        )
    )
    if existing.first():
        return {"ok": False, "error": "Subsample already in batch."}

    link = BatchSubsampleLink(batch_id=batch_id, subsample_id=subsample_id)
    session.add(link)
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}


@router.delete("/batch/{batch_id}/subsample/{subsample_id}/")
async def remove_subsample_from_batch(
    session: SessionDep, request: Request, batch_id: int, subsample_id: int
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

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}


@router.get("/batch/{batch_id}/subsamples/")
async def get_batch_subsamples(session: SessionDep, request: Request, batch_id: int):
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


# --- Управление задачами ---


@router.post("/batch/{batch_id}/task/{task_id}/")
async def add_task_to_batch(
    session: SessionDep, request: Request, batch_id: int, task_id: int
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    task = await session.get(Task, task_id)
    if not batch or not task:
        return {"ok": False, "error": "Batch or task not found."}

    existing = await session.exec(
        select(TaskBatchLink).where(
            TaskBatchLink.batch_id == batch_id,
            TaskBatchLink.task_id == task_id,
        )
    )
    if existing.first():
        return {"ok": False, "error": "Task already in batch."}

    link = TaskBatchLink(batch_id=batch_id, task_id=task_id)
    session.add(link)
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}


@router.delete("/batch/{batch_id}/task/{task_id}/")
async def remove_task_from_batch(
    session: SessionDep, request: Request, batch_id: int, task_id: int
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    link = await session.exec(
        select(TaskBatchLink).where(
            TaskBatchLink.batch_id == batch_id,
            TaskBatchLink.task_id == task_id,
        )
    )
    item = link.first()
    if not item:
        return {"ok": False, "error": "Task not found in batch."}

    await session.delete(item)
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, subsamples=subs, tasks=tsk)}

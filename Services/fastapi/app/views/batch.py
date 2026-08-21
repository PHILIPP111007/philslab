# views/batch.py

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.enums.action_type import ActionType
from app.models import Batch, BatchSampleLink, Sample, Task, TaskBatchLink
from app.request_body import BatchCreate, BatchUpdate
from app.services.history import add_history, snapshot
from app.services.serializers import serialize_batch

router = APIRouter(tags=["batch"])

BATCH_HISTORY_FIELDS = ["name", "department", "descr"]


# ------------------------------------------------------------
# Явная загрузка связей (не зависит от состояния объекта Batch)
# ------------------------------------------------------------
async def _load_batch_relations(session, batch_id):
    """Загружает samples и tasks для заданного batch_id."""
    samples = (
        await session.exec(
            select(Sample)
            .join(BatchSampleLink)
            .where(BatchSampleLink.batch_id == batch_id)
        )
    ).all()

    tasks = (
        await session.exec(
            select(Task).join(TaskBatchLink).where(TaskBatchLink.batch_id == batch_id)
        )
    ).all()

    return samples, tasks


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

    statement = select(Batch).options(
        selectinload(Batch.samples), selectinload(Batch.tasks)
    )

    #  ---------- ПРИМЕНЯЕМ ФИЛЬТРЫ ----------
    for key, value in request.query_params.items():
        if key.startswith("filter[") and key.endswith("]"):
            field = key[7:-1]  # извлекаем имя поля
            if hasattr(Batch, field):
                column = getattr(Batch, field)
                statement = statement.where(column == value)

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

    result = [serialize_batch(b, samples=b.samples, tasks=b.tasks) for b in batches]
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

    batch = await session.get(
        Batch,
        batch_id,
        options=[selectinload(Batch.samples), selectinload(Batch.tasks)],
    )
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    return {
        "ok": True,
        "data": serialize_batch(batch, samples=batch.samples, tasks=batch.tasks),
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

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch.id,
        user_id=request.state.user.id,
        action_type=ActionType.CREATED,
        new_value=snapshot(batch, BATCH_HISTORY_FIELDS),
        comment=f"Батч #{batch.id} создан",
    )
    await session.commit()

    # Загружаем свежий объект без связей и отдельно связи
    batch_obj = await session.get(Batch, batch.id)
    subs, tsk = await _load_batch_relations(session, batch.id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}


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
    changes = []
    for field, value in update_data.items():
        old_value = getattr(batch, field)
        if old_value == value:
            continue
        changes.append((field, old_value, value))
        setattr(batch, field, value)

    if changes:
        batch.updated_at = datetime.now()
    session.add(batch)
    await session.commit()

    for field, old_value, new_value in changes:
        await add_history(
            session,
            entity_type="batch",
            entity_id=batch.id,
            user_id=request.state.user.id,
            field_name=field,
            old_value={field: old_value},
            new_value={field: new_value},
            comment=f"Изменено поле батча: {field}",
        )
    if changes:
        await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}


@router.delete("/batch/{batch_id}/")
async def delete_batch(session: SessionDep, request: Request, batch_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch.id,
        user_id=request.state.user.id,
        action_type=ActionType.DELETED,
        old_value=snapshot(batch, BATCH_HISTORY_FIELDS),
        comment=f"Батч #{batch.id} удалён",
    )
    await session.delete(batch)
    await session.commit()
    return {"ok": True}


# --- Управление подобразцами ---


@router.post("/batch/{batch_id}/sample/{sample_id}/")
async def add_sample_to_batch(
    session: SessionDep, request: Request, batch_id: int, sample_id: int
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    sample = await session.get(Sample, sample_id)
    if not batch or not sample:
        return {"ok": False, "error": "Batch or sample not found."}

    existing = await session.exec(
        select(BatchSampleLink).where(
            BatchSampleLink.batch_id == batch_id,
            BatchSampleLink.sample_id == sample_id,
        )
    )
    if existing.first():
        return {"ok": False, "error": "Sample already in batch."}

    link = BatchSampleLink(batch_id=batch_id, sample_id=sample_id)
    session.add(link)
    batch.updated_at = datetime.now()
    await session.commit()

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch_id,
        user_id=request.state.user.id,
        action_type=ActionType.SAMPLE_ADDED,
        field_name="samples",
        new_value={"sample_id": sample_id},
        comment=f"Образец #{sample_id} добавлен в батч",
    )
    await add_history(
        session,
        entity_type="sample",
        entity_id=sample_id,
        user_id=request.state.user.id,
        action_type=ActionType.SAMPLE_ADDED,
        field_name="batches",
        new_value={"batch_id": batch_id},
        comment=f"Образец добавлен в батч #{batch_id}",
    )
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}


@router.delete("/batch/{batch_id}/sample/{sample_id}/")
async def remove_sample_from_batch(
    session: SessionDep, request: Request, batch_id: int, sample_id: int
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    link = await session.exec(
        select(BatchSampleLink).where(
            BatchSampleLink.batch_id == batch_id,
            BatchSampleLink.sample_id == sample_id,
        )
    )
    item = link.first()
    if not item:
        return {"ok": False, "error": "Sample not found in batch."}

    await session.delete(item)
    batch = await session.get(Batch, batch_id)
    if batch:
        batch.updated_at = datetime.now()
    await session.commit()

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch_id,
        user_id=request.state.user.id,
        action_type=ActionType.SAMPLE_REMOVED,
        field_name="samples",
        old_value={"sample_id": sample_id},
        comment=f"Образец #{sample_id} удалён из батча",
    )
    await add_history(
        session,
        entity_type="sample",
        entity_id=sample_id,
        user_id=request.state.user.id,
        action_type=ActionType.SAMPLE_REMOVED,
        field_name="batches",
        old_value={"batch_id": batch_id},
        comment=f"Образец удалён из батча #{batch_id}",
    )
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}


@router.get("/batch/{batch_id}/samples/")
async def get_batch_samples(session: SessionDep, request: Request, batch_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    batch = await session.get(Batch, batch_id)
    if not batch:
        return {"ok": False, "error": "Batch not found."}

    samples = await session.exec(
        select(Sample).join(BatchSampleLink).where(BatchSampleLink.batch_id == batch_id)
    )
    return {"ok": True, "data": samples.all()}


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
    batch.updated_at = datetime.now()
    await session.commit()

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch_id,
        user_id=request.state.user.id,
        field_name="tasks",
        new_value={"task_id": task_id},
        comment=f"Задача #{task_id} добавлена в батч",
    )
    await add_history(
        session,
        entity_type="task",
        entity_id=task_id,
        user_id=request.state.user.id,
        field_name="batches",
        new_value={"batch_id": batch_id},
        comment=f"Задача добавлена в батч #{batch_id}",
        task_id=task_id,
    )
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}


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
    batch = await session.get(Batch, batch_id)
    if batch:
        batch.updated_at = datetime.now()
    await session.commit()

    await add_history(
        session,
        entity_type="batch",
        entity_id=batch_id,
        user_id=request.state.user.id,
        field_name="tasks",
        old_value={"task_id": task_id},
        comment=f"Задача #{task_id} удалена из батча",
    )
    await add_history(
        session,
        entity_type="task",
        entity_id=task_id,
        user_id=request.state.user.id,
        field_name="batches",
        old_value={"batch_id": batch_id},
        comment=f"Задача удалена из батча #{batch_id}",
        task_id=task_id,
    )
    await session.commit()

    batch_obj = await session.get(Batch, batch_id)
    subs, tsk = await _load_batch_relations(session, batch_id)
    return {"ok": True, "data": serialize_batch(batch_obj, samples=subs, tasks=tsk)}

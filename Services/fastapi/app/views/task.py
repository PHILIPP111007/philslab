# views/task.py
from datetime import datetime, timedelta

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.enums.action_type import ActionType
from app.models import (
    Batch,
    Protocol,
    QueryHistory,
    Task,
    TaskStage,
)
from app.request_body import TaskCreate, TaskUpdate
from app.services.serializers import serialize_task

router = APIRouter(tags=["task"])


# ============================================
# ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
# ============================================
def _format_change_comment(field: str, old_value, new_value) -> str:
    comments = {
        "name": f"Название изменено с '{old_value}' на '{new_value}'",
        "description": "Описание изменено",
        "department": f"Отдел изменен с '{old_value}' на '{new_value}'",
        "priority": f"Приоритет изменен с {old_value} на {new_value}",
        "is_completed": f"Статус изменен на {'выполнена' if new_value else 'в работе'}",
        "is_archived": f"Задача {'архивирована' if new_value else 'разархивирована'}",
        "assigned_to_id": f"Исполнитель изменен с {old_value} на {new_value}",
        "protocol_id": f"Протокол изменен с {old_value} на {new_value}",
        "deadline": f"Срок изменен с {old_value} на {new_value}",
    }
    return comments.get(field, f"Изменено поле '{field}'")


# ============================================
# GET /tasks/
# ============================================
# views/task.py — get_tasks


@router.get("/tasks/")
async def get_tasks(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    search: str = Query(None),
    assigned_to: int = Query(None),
    created_by: int = Query(None),
    is_completed: bool = Query(None),
    priority: str = Query(None),
    department: str = Query(None),  # <-- НОВЫЙ ПАРАМЕТР
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Базовый запрос с загрузкой всех необходимых связей
    statement = select(Task).options(
        selectinload(Task.created_by),
        selectinload(Task.assigned_to),
        selectinload(Task.protocol).selectinload(Protocol.stages),
        selectinload(Task.task_stages),
        selectinload(Task.batches).selectinload(
            Batch.samples
        ),  # ← загружаем subsamples у батчей
        selectinload(Task.history).selectinload(QueryHistory.user),
    )

    # --- Применение фильтров ---
    if search:
        statement = statement.where(
            Task.name.contains(search)
            | Task.description.contains(search)
            | Task.department.contains(search)
        )

    if assigned_to is not None:
        statement = statement.where(Task.assigned_to_id == assigned_to)

    if created_by is not None:
        statement = statement.where(Task.created_by_id == created_by)

    if is_completed is not None:
        statement = statement.where(Task.is_completed == is_completed)

    if priority:
        statement = statement.where(Task.priority == priority)

    # ✅ Фильтр по отделу (новый)
    if department is not None:
        statement = statement.where(Task.department == department)

    # --- Сортировка ---
    if sort_by and hasattr(Task, sort_by):
        column = getattr(Task, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )
    else:
        # По умолчанию сортируем по дате создания (сначала новые)
        statement = statement.order_by(Task.created_at.desc())

    # --- Подсчёт общего количества (до пагинации) ---
    count_stmt = select(func.count()).select_from(statement.subquery())
    total = (await session.exec(count_stmt)).one()

    # --- Пагинация ---
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Выполнение запроса
    tasks = (await session.exec(statement)).all()

    result = [serialize_task(task, include_protocol_version=False) for task in tasks]

    return {
        "ok": True,
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ============================================
# GET /task/{task_id}/
# ============================================
# views/task.py — get_task


@router.get("/task/{task_id}/")
async def get_task(session: SessionDep, request: Request, task_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(
        Task,
        task_id,
        options=[
            selectinload(Task.created_by),
            selectinload(Task.assigned_to),
            selectinload(Task.protocol).selectinload(Protocol.stages),
            selectinload(Task.task_stages),
            selectinload(Task.batches).selectinload(Batch.samples),
            selectinload(Task.history).selectinload(QueryHistory.user),
        ],
    )

    if not task:
        return {"ok": False, "error": "Not found task."}

    return {"ok": True, "data": serialize_task(task)}


# ============================================
# POST /tasks/
# ============================================
@router.post("/tasks/")
async def create_task(session: SessionDep, request: Request, task_data: TaskCreate):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = Task(
        name=task_data.name,
        description=task_data.description,
        deadline=task_data.deadline,
        priority=task_data.priority,
        created_by_id=request.state.user.id,
        assigned_to_id=task_data.assigned_to_id,
        protocol_id=task_data.protocol_id,
        department=task_data.department or "",
    )

    session.add(task)
    await session.commit()
    await session.refresh(task)

    task_id = task.id
    task_name = task.name

    if task_data.batch_ids:
        batches = (
            await session.exec(select(Batch).where(Batch.id.in_(task_data.batch_ids)))
        ).all()
        task.batches = batches
        await session.commit()

    # Копируем этапы из протокола, если он выбран
    if task_data.protocol_id:
        protocol = await session.get(
            Protocol, task_data.protocol_id, options=[selectinload(Protocol.stages)]
        )
        if protocol and protocol.stages:
            for stage in protocol.stages:
                task_stage = TaskStage(
                    task_id=task_id,
                    name=stage.name,
                    description=stage.description,
                    order=stage.order,
                    is_completed=False,
                )
                session.add(task_stage)
            await session.commit()

    # История
    history = QueryHistory(
        action_type=ActionType.CREATED,
        user_id=request.state.user.id,
        task_id=task_id,
        comment=f"Задача '{task_name}' создана",
    )
    session.add(history)
    await session.commit()

    result = await session.get(
        Task,
        task_id,
        options=[
            selectinload(Task.created_by),
            selectinload(Task.assigned_to),
            selectinload(Task.protocol).selectinload(Protocol.stages),
            selectinload(Task.task_stages),
            selectinload(Task.batches).selectinload(Batch.samples),
            selectinload(Task.history).selectinload(QueryHistory.user),
        ],
    )
    return {"ok": True, "data": serialize_task(result)}


# ============================================
# PUT /task/{task_id}/
# ============================================
# views/task.py — update_task (исправленный)


@router.put("/task/{task_id}/")
async def update_task(
    session: SessionDep, request: Request, task_id: int, task_data: TaskUpdate
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(Task, task_id, options=[selectinload(Task.batches)])
    if not task:
        return {"ok": False, "error": "Not found task."}

    task_id_value = task.id
    changes = []
    update_data = task_data.model_dump(exclude_unset=True)

    # Обработка смены протокола (без немедленного коммита)
    if "protocol_id" in update_data:
        new_protocol_id = update_data["protocol_id"]
        old_protocol_id = task.protocol_id

        if new_protocol_id != old_protocol_id:
            # Удаляем старые этапы
            old_stages = await session.exec(
                select(TaskStage).where(TaskStage.task_id == task.id)
            )
            for s in old_stages:
                await session.delete(s)

            if new_protocol_id:
                protocol = await session.get(
                    Protocol, new_protocol_id, options=[selectinload(Protocol.stages)]
                )
                if protocol and protocol.stages:
                    for stage in protocol.stages:
                        task_stage = TaskStage(
                            task_id=task.id,
                            name=stage.name,
                            description=stage.description,
                            order=stage.order,
                            is_completed=False,
                        )
                        session.add(task_stage)
            # Не делаем commit, пойдём дальше

    # Обновление остальных полей
    editable_fields = [
        "name",
        "description",
        "department",
        "priority",
        "is_completed",
        "assigned_to_id",
        "protocol_id",
        "deadline",
        "is_archived",
    ]

    for field in editable_fields:
        if field not in update_data:
            continue

        new_value = update_data[field]
        old_value = getattr(task, field)

        changed = False
        if field == "deadline":
            old_str = old_value.isoformat() if old_value else None
            new_str = new_value.isoformat() if new_value else None
            if old_str != new_str:
                changed = True
        elif field in ["assigned_to_id", "protocol_id"] or field in [
            "is_completed",
            "is_archived",
        ]:
            if old_value != new_value:
                changed = True
        else:
            if old_value != new_value:
                changed = True

        if changed:
            old_for_log = old_value
            if isinstance(old_value, datetime):
                old_for_log = old_value.isoformat()

            changes.append(
                {
                    "field": field,
                    "old": old_for_log,
                    "new": new_value
                    if not isinstance(new_value, datetime)
                    else new_value.isoformat(),
                }
            )
            setattr(task, field, new_value)

    # Обработка batch_ids
    if "batch_ids" in update_data:
        old_batch_ids = [b.id for b in task.batches]
        new_batch_ids = update_data["batch_ids"] or []
        if set(old_batch_ids) != set(new_batch_ids):
            batches = (
                await session.exec(select(Batch).where(Batch.id.in_(new_batch_ids)))
            ).all()
            task.batches = batches
            changes.append(
                {"field": "batches", "old": old_batch_ids, "new": new_batch_ids}
            )

    # Установка completed_at
    if "is_completed" in update_data:
        if update_data["is_completed"] and not task.completed_at:
            task.completed_at = datetime.now()
        elif not update_data["is_completed"]:
            task.completed_at = None

    # Единый коммит всех изменений
    if changes:
        task.updated_at = datetime.now()
        session.add(task)
        await session.commit()
        # После коммита загружаем свежую задачу со связями
        result = await session.get(
            Task,
            task_id_value,
            options=[
                selectinload(Task.created_by),
                selectinload(Task.assigned_to),
                selectinload(Task.protocol).selectinload(Protocol.stages),
                selectinload(Task.task_stages),
                selectinload(Task.batches).selectinload(Batch.samples),
                selectinload(Task.history).selectinload(QueryHistory.user),
            ],
        )
        # Сохраняем историю изменений
        for change in changes:
            action_type = ActionType.UPDATED
            field_action_map = {
                "is_completed": ActionType.STATUS_CHANGED,
                "priority": ActionType.PRIORITY_CHANGED,
                "assigned_to_id": ActionType.ASSIGNEE_CHANGED,
                "protocol_id": ActionType.PROTOCOL_CHANGED,
                "department": ActionType.DEPARTMENT_CHANGED,
            }
            if change["field"] in field_action_map:
                action_type = field_action_map[change["field"]]

            comment = _format_change_comment(
                change["field"], change["old"], change["new"]
            )

            history = QueryHistory(
                action_type=action_type,
                user_id=request.state.user.id,
                task_id=task_id_value,
                field_name=change["field"],
                old_value={change["field"]: change["old"]},
                new_value={change["field"]: change["new"]},
                comment=comment,
            )
            session.add(history)
        await session.commit()
        # Перезагружаем результат с историей
        result = await session.get(
            Task,
            task_id_value,
            options=[
                selectinload(Task.created_by),
                selectinload(Task.assigned_to),
                selectinload(Task.protocol).selectinload(Protocol.stages),
                selectinload(Task.task_stages),
                selectinload(Task.batches).selectinload(Batch.samples),
                selectinload(Task.history).selectinload(QueryHistory.user),
            ],
        )
        return {
            "ok": True,
            "data": serialize_task(result),
        }
    else:
        # Если изменений не было, просто возвращаем задачу
        result = await session.get(
            Task,
            task_id_value,
            options=[
                selectinload(Task.created_by),
                selectinload(Task.assigned_to),
                selectinload(Task.protocol).selectinload(Protocol.stages),
                selectinload(Task.task_stages),
                selectinload(Task.batches).selectinload(Batch.samples),
                selectinload(Task.history).selectinload(QueryHistory.user),
            ],
        )
        return {
            "ok": True,
            "data": serialize_task(result),
        }


# ============================================
# DELETE /task/{task_id}/
# ============================================
@router.delete("/task/{task_id}/")
async def delete_task(session: SessionDep, request: Request, task_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(Task, task_id)
    if not task:
        return {"ok": False, "error": "Not found task."}

    await session.delete(task)
    await session.commit()
    return {"ok": True}


# ============================================
# PUT /task/{task_id}/stage/{stage_id}/
# (переключение состояния TaskStage)
# ============================================
@router.put("/task/{task_id}/stage/{stage_id}/")
async def toggle_task_stage(
    session: SessionDep,
    request: Request,
    task_id: int,
    stage_id: int,
    stage_data: dict,  # {"is_completed": bool}
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task_stage = await session.get(TaskStage, stage_id)
    if not task_stage or task_stage.task_id != task_id:
        return {"ok": False, "error": "Stage not found for this task."}

    task_stage.is_completed = stage_data.get("is_completed", False)
    session.add(task_stage)
    await session.commit()
    await session.refresh(task_stage)

    # Проверяем, все ли этапы выполнены
    task = await session.get(Task, task_id, options=[selectinload(Task.task_stages)])
    if task:
        all_completed = all(s.is_completed for s in task.task_stages)
        if all_completed and not task.is_completed:
            task.is_completed = True
            task.completed_at = datetime.now()
            session.add(task)
            await session.commit()
            await session.refresh(task)
        elif not all_completed and task.is_completed:
            task.is_completed = False
            task.completed_at = None
            session.add(task)
            await session.commit()
            await session.refresh(task)

    return {"ok": True, "data": task_stage}


# ============================================
# GET /task/{task_id}/history/
# ============================================
@router.get("/task/{task_id}/history/")
async def get_task_history(session: SessionDep, request: Request, task_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(Task, task_id)
    if not task:
        return {"ok": False, "error": "Not found task."}

    history = (
        await session.exec(
            select(QueryHistory)
            .where(QueryHistory.task_id == task_id)
            .order_by(QueryHistory.created_at.desc())
        )
    ).all()

    result = []
    for h in history:
        result.append(
            {
                "id": h.id,
                "action_type": h.action_type,
                "field_name": h.field_name,
                "old_value": h.old_value,
                "new_value": h.new_value,
                "comment": h.comment,
                "created_at": h.created_at.isoformat() if h.created_at else None,
                "user_id": h.user_id,
            }
        )

    return {"ok": True, "data": result}


# ============================================
# POST /task/{task_id}/archive/
# ============================================
@router.post("/task/{task_id}/archive/")
async def archive_task(session: SessionDep, request: Request, task_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(Task, task_id)
    if not task:
        return {"ok": False, "error": "Not found task."}

    task_id_value = task.id
    task_name = task.name

    if task.created_by_id != request.state.user.id:
        return {"ok": False, "error": "Only the creator can archive this task."}

    task.is_archived = True
    task.updated_at = datetime.now()
    session.add(task)
    await session.commit()
    await session.refresh(task)

    history = QueryHistory(
        action_type=ActionType.UPDATED,
        user_id=request.state.user.id,
        task_id=task_id_value,
        field_name="is_archived",
        old_value={"is_archived": False},
        new_value={"is_archived": True},
        comment=f"Задача '{task_name}' архивирована",
    )
    session.add(history)
    await session.commit()

    return {"ok": True, "data": {"id": task_id_value, "is_archived": True}}


# ============================================
# POST /task/{task_id}/unarchive/
# ============================================
@router.post("/task/{task_id}/unarchive/")
async def unarchive_task(session: SessionDep, request: Request, task_id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    task = await session.get(Task, task_id)
    if not task:
        return {"ok": False, "error": "Not found task."}

    task_id_value = task.id
    task_name = task.name

    if task.created_by_id != request.state.user.id:
        return {"ok": False, "error": "Only the creator can unarchive this task."}

    task.is_archived = False
    task.updated_at = datetime.now()
    session.add(task)
    await session.commit()
    await session.refresh(task)

    history = QueryHistory(
        action_type=ActionType.UPDATED,
        user_id=request.state.user.id,
        task_id=task_id_value,
        field_name="is_archived",
        old_value={"is_archived": True},
        new_value={"is_archived": False},
        comment=f"Задача '{task_name}' разархивирована",
    )
    session.add(history)
    await session.commit()

    return {"ok": True, "data": {"id": task_id_value, "is_archived": False}}


# ============================================
# GET /tasks/archived/
# ============================================
@router.get("/tasks/archived/")
async def get_archived_tasks(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    department: str = Query(None),  # <-- НОВЫЙ ПАРАМЕТР
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = (
        select(Task)
        .where(Task.is_archived == True)
        .options(
            selectinload(Task.created_by),
            selectinload(Task.assigned_to),
            selectinload(Task.protocol).selectinload(Protocol.stages),
            selectinload(Task.task_stages),
            selectinload(Task.batches).selectinload(Batch.samples),
        )
    )

    # Если передан department – показываем все задачи отдела (игнорируем создателя)
    if department is not None:
        statement = statement.where(Task.department == department)
    else:
        # Иначе – только созданные текущим пользователем
        statement = statement.where(Task.created_by_id == request.state.user.id)

    statement = statement.order_by(Task.updated_at.desc())

    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    tasks = (await session.exec(statement)).all()

    result = [serialize_task(task, include_history=False) for task in tasks]

    return {"ok": True, "data": result}


@router.get("/tasks/completed_stats/")
async def get_completed_stats(
    session: SessionDep,
    request: Request,
    department: str = Query(...),
    days: int = Query(30, ge=1, le=365),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    # Получаем дату начала периода
    start_date = datetime.now() - timedelta(days=days)
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

    # Запрос: группировка по дням (по дате завершения completed_at)

    query = select(
        func.date(Task.completed_at).label("date"),
        func.count().label("count"),
    )
    if department == "__ALL__":
        query = query.where(
            Task.is_completed == True,
            Task.completed_at >= start_date,
        )
    else:
        query = query.where(
            Task.department == department,
            Task.is_completed == True,
            Task.completed_at >= start_date,
        )
    query = query.group_by(func.date(Task.completed_at)).order_by(
        func.date(Task.completed_at)
    )

    results = (await session.exec(query)).all()

    # Преобразуем в список словарей
    data = [{"date": r.date, "count": r.count} for r in results]
    return {"ok": True, "data": data}

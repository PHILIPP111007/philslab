# views/task.py
from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.database import SessionDep
from app.models import (
    ActionType,
    Batch,
    Protocol,
    QueryHistory,
    Sample,
    Task,
    TaskStage,
)
from app.request_body import TaskCreate, TaskUpdate

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
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = select(Task).options(
        selectinload(Task.created_by),
        selectinload(Task.assigned_to),
        selectinload(Task.protocol),
        selectinload(Task.task_stages),
        selectinload(Task.batches),  # ✅ Добавляем
        selectinload(Task.history).selectinload(QueryHistory.user),
    )

    if assigned_to:
        statement = statement.where(Task.assigned_to_id == assigned_to)
    if created_by:
        statement = statement.where(Task.created_by_id == created_by)
    if is_completed is not None:
        statement = statement.where(Task.is_completed == is_completed)
    if priority:
        statement = statement.where(Task.priority == priority)

    if search:
        statement = statement.where(
            (Task.name.contains(search)) | (Task.description.contains(search))
        )

    if sort_by and hasattr(Task, sort_by):
        column = getattr(Task, sort_by)
        statement = statement.order_by(
            column.desc() if sort_order == "desc" else column.asc()
        )
    else:
        statement = statement.order_by(Task.created_at.desc())

    offset = (page - 1) * page_size
    total = (
        await session.exec(select(func.count()).select_from(select(Task).subquery()))
    ).one()
    statement = statement.offset(offset).limit(page_size)
    tasks = (await session.exec(statement)).all()

    result = []
    for task in tasks:
        stages_data = [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "is_completed": s.is_completed,
                "order": s.order,
            }
            for s in task.task_stages
        ]

        task_dict = {
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "department": task.department or "",
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "priority": task.priority,
            "is_completed": task.is_completed,
            "is_archived": task.is_archived,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            "completed_at": task.completed_at.isoformat()
            if task.completed_at
            else None,
            "created_by": {
                "id": task.created_by.id,
                "username": task.created_by.username,
                "first_name": task.created_by.first_name,
                "last_name": task.created_by.last_name,
            }
            if task.created_by
            else None,
            "assigned_to": {
                "id": task.assigned_to.id,
                "username": task.assigned_to.username,
                "first_name": task.assigned_to.first_name,
                "last_name": task.assigned_to.last_name,
            }
            if task.assigned_to
            else None,
            "protocol": {
                "id": task.protocol.id,
                "name": task.protocol.name,
                "code": task.protocol.code,
            }
            if task.protocol
            else None,
            "stages": stages_data,
            "history": [
                {
                    "id": h.id,
                    "action_type": h.action_type,
                    "field_name": h.field_name,
                    "old_value": h.old_value,
                    "new_value": h.new_value,
                    "comment": h.comment,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                    "user": {
                        "id": h.user.id,
                        "username": h.user.username,
                        "first_name": h.user.first_name,
                        "last_name": h.user.last_name,
                    }
                    if h.user
                    else None,
                }
                for h in task.history
            ],
            "batches": [
                {
                    "id": b.id,
                    "name": b.name,
                    "department": b.department,
                }
                for b in task.batches
            ],
        }
        result.append(task_dict)

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
            selectinload(Task.protocol),
            selectinload(Task.samples),
            selectinload(Task.task_stages),
            selectinload(Task.batches),  # ✅ Добавляем
            selectinload(Task.history).selectinload(QueryHistory.user),
        ],
    )
    if not task:
        return {"ok": False, "error": "Not found task."}

    stages_data = [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "is_completed": s.is_completed,
            "order": s.order,
        }
        for s in task.task_stages
    ]

    return {
        "ok": True,
        "data": {
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "department": task.department or "",
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "priority": task.priority,
            "is_completed": task.is_completed,
            "is_archived": task.is_archived,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            "completed_at": task.completed_at.isoformat()
            if task.completed_at
            else None,
            "created_by": {
                "id": task.created_by.id,
                "username": task.created_by.username,
                "first_name": task.created_by.first_name,
                "last_name": task.created_by.last_name,
            }
            if task.created_by
            else None,
            "assigned_to": {
                "id": task.assigned_to.id,
                "username": task.assigned_to.username,
                "first_name": task.assigned_to.first_name,
                "last_name": task.assigned_to.last_name,
            }
            if task.assigned_to
            else None,
            "protocol": {
                "id": task.protocol.id,
                "name": task.protocol.name,
                "code": task.protocol.code,
            }
            if task.protocol
            else None,
            "stages": stages_data,
            "samples": [
                {
                    "id": s.id,
                    "name": s.name,
                    "zlims_id": s.zlims_id,
                }
                for s in task.samples
            ],
            "history": [
                {
                    "id": h.id,
                    "action_type": h.action_type,
                    "field_name": h.field_name,
                    "old_value": h.old_value,
                    "new_value": h.new_value,
                    "comment": h.comment,
                    "created_at": h.created_at.isoformat() if h.created_at else None,
                    "user": {
                        "id": h.user.id,
                        "username": h.user.username,
                        "first_name": h.user.first_name,
                        "last_name": h.user.last_name,
                    }
                    if h.user
                    else None,
                }
                for h in task.history
            ],
            "batches": [
                {
                    "id": b.id,
                    "name": b.name,
                    "department": b.department,
                }
                for b in task.batches
            ],
        },
    }


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

    # Добавляем образцы
    if task_data.sample_ids:
        samples = (
            await session.exec(
                select(Sample).where(Sample.id.in_(task_data.sample_ids))
            )
        ).all()
        task.samples = samples
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
    await session.refresh(task)

    return {"ok": True, "data": task}


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

    task = await session.get(Task, task_id)
    if not task:
        return {"ok": False, "error": "Not found task."}

    task_id_value = task.id

    # ✅ Отслеживаем изменения ТОЛЬКО для переданных полей
    changes = []
    update_data = task_data.model_dump(exclude_unset=True)

    # ✅ Если protocol_id изменился — пересоздаём этапы
    if "protocol_id" in update_data:
        new_protocol_id = update_data["protocol_id"]
        old_protocol_id = task.protocol_id

        if new_protocol_id != old_protocol_id:
            # Удаляем старые этапы задачи
            old_stages = await session.exec(
                select(TaskStage).where(TaskStage.task_id == task.id)
            )
            for s in old_stages:
                await session.delete(s)

            # Копируем этапы из нового протокола (если есть)
            if new_protocol_id:
                protocol = await session.get(Protocol, new_protocol_id)
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
            await session.commit()

    # ✅ Список полей, которые можно обновлять
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
        # ✅ Проверяем, что поле было передано в запросе
        if field not in update_data:
            continue

        new_value = update_data[field]
        old_value = getattr(task, field)

        # ✅ Сравниваем значения
        changed = False

        if field == "deadline":
            # Для дат — сравниваем строки
            old_str = old_value.isoformat() if old_value else None
            new_str = new_value.isoformat() if new_value else None
            if old_str != new_str:
                changed = True
        elif field in ["assigned_to_id", "protocol_id"]:
            # Для ID — сравниваем числа
            if old_value != new_value:
                changed = True
        elif field in ["is_completed", "is_archived"]:
            # Для булевых значений
            if old_value != new_value:
                changed = True
        else:
            # Для строк
            if old_value != new_value:
                changed = True

        if changed:
            # ✅ Сохраняем старое значение для лога
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

    # ✅ Обновляем батчи — только если переданы
    if "batch_ids" in update_data:
        old_batch_ids = [b.id for b in task.batches]
        new_batch_ids = update_data["batch_ids"]

        if set(old_batch_ids) != set(new_batch_ids):
            batches = (
                await session.exec(select(Batch).where(Batch.id.in_(new_batch_ids)))
            ).all()
            task.batches = batches
            changes.append(
                {"field": "batches", "old": old_batch_ids, "new": new_batch_ids}
            )

    # ✅ Если задача помечена как выполненная
    if (
        "is_completed" in update_data
        and update_data["is_completed"]
        and not task.completed_at
    ):
        task.completed_at = datetime.now()
    elif "is_completed" in update_data and not update_data["is_completed"]:
        task.completed_at = None

    # ✅ Обновляем дату изменения ТОЛЬКО если были изменения
    if changes:
        task.updated_at = datetime.now()
        session.add(task)
        await session.commit()
        await session.refresh(task)

        # ✅ Сохраняем изменения в историю
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
    else:
        # ✅ Если изменений нет — просто возвращаем задачу
        await session.refresh(task)

    # ✅ Получаем обновленную задачу (без samples)
    from sqlalchemy.orm import selectinload

    result = await session.get(
        Task,
        task_id_value,
        options=[
            selectinload(Task.created_by),
            selectinload(Task.assigned_to),
            selectinload(Task.protocol).selectinload(Protocol.stages),
            selectinload(Task.task_stages),
            selectinload(Task.batches),  # ✅ Добавляем батчи
            selectinload(Task.history).selectinload(QueryHistory.user),
        ],
    )

    return {"ok": True, "data": result}


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
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = (
        select(Task)
        .where(Task.created_by_id == request.state.user.id, Task.is_archived == True)
        .order_by(Task.updated_at.desc())
    )

    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    tasks = (await session.exec(statement)).all()

    result = []
    for task in tasks:
        result.append(
            {
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "priority": task.priority,
                "is_completed": task.is_completed,
                "is_archived": task.is_archived,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            }
        )

    return {"ok": True, "data": result}

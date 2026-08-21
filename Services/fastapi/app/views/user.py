# views/user.py
from fastapi import APIRouter, Query, Request
from sqlmodel import func, select

from app.database import SessionDep
from app.services.history import add_history
from app.enums.action_type import ActionType
from app.models import User
from app.request_body import UserBody

router = APIRouter(tags=["user"])


@router.get("/user/{username}/")
async def get_user(session: SessionDep, request: Request, username: str):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    query = await session.exec(select(User).where(User.id == request.state.user.id))
    query = query.first()
    if not query:
        return {"ok": False, "error": "Not found the global user."}

    user = {
        "id": query.id,
        "username": query.username,
        "email": query.email,
        "first_name": query.first_name,
        "last_name": query.last_name,
        "descr": query.descr,
        "department": query.department,  # ← добавлено
    }

    result = {"ok": True, "global_user": user}

    query = await session.exec(select(User).where(User.username == username))
    query = query.first()
    if not query:
        return result

    user = {
        "id": query.id,
        "username": query.username,
        "email": query.email,
        "first_name": query.first_name,
        "last_name": query.last_name,
        "descr": query.descr,
        "department": query.department,  # ← добавлено
    }

    result["local_user"] = user
    return result


@router.put("/user/{username}/")
async def put_user(
    session: SessionDep, request: Request, username: str, user_body: UserBody
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    if request.state.user.username != username:
        return {"ok": False, "error": "Can only update your own profile."}

    user = await session.exec(select(User).where(User.id == request.state.user.id))
    user = user.first()
    if not user:
        return {"ok": False, "error": "Not found user."}

    # Обновляем только переданные поля и сохраняем изменения профиля.
    update_data = user_body.model_dump(exclude_unset=True)
    changes = []
    for field, value in update_data.items():
        if hasattr(user, field):
            old_value = getattr(user, field)
            if old_value == value:
                continue
            changes.append((field, old_value, value))
            setattr(user, field, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)

    for field, old_value, new_value in changes:
        await add_history(
            session,
            entity_type="user",
            entity_id=user.id,
            user_id=request.state.user.id,
            field_name=field,
            old_value={field: old_value},
            new_value={field: new_value},
            comment=f"Изменено поле профиля: {field}",
        )
    if changes:
        await session.commit()

    return {"ok": True, "user": user}


@router.get("/users/")
async def get_users(
    session: SessionDep,
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    department: str = Query(None),
):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    statement = select(User)

    # Поиск по username, first_name, last_name, email
    if search:
        search_cond = (
            User.username.contains(search)
            | User.first_name.contains(search)
            | User.last_name.contains(search)
            | User.email.contains(search)
        )
        statement = statement.where(search_cond)

    # Фильтр по отделу
    if department:
        statement = statement.where(User.department == department)

    # Сортировка по username
    statement = statement.order_by(User.username.asc())

    # Подсчёт общего количества
    count_stmt = select(func.count()).select_from(statement.subquery())
    total = (await session.exec(count_stmt)).one()

    # Пагинация
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    users = (await session.exec(statement)).all()

    # Преобразуем в список словарей
    result = []
    for user in users:
        result.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "descr": user.descr,
                "department": user.department,
            }
        )

    return {
        "ok": True,
        "data": result,
        "total": total,
        "page": page,
        "page_size": page_size,
    }

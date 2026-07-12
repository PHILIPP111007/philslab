from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
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
    }

    result["local_user"] = user
    return result


@router.put("/user/")
async def put_user(session: SessionDep, request: Request, user_body: UserBody):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    user = await session.exec(select(User).where(User.id == request.state.user.id))
    user = user.first()
    if not user:
        return {"ok": False, "error": "Not found user."}

    user.first_name = user_body.first_name
    user.last_name = user_body.last_name
    user.email = user_body.email

    user.ethereum_address = user_body.ethereum_address
    user.infura_api_key = user_body.infura_api_key

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {"ok": True, "user": user}

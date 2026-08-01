from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.constants import (
    API_PREFIX,
    DEVELOPMENT,
)
from app.database import engine
from app.models import Token, User
from app.views import batch, protocol, sample, stage, subsample, task, user

app = FastAPI(
    title="PhilsLab",
    version="1.0.0",
    description="### Laboratory journal.",
    contact={
        "name": "Roshchin Philipp",
        "url": "https://github.com/PHILIPP111007",
        "email": "r.phil@yandex.ru",
    },
    license_info={
        "name": "MIT",
        "identifier": "MIT",
    },
    openapi_url="/docs/openapi.json",
)


#########################################
# Middleware ############################
#########################################

if DEVELOPMENT == "1":
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
else:
    # TODO: add
    origins = ["https://ваш-домен.com"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies to be included in cross-origin requests
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers in cross-origin requests
)


@app.middleware("http")
async def attach_user_to_request(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Middleware to store user in request context"""

    request.state.user = None

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return await call_next(request)

    # Безопасное извлечение токена: проверяем префикс и наличие значения
    try:
        scheme, token = auth_header.split(" ", 1)
    except ValueError:
        return await call_next(request)

    if scheme.lower() != "token" or not token:
        return await call_next(request)

    async with AsyncSession(engine) as session:
        token_obj = await session.exec(select(Token).where(Token.key == token))
        token_obj = token_obj.first()

        if not token_obj:
            return await call_next(request)

        # Безопасно: one_or_none вместо one, чтобы не было 500 при отсутствии юзера
        user_result = await session.exec(
            select(User).where(User.id == token_obj.user_id)
        )
        user = user_result.one_or_none()

        if user:
            request.state.user = user

    return await call_next(request)


routers = [
    user.router,
    sample.router,
    subsample.router,
    protocol.router,
    stage.router,
    task.router,
    batch.router,
]

for router in routers:
    app.include_router(router, prefix=API_PREFIX)

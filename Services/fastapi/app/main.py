from typing import Callable

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.constants import (
    API_PREFIX,
    DEVELOPMENT,
)
from app.database import engine
from app.models import Token, User
from app.views import sample, user

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

app.openapi_version = "3.0.0"


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
async def attach_user_to_request(request: Request, call_next: Callable):
    """Middleware to store user in request context"""

    # Извлекаем учетные данные из запроса
    token = request.headers.get("Authorization")

    # Инициализируем пользователя как None по умолчанию
    request.state.user = None

    # Базовая валидация наличия учетных данных
    if not (token and " " in token):
        return await call_next(request)

    # Извлекаем токен из заголовка Authorization (формат: "Bearer <token>")
    token = token.split(" ", 1)[1]

    async with AsyncSession(engine) as session:
        token_obj = await session.exec(select(Token).where(Token.key == token))
        token_obj = token_obj.first()
        if not token_obj:
            return await call_next(request)

        user = await session.exec(select(User).where(User.id == token_obj.user_id))
        user = user.one()
        if user:
            request.state.user = User(
                id=user.id,
                username=user.username,
            )

    # Продолжаем обработку запроса
    return await call_next(request)


app.include_router(user.router, prefix=API_PREFIX)
app.include_router(sample.router, prefix=API_PREFIX)

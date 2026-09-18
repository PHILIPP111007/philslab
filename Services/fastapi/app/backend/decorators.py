"""Decorators shared by FastAPI endpoint functions."""

import logging
from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import Request
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def _get_request(args: tuple[Any, ...], kwargs: dict[str, Any]) -> Request | None:
    request = kwargs.get("request")
    if request is not None:
        return request
    return next(
        (argument for argument in args if isinstance(argument, Request)),
        None,
    )


def require_authenticated(view: Callable[..., Any]) -> Callable[..., Any]:
    """Allow an endpoint to run only when middleware resolved the user.

    The project uses a stable ``ok/error`` response envelope, so an
    unauthenticated request returns the same response that the endpoints used
    to build locally. ``wraps`` keeps the original FastAPI signature visible
    to route registration and OpenAPI generation.
    """

    @wraps(view)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        request = _get_request(args, kwargs)

        if request is None:
            raise RuntimeError(
                f"{view.__name__} must declare a fastapi.Request parameter"
            )

        if not getattr(request.state, "user", None):
            return {"ok": False, "error": "Не могу вас аутентифицировать."}

        return await view(*args, **kwargs)

    return wrapper


def require_authorization(
    *required_groups: str,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Require the authenticated user to belong to every given Django group.

    Example::

        @require_authenticated
        @require_authorization("laboratory_admin", "sample_editor")
        async def update_sample(...):
            ...

    Group names are read directly from the FastAPI ``User.groups``
    relationship, which maps Django's ``auth_group`` and ``app_user_groups``
    tables. Middleware must eagerly load this relationship before the
    decorator runs.
    """

    groups = frozenset(
        group.strip()
        for group in required_groups
        if isinstance(group, str) and group.strip()
    )
    if not groups:
        raise ValueError("require_authorization requires at least one group name")

    def decorator(view: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(view)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            request = _get_request(args, kwargs)
            if request is None:
                raise RuntimeError(
                    f"{view.__name__} must declare a fastapi.Request parameter"
                )

            user = getattr(request.state, "user", None)
            if not user:
                return {"ok": False, "error": "Не могу вас аутентифицировать."}

            try:
                user_groups = {str(group.name) for group in user.groups}
            except (AttributeError, SQLAlchemyError):
                logger.exception("Could not load Django groups for user_id=%s", user.id)
                return {"ok": False, "error": "Can not verify authorization."}

            if not groups.issubset(user_groups):
                return {"ok": False, "error": "У вас нет прав на это действие."}

            return await view(*args, **kwargs)

        return wrapper

    return decorator

"""Decorators shared by FastAPI endpoint functions."""

from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import Request


def require_authenticated(view: Callable[..., Any]) -> Callable[..., Any]:
    """Allow an endpoint to run only when middleware resolved the user.

    The project uses a stable ``ok/error`` response envelope, so an
    unauthenticated request returns the same response that the endpoints used
    to build locally. ``wraps`` keeps the original FastAPI signature visible
    to route registration and OpenAPI generation.
    """

    @wraps(view)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        request = kwargs.get("request")
        if request is None:
            request = next(
                (argument for argument in args if isinstance(argument, Request)),
                None,
            )

        if request is None:
            raise RuntimeError(
                f"{view.__name__} must declare a fastapi.Request parameter"
            )

        if not getattr(request.state, "user", None):
            return {"ok": False, "error": "Can not authenticate."}

        return await view(*args, **kwargs)

    return wrapper

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any

from app.enums.action_type import ActionType
from app.models import QueryHistory


ENTITY_TYPES = frozenset({"user", "sample", "batch", "protocol", "stage", "task"})


def json_value(value: Any) -> Any:
    """Convert common model values to JSON-safe values for history snapshots."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [json_value(item) for item in value]
    return value


def snapshot(instance: Any, fields: list[str]) -> dict[str, Any]:
    return {field: json_value(getattr(instance, field, None)) for field in fields}


async def add_history(
    session,
    *,
    entity_type: str,
    entity_id: int,
    user_id: int,
    action_type: ActionType = ActionType.UPDATED,
    field_name: str = "",
    old_value: Any = None,
    new_value: Any = None,
    comment: str = "",
    task_id: int | None = None,
) -> QueryHistory:
    if entity_type not in ENTITY_TYPES:
        raise ValueError(f"Unsupported history entity type: {entity_type}")

    history = QueryHistory(
        entity_type=entity_type,
        entity_id=entity_id,
        action_type=action_type,
        user_id=user_id,
        task_id=task_id if entity_type == "task" else None,
        field_name=field_name,
        old_value=json_value(old_value),
        new_value=json_value(new_value),
        comment=comment,
    )
    session.add(history)
    return history


def serialize_history_entry(history: QueryHistory) -> dict[str, Any]:
    user = history.user
    return {
        "id": history.id,
        "entity_type": history.entity_type,
        "entity_id": history.entity_id,
        "action_type": history.action_type,
        "field_name": history.field_name,
        "old_value": history.old_value,
        "new_value": history.new_value,
        "comment": history.comment,
        "created_at": history.created_at.isoformat() if history.created_at else None,
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
        if user
        else None,
        "user_id": history.user_id,
    }

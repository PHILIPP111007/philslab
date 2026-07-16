__all__ = ["QueryHistory"]

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from .enums import ActionType

if TYPE_CHECKING:
    from .task import Task
    from .user import User


class QueryHistory(SQLModel, table=True):
    """История изменений задачи"""

    __tablename__ = "app_queryhistory"

    id: int = Field(primary_key=True)
    action_type: ActionType
    field_name: str = Field(default="")
    old_value: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    new_value: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    comment: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    user_id: int = Field(foreign_key="app_user.id", index=True)
    task_id: int = Field(foreign_key="app_task.id", index=True)

    # Связи
    user: "User" = Relationship(back_populates="history_entries")
    task: "Task" = Relationship(back_populates="history")

__all__ = ["TaskStage"]

from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .task import Task


class TaskStage(SQLModel, table=True):
    """Этап задачи (копия из протокола)"""

    __tablename__ = "app_taskstage"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    description: str = Field(default="")
    is_completed: bool = Field(default=False)
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешний ключ
    task_id: int = Field(foreign_key="app_task.id", index=True)

    # Связи
    task: "Task" = Relationship(back_populates="task_stages")

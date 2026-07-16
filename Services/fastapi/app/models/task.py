__all__ = ["Task"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.task_batch_link import TaskBatchLink
from app.models.task_sample_link import TaskSampleLink

from .enums import Priority

if TYPE_CHECKING:
    from .batch import Batch
    from .protocol import Protocol
    from .query_history import QueryHistory
    from .sample import Sample
    from .user import User


class Task(SQLModel, table=True):
    """Модель задачи"""

    __tablename__ = "app_task"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    description: str = Field(default="")

    # Даты
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    deadline: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    completed_at: Optional[datetime] = Field(default=None)

    # Приоритет и статус
    priority: Priority = Field(default=Priority.medium)
    is_completed: bool = Field(default=False)
    is_archived: bool = Field(default=False)
    department: str = Field(default="", max_length=150)

    # Внешние ключи
    created_by_id: int = Field(foreign_key="app_user.id", index=True)
    assigned_to_id: Optional[int] = Field(
        foreign_key="app_user.id", index=True, default=None
    )
    protocol_id: Optional[int] = Field(
        foreign_key="app_protocol.id", index=True, default=None
    )

    # Связи
    created_by: "User" = Relationship(
        back_populates="created_tasks",
        sa_relationship_kwargs={"foreign_keys": "[Task.created_by_id]"},
    )
    assigned_to: Optional["User"] = Relationship(
        back_populates="assigned_tasks",
        sa_relationship_kwargs={"foreign_keys": "[Task.assigned_to_id]"},
    )
    protocol: Optional["Protocol"] = Relationship(back_populates="tasks")

    samples: List["Sample"] = Relationship(
        back_populates="tasks", link_model=TaskSampleLink
    )

    batches: List["Batch"] = Relationship(
        back_populates="tasks",
        link_model=TaskBatchLink,
    )

    # История
    history: List["QueryHistory"] = Relationship(back_populates="task")

    def get_progress(self) -> int:
        """Прогресс выполнения — считаем по этапам задачи (TaskStage)"""
        total = len(self.task_stages)
        if total == 0:
            return 0
        completed = sum(1 for s in self.task_stages if s.is_completed)
        return int((completed / total) * 100)

    def is_overdue(self) -> bool:
        """Проверка на просрочку"""
        if self.is_completed or not self.deadline:
            return False
        return datetime.now() > self.deadline

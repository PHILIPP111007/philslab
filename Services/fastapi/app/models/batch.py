__all__ = ["Batch"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.task_batch_link import TaskBatchLink

if TYPE_CHECKING:
    from .batch_subsample import BatchSubsample
    from .task import Task
    from .user import User


class Batch(SQLModel, table=True):
    """Батч (партия) образцов — группа подобразцов, объединённых по какому-либо признаку"""

    __tablename__ = "app_batch"

    id: int = Field(primary_key=True)

    name: Optional[str] = Field(default=None, max_length=255)
    department: Optional[str] = Field(default=None, max_length=150)
    descr: Optional[str] = Field(default=None, max_length=5000)

    # Даты
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    user_id: Optional[int] = Field(foreign_key="app_user.id", index=True, default=None)

    # Связи
    user: Optional["User"] = Relationship(
        back_populates="batches",
        sa_relationship_kwargs={"foreign_keys": "[Batch.user_id]"},
    )

    # Подобразцы в батче (через BatchSubsample)
    batch_subsamples: List["BatchSubsample"] = Relationship(back_populates="batch")

    # Задачи, связанные с батчем (многие ко многим)
    tasks: List["Task"] = Relationship(
        back_populates="batches",
        link_model=TaskBatchLink,
    )

    @property
    def subsample_count(self) -> int:
        """Количество подобразцов в батче."""
        return len(self.batch_subsamples)

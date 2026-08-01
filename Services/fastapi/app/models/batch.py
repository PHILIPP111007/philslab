__all__ = ["Batch"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from .batch_subsample_link import BatchSubsampleLink
from .task_batch_link import TaskBatchLink

if TYPE_CHECKING:
    from .subsample import Subsample
    from .task import Task
    from .user import User


class Batch(SQLModel, table=True):
    """Батч (партия) образцов."""

    __tablename__ = "app_batch"

    id: int = Field(primary_key=True)

    name: Optional[str] = Field(default=None, max_length=255)
    department: Optional[str] = Field(default=None, max_length=150)
    descr: Optional[str] = Field(default=None, max_length=5000)

    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    user_id: Optional[int] = Field(foreign_key="app_user.id", index=True, default=None)

    # Связи
    user: Optional["User"] = Relationship(
        back_populates="batches",
        sa_relationship_kwargs={"foreign_keys": "[Batch.user_id]"},
    )

    # ✅ ManyToMany связь с Subsample
    subsamples: List["Subsample"] = Relationship(
        back_populates="batches",
        link_model=BatchSubsampleLink,
    )

    # Связь с задачами (остаётся)
    tasks: List["Task"] = Relationship(
        back_populates="batches",
        link_model=TaskBatchLink,
    )

    @property
    def subsample_count(self) -> int:
        """Количество подобразцов в батче."""
        return len(self.subsamples)

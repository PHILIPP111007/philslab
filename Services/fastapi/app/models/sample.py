__all__ = ["Sample"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from .task_sample_link import TaskSampleLink

if TYPE_CHECKING:
    from .task import Task
    from .user import User


class Sample(SQLModel, table=True):
    """Образец (биологический материал)"""

    __tablename__ = "app_sample"

    id: int = Field(primary_key=True)
    name: Optional[str] = Field(default=None, max_length=255)
    zlims_id: Optional[str] = Field(default=None, max_length=255)
    some_number: Optional[int] = Field(default=None)
    descr: Optional[str] = Field(default=None, max_length=5000)
    timestamp: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    user_id: Optional[int] = Field(foreign_key="app_user.id", index=True, default=None)
    # created_by_id: Optional[int] = Field(
    #     foreign_key="app_user.id", index=True, default=None
    # )  # ✅ добавляем

    # Связи
    user: Optional["User"] = Relationship(
        back_populates="samples",
        sa_relationship_kwargs={"foreign_keys": "[Sample.user_id]"},
    )
    # created_by: Optional["User"] = Relationship(
    #     back_populates="created_samples",
    #     sa_relationship_kwargs={"foreign_keys": "[Sample.created_by_id]"},
    # )

    # Связь с Task (многие ко многим)
    tasks: List["Task"] = Relationship(
        back_populates="samples", link_model=TaskSampleLink
    )

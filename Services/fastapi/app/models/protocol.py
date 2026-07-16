__all__ = ["Protocol"]

from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .stage import Stage
    from .task import Task
    from .user import User


class Protocol(SQLModel, table=True):
    """Протокол/СОП с этапами"""

    __tablename__ = "app_protocol"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    code: str = Field(max_length=50, unique=True)
    description: str = Field(default="")
    version: str = Field(default="1.0")
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    created_by_id: int = Field(foreign_key="app_user.id", index=True)

    # Связи
    created_by: "User" = Relationship(back_populates="created_protocols")
    tasks: List["Task"] = Relationship(back_populates="protocol")

    # ✅ Этапы теперь принадлежат протоколу
    stages: List["Stage"] = Relationship(back_populates="protocol")

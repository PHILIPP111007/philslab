__all__ = ["Stage"]

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .protocol import Protocol


class Stage(SQLModel, table=True):
    """Этап/шаг выполнения задачи (принадлежит протоколу)"""

    __tablename__ = "app_stage"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    description: str = Field(default="")
    is_completed: bool = Field(default=False)
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # ✅ Внешний ключ на протокол
    protocol_id: int = Field(foreign_key="app_protocol.id", index=True)

    # Связи
    protocol: Optional["Protocol"] = Relationship(back_populates="stages")

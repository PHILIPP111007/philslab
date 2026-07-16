__all__ = ["Subsample"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .batch_subsample import BatchSubsample
    from .sample import Sample
    from .user import User


class Subsample(SQLModel, table=True):
    """Подобразец (повторное выделение / копия) — относится к конкретному Sample"""

    __tablename__ = "app_subsample"

    id: int = Field(primary_key=True)

    # Основные идентификаторы
    sample_code: Optional[str] = Field(default=None, max_length=255, index=True)
    sample_group_code: Optional[str] = Field(default=None, max_length=255, index=True)

    # Дополнительные поля
    name: Optional[str] = Field(default=None, max_length=255)
    some_number: Optional[int] = Field(default=None)
    qc_1: Optional[float] = Field(default=None)
    qc_2: Optional[float] = Field(default=None)
    descr: Optional[str] = Field(default=None, max_length=5000)

    # Даты
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    sample_id: int = Field(foreign_key="app_sample.id", index=True)
    user_id: Optional[int] = Field(foreign_key="app_user.id", index=True, default=None)

    # Связи
    sample: "Sample" = Relationship(back_populates="subsamples")
    user: Optional["User"] = Relationship(
        back_populates="subsamples",
        sa_relationship_kwargs={"foreign_keys": "[Subsample.user_id]"},
    )

    # BatchSubsample (обратная связь)
    batch_subsamples: List["BatchSubsample"] = Relationship(back_populates="subsample")

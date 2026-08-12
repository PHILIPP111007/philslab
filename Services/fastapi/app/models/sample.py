__all__ = ["Sample"]

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, String
from sqlmodel import Field, Relationship, SQLModel

from app.enums.material_type import MaterialType
from app.models.batch_sample_link import BatchSampleLink

if TYPE_CHECKING:
    from .user import User


class Sample(SQLModel, table=True):
    """Первичный образец, поступивший в лабораторию"""

    __tablename__ = "app_sample"

    id: int = Field(primary_key=True)

    # Основные идентификаторы
    sample_code: str | None = Field(default=None, max_length=255, index=True)
    sample_group_code: str | None = Field(default=None, max_length=255, index=True)
    zlims_code: str | None = Field(default=None, max_length=255, unique=True)
    uin1: str | None = Field(default=None, max_length=255, index=True)
    uin2: str | None = Field(default=None, max_length=255)

    # Детали образца
    project_code: str | None = Field(default=None, max_length=50)
    sample_index: str | None = Field(default=None, max_length=50)

    # Дополнительные поля
    qc_1: float | None = Field(default=None)
    qc_2: float | None = Field(default=None)
    descr: str | None = Field(default=None, max_length=5000)
    # Keep the shared Django column as VARCHAR while validating new API input
    # with the MaterialType enum. This avoids a database enum migration and
    # keeps legacy values readable in the shared database.
    material_type: MaterialType | None = Field(
        default=None,
        sa_column=Column(String(100), nullable=True),
    )

    # Даты
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    user_id: int | None = Field(foreign_key="app_user.id", index=True, default=None)

    # Связи
    user: Optional["User"] = Relationship(
        back_populates="samples",
        sa_relationship_kwargs={"foreign_keys": "[Sample.user_id]"},
    )

    # BatchSubsample (обратная связь)
    batches: list["Batch"] = Relationship(
        back_populates="samples",
        link_model=BatchSampleLink,
    )

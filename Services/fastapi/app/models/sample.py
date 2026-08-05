__all__ = ["Sample"]

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.models.batch_sample_link import BatchSampleLink

if TYPE_CHECKING:
    from .user import User


class Sample(SQLModel, table=True):
    """Первичный образец, поступивший в лабораторию"""

    __tablename__ = "app_sample"

    id: int = Field(primary_key=True)

    # Основные идентификаторы
    sample_code: Optional[str] = Field(default=None, max_length=255, index=True)
    sample_group_code: Optional[str] = Field(default=None, max_length=255, index=True)
    zlims_code: Optional[str] = Field(default=None, max_length=255, unique=True)
    uin1: Optional[str] = Field(default=None, max_length=255, index=True)
    uin2: Optional[str] = Field(default=None, max_length=255)

    # Детали образца
    project_code: Optional[str] = Field(default=None, max_length=50)
    sample_index: Optional[str] = Field(default=None, max_length=50)

    # Дополнительные поля
    qc_1: Optional[float] = Field(default=None)
    qc_2: Optional[float] = Field(default=None)
    descr: Optional[str] = Field(default=None, max_length=5000)
    material_type: Optional[str] = Field(default=None, max_length=100)

    # Даты
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Внешние ключи
    user_id: Optional[int] = Field(foreign_key="app_user.id", index=True, default=None)

    # Связи
    user: Optional["User"] = Relationship(
        back_populates="samples",
        sa_relationship_kwargs={"foreign_keys": "[Sample.user_id]"},
    )

    # BatchSubsample (обратная связь)
    batches: List["Batch"] = Relationship(
        back_populates="samples",
        link_model=BatchSampleLink,
    )
    # tasks: List["Task"] = Relationship(
    #     back_populates="samples", link_model=TaskSampleLink
    # )

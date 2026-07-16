__all__ = ["BatchSubsample"]

from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .batch import Batch
    from .subsample import Subsample


class BatchSubsample(SQLModel, table=True):
    """Подобразец, входящий в состав батча. Связывает Subsample с Batch."""

    __tablename__ = "app_batchsubsample"

    id: int = Field(primary_key=True)

    # Внешние ключи
    batch_id: int = Field(foreign_key="app_batch.id", index=True)
    subsample_id: int = Field(foreign_key="app_subsample.id", index=True)

    # Даты
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

    # Связи
    batch: "Batch" = Relationship(back_populates="batch_subsamples")
    subsample: "Subsample" = Relationship(back_populates="batch_subsamples")

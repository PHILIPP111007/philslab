__all__ = ["BatchSubsampleLink"]

from sqlmodel import Field, SQLModel


class BatchSubsampleLink(SQLModel, table=True):
    """Связь Batch - Subsample (многие ко многим)"""

    __tablename__ = "app_batch_subsamples"

    batch_id: int = Field(foreign_key="app_batch.id", primary_key=True)
    subsample_id: int = Field(foreign_key="app_subsample.id", primary_key=True)

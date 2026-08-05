__all__ = ["BatchSampleLink"]

from sqlmodel import Field, SQLModel


class BatchSampleLink(SQLModel, table=True):
    """Связь Batch - Subsample (многие ко многим)"""

    __tablename__ = "app_batch_samples"

    batch_id: int = Field(foreign_key="app_batch.id", primary_key=True)
    sample_id: int = Field(foreign_key="app_sample.id", primary_key=True)

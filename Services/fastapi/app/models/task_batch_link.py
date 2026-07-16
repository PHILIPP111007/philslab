__all__ = ["TaskBatchLink"]

from sqlmodel import Field, SQLModel


class TaskBatchLink(SQLModel, table=True):
    """Связь Task - Batch (многие ко многим)"""

    __tablename__ = "app_task_batch_link"

    task_id: int = Field(foreign_key="app_task.id", primary_key=True)
    batch_id: int = Field(foreign_key="app_batch.id", primary_key=True)

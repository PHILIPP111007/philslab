__all__ = ["TaskSampleLink"]

from sqlmodel import Field, SQLModel


class TaskSampleLink(SQLModel, table=True):
    """Связь Task - Sample (многие ко многим)"""

    __tablename__ = "app_task_samples"

    task_id: int = Field(foreign_key="app_task.id", primary_key=True)
    sample_id: int = Field(foreign_key="app_sample.id", primary_key=True)

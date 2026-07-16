__all__ = ["TaskStageLink"]

from sqlmodel import Field, SQLModel


class TaskStageLink(SQLModel, table=True):
    """Связь Task - Stage (многие ко многим)"""

    __tablename__ = "app_task_stage_link"

    task_id: int = Field(foreign_key="app_task.id", primary_key=True)
    stage_id: int = Field(foreign_key="app_stage.id", primary_key=True)

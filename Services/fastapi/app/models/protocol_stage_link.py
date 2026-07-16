__all__ = ["ProtocolStageLink"]

from sqlmodel import Field, SQLModel


class ProtocolStageLink(SQLModel, table=True):
    """Связь Protocol - Stage (многие ко многим)"""

    __tablename__ = "app_protocol_stage_link"

    protocol_id: int = Field(foreign_key="app_protocol.id", primary_key=True)
    stage_id: int = Field(foreign_key="app_stage.id", primary_key=True)
